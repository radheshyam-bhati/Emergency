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

async function getAuthUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims) return null;
  return { userId: data.claims.sub as string, supabase };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const path = url.pathname.split("/").filter(Boolean).slice(1);
  const method = req.method;

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET /patient-api — list patients (public read)
    if (method === "GET" && path.length === 0) {
      const { data, error } = await serviceClient.from("patients").select("*");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /patient-api/:id — patient profile + emergency history
    if (method === "GET" && path.length === 1) {
      const [patientRes, emergencyRes] = await Promise.all([
        serviceClient.from("patients").select("*").eq("id", path[0]).single(),
        serviceClient.from("emergency_requests").select("*, hospitals!assigned_hospital_id(name), ambulances!assigned_ambulance_id(vehicle_number)").eq("patient_id", path[0]).order("created_at", { ascending: false }),
      ]);
      if (patientRes.error) return json({ error: "Patient not found" }, 404);
      return json({ success: true, data: { patient: patientRes.data, emergencyHistory: emergencyRes.data } });
    }

    // Auth-required
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);

    // POST /patient-api — create patient
    if (method === "POST" && path.length === 0) {
      const body = await req.json();
      if (!body.name) return json({ error: "Missing required: name" }, 400);
      const { data, error } = await serviceClient
        .from("patients")
        .insert(body)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    // PUT /patient-api/:id — update patient
    if (method === "PUT" && path.length === 1) {
      const body = await req.json();
      const { data, error } = await serviceClient
        .from("patients")
        .update(body)
        .eq("id", path[0])
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
