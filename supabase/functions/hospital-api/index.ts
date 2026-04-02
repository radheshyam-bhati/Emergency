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
  const path = url.pathname.split("/").filter(Boolean).slice(1); // remove function name
  const method = req.method;

  // Public read endpoints
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET /hospital-api — list all hospitals with resources
    if (method === "GET" && path.length === 0) {
      const { data, error } = await serviceClient
        .from("hospitals")
        .select("*, hospital_resources(*), doctors(*)");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /hospital-api/dashboard/:id
    if (method === "GET" && path[0] === "dashboard" && path[1]) {
      const hospitalId = path[1];
      const [hospRes, resourcesRes, doctorsRes, emergenciesRes] = await Promise.all([
        serviceClient.from("hospitals").select("*").eq("id", hospitalId).single(),
        serviceClient.from("hospital_resources").select("*").eq("hospital_id", hospitalId).single(),
        serviceClient.from("doctors").select("*").eq("hospital_id", hospitalId),
        serviceClient.from("emergency_requests").select("*").eq("assigned_hospital_id", hospitalId).neq("status", "resolved"),
      ]);
      return json({
        success: true,
        data: {
          hospital: hospRes.data,
          resources: resourcesRes.data,
          doctors: doctorsRes.data,
          activeEmergencies: emergenciesRes.data,
        },
      });
    }

    // Auth-required endpoints
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);

    // POST /hospital-api/register — register hospital
    if (method === "POST" && path[0] === "register") {
      const body = await req.json();
      const { name, address, city, latitude, longitude, contact_number, specialization } = body;
      if (!name || !address || latitude == null || longitude == null) {
        return json({ error: "Missing required fields: name, address, latitude, longitude" }, 400);
      }
      const { data, error } = await serviceClient.from("hospitals").insert({
        name, address, city: city || "New Delhi", latitude, longitude,
        contact_number, specialization: specialization || [],
      }).select().single();
      if (error) return json({ error: error.message }, 500);

      // Also create empty resources row
      await serviceClient.from("hospital_resources").insert({ hospital_id: data.id });
      return json({ success: true, data }, 201);
    }

    // PUT /hospital-api/resources/:hospitalId
    if (method === "PUT" && path[0] === "resources" && path[1]) {
      const body = await req.json();
      const { data, error } = await serviceClient
        .from("hospital_resources")
        .update({ ...body, last_updated: new Date().toISOString() })
        .eq("hospital_id", path[1])
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // PUT /hospital-api/doctor/:doctorId
    if (method === "PUT" && path[0] === "doctor" && path[1]) {
      const body = await req.json();
      const { data, error } = await serviceClient
        .from("doctors")
        .update(body)
        .eq("id", path[1])
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
