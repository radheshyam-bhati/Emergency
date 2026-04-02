import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims) return null;

  const userId = data.claims.sub as string;
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  const { data: roleData } = await serviceClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .single();

  if (!roleData) return null;
  return { userId, serviceClient };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).slice(1);
  const method = req.method;

  try {
    const admin = await requireAdmin(req);
    if (!admin) return json({ error: "Admin access required" }, 403);
    const { serviceClient } = admin;

    // GET /admin-api/overview — system-wide stats
    if (method === "GET" && path[0] === "overview") {
      const [hospitals, ambulances, emergencies, patients] = await Promise.all([
        serviceClient.from("hospitals").select("id, name, status", { count: "exact" }),
        serviceClient.from("ambulances").select("id, status", { count: "exact" }),
        serviceClient.from("emergency_requests").select("id, status, severity", { count: "exact" }),
        serviceClient.from("patients").select("id", { count: "exact" }),
      ]);
      return json({
        success: true,
        data: {
          totalHospitals: hospitals.count,
          hospitalsByStatus: groupBy(hospitals.data || [], "status"),
          totalAmbulances: ambulances.count,
          ambulancesByStatus: groupBy(ambulances.data || [], "status"),
          totalEmergencies: emergencies.count,
          emergenciesByStatus: groupBy(emergencies.data || [], "status"),
          emergenciesBySeverity: groupBy(emergencies.data || [], "severity"),
          totalPatients: patients.count,
        },
      });
    }

    // GET /admin-api/resources — all hospital resources
    if (method === "GET" && path[0] === "resources") {
      const { data, error } = await serviceClient
        .from("hospital_resources")
        .select("*, hospitals(name, status)");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /admin-api/ambulance-tracking — all ambulance positions
    if (method === "GET" && path[0] === "ambulance-tracking") {
      const { data, error } = await serviceClient
        .from("ambulances")
        .select("*");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /admin-api/emergency-analytics
    if (method === "GET" && path[0] === "emergency-analytics") {
      const { data, error } = await serviceClient
        .from("emergency_requests")
        .select("id, condition_type, severity, status, created_at, resolved_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return json({ error: error.message }, 500);

      const resolved = (data || []).filter(e => e.resolved_at);
      const avgResponseMs = resolved.length > 0
        ? resolved.reduce((sum, e) => sum + (new Date(e.resolved_at!).getTime() - new Date(e.created_at).getTime()), 0) / resolved.length
        : 0;

      return json({
        success: true,
        data: {
          recentEmergencies: data,
          totalCount: data?.length,
          resolvedCount: resolved.length,
          avgResponseTimeMinutes: Math.round(avgResponseMs / 60000),
          bySeverity: groupBy(data || [], "severity"),
          byCondition: groupBy(data || [], "condition_type"),
        },
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});

function groupBy<T>(arr: T[], key: keyof T): Record<string, number> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
