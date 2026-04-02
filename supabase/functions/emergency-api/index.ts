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
    // GET /emergency-api — list active emergencies
    if (method === "GET" && path.length === 0) {
      const { data, error } = await serviceClient
        .from("emergency_requests")
        .select("*, patients(*), hospitals!assigned_hospital_id(*), ambulances!assigned_ambulance_id(*)")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /emergency-api/best-hospitals?lat=x&lng=y&radius=z
    if (method === "GET" && path[0] === "best-hospitals") {
      const lat = parseFloat(url.searchParams.get("lat") || "28.6315");
      const lng = parseFloat(url.searchParams.get("lng") || "77.2167");
      const radius = parseFloat(url.searchParams.get("radius") || "15");
      const { data, error } = await serviceClient.rpc("find_hospitals_in_radius", {
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radius,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // Auth-required
    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);

    // POST /emergency-api — create emergency
    if (method === "POST" && path.length === 0) {
      const body = await req.json();
      const { patient_id, condition_type, severity, pickup_latitude, pickup_longitude, pickup_address } = body;
      if (!condition_type || pickup_latitude == null || pickup_longitude == null) {
        return json({ error: "Missing required: condition_type, pickup_latitude, pickup_longitude" }, 400);
      }
      const { data, error } = await serviceClient
        .from("emergency_requests")
        .insert({
          patient_id, condition_type, severity: severity || "moderate",
          pickup_latitude, pickup_longitude, pickup_address,
        })
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data }, 201);
    }

    // POST /emergency-api/assign-ambulance
    if (method === "POST" && path[0] === "assign-ambulance") {
      const { emergency_id, ambulance_id } = await req.json();
      if (!emergency_id || !ambulance_id) return json({ error: "Missing emergency_id or ambulance_id" }, 400);

      await serviceClient.from("emergency_requests")
        .update({ assigned_ambulance_id: ambulance_id, status: "dispatched" })
        .eq("id", emergency_id);
      await serviceClient.from("ambulances")
        .update({ status: "on_route" })
        .eq("id", ambulance_id);

      return json({ success: true, message: "Ambulance assigned" });
    }

    // POST /emergency-api/reserve-bed
    if (method === "POST" && path[0] === "reserve-bed") {
      const { emergency_id, hospital_id, bed_type } = await req.json();
      if (!emergency_id || !hospital_id) return json({ error: "Missing emergency_id or hospital_id" }, 400);

      const type = bed_type || "emergency_beds";
      const col = `${type}_available`;

      // Get current count
      const { data: res } = await serviceClient
        .from("hospital_resources")
        .select(col)
        .eq("hospital_id", hospital_id)
        .single();

      const resourceAvailability = res as Record<string, number> | null;
      const availableBeds = resourceAvailability?.[col] ?? 0;

      if (availableBeds <= 0) return json({ error: "No beds available" }, 409);

      // Decrement
      await serviceClient
        .from("hospital_resources")
        .update({ [col]: availableBeds - 1, last_updated: new Date().toISOString() })
        .eq("hospital_id", hospital_id);

      // Assign hospital
      await serviceClient
        .from("emergency_requests")
        .update({ assigned_hospital_id: hospital_id })
        .eq("id", emergency_id);

      return json({ success: true, message: `${type} reserved at hospital` });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
