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
    // GET /ambulance-api — list all ambulances
    if (method === "GET" && path.length === 0) {
      const { data, error } = await serviceClient.from("ambulances").select("*");
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // GET /ambulance-api/emergencies — nearby active emergencies
    if (method === "GET" && path[0] === "emergencies") {
      const { data, error } = await serviceClient
        .from("emergency_requests")
        .select("*, patients(*)")
        .in("status", ["new", "dispatched", "in_transit"])
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    const auth = await getAuthUser(req);
    if (!auth) return json({ error: "Unauthorized" }, 401);

    // PUT /ambulance-api/location/:id — update GPS
    if (method === "PUT" && path[0] === "location" && path[1]) {
      const body = await req.json();
      const { current_latitude, current_longitude } = body;
      if (current_latitude == null || current_longitude == null) {
        return json({ error: "Missing latitude/longitude" }, 400);
      }
      const { data, error } = await serviceClient
        .from("ambulances")
        .update({ current_latitude, current_longitude })
        .eq("id", path[1])
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, data });
    }

    // POST /ambulance-api/accept/:emergencyId — accept emergency
    if (method === "POST" && path[0] === "accept" && path[1]) {
      const body = await req.json();
      const { ambulance_id } = body;
      if (!ambulance_id) return json({ error: "Missing ambulance_id" }, 400);

      // Update emergency
      const { error: eErr } = await serviceClient
        .from("emergency_requests")
        .update({ assigned_ambulance_id: ambulance_id, status: "dispatched" })
        .eq("id", path[1]);
      if (eErr) return json({ error: eErr.message }, 500);

      // Update ambulance status
      const { error: aErr } = await serviceClient
        .from("ambulances")
        .update({ status: "on_route" })
        .eq("id", ambulance_id);
      if (aErr) return json({ error: aErr.message }, 500);

      return json({ success: true, message: "Emergency accepted" });
    }

    // PUT /ambulance-api/status/:id — update ambulance status
    if (method === "PUT" && path[0] === "status" && path[1]) {
      const body = await req.json();
      const { data, error } = await serviceClient
        .from("ambulances")
        .update({ status: body.status })
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
