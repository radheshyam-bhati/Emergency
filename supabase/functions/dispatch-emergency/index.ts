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

// ── OSRM free routing for real ETAs ──
async function fetchOSRMEta(
  originLat: number, originLng: number,
  destLat: number, destLng: number
): Promise<{ distanceKm: number; etaMinutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    return {
      distanceKm: Math.round((data.routes[0].distance / 1000) * 10) / 10,
      etaMinutes: Math.round(data.routes[0].duration / 60),
    };
  } catch {
    return null;
  }
}

// ── Haversine fallback ──
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Condition → Specialty mapping ──
const CONDITION_SPECIALTIES: Record<string, string[]> = {
  cardiac_arrest: ["Cardiology", "Cardiac Surgery"],
  heart_attack: ["Cardiology", "Cardiac Surgery"],
  stroke: ["Neurology", "Neurosurgery"],
  road_accident: ["Trauma", "Orthopedics", "General Surgery"],
  severe_burns: ["Burns", "Trauma"],
  respiratory_distress: ["Pulmonology"],
  head_trauma: ["Neurology", "Neurosurgery", "Trauma"],
  orthopedic_injury: ["Orthopedics"],
  chest_pain: ["Cardiology"],
  kidney_failure: ["Nephrology"],
  general_emergency: [],
};

function normalizeCondition(raw: string): string {
  return raw.toLowerCase().replace(/[\s\-—]+/g, "_").replace(/[^a-z_]/g, "");
}

// ── Scoring weights ──
const W = { TRAVEL_TIME: 35, ICU_AVAILABILITY: 25, DOCTOR_MATCH: 25, SPECIALIZATION: 15 };

interface HospitalRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  specialization: string[];
  status: string;
  hospital_resources: {
    icu_beds_available: number;
    icu_beds_total: number;
    emergency_beds_available: number;
    emergency_beds_total: number;
    ventilators_available: number;
    ventilators_total: number;
  }[];
  doctors: {
    id: string;
    name: string;
    specialization: string;
    availability_status: string;
  }[];
}

interface ScoredHospital {
  hospital_id: string;
  hospital_name: string;
  score: number;
  distance_km: number;
  eta_minutes: number;
  icu_available: number;
  er_available: number;
  ventilators_available: number;
  matched_doctors: string[];
  matched_specializations: string[];
  reasons: string[];
  breakdown: { travel_time: number; icu_availability: number; doctor_match: number; specialization: number };
}

function scoreHospital(
  h: HospitalRow,
  distKm: number,
  etaMin: number,
  requiredSpecs: string[]
): ScoredHospital {
  const res = Array.isArray(h.hospital_resources) ? h.hospital_resources[0] : h.hospital_resources;
  const reasons: string[] = [];

  // Travel — ETA-first (this is the key differentiator)
  const travelScore = Math.max(0, W.TRAVEL_TIME * (1 - etaMin / 40));

  // ICU/ER availability
  let icuScore = 0;
  if (res) {
    const icuPct = res.icu_beds_available / Math.max(res.icu_beds_total, 1);
    const erPct = res.emergency_beds_available / Math.max(res.emergency_beds_total, 1);
    icuScore = W.ICU_AVAILABILITY * (icuPct * 0.6 + erPct * 0.4);
    if (res.icu_beds_available > 0) reasons.push(`${res.icu_beds_available} ICU beds`);
    if (res.emergency_beds_available > 0) reasons.push(`${res.emergency_beds_available} ER beds`);
    if (res.ventilators_available > 0) reasons.push(`${res.ventilators_available} ventilators`);
  }

  // Doctor match
  const availDocs = (h.doctors || []).filter(d => d.availability_status === "available" || d.availability_status === "on_duty");
  const matchedDocs = requiredSpecs.length > 0
    ? availDocs.filter(d => requiredSpecs.includes(d.specialization))
    : availDocs;
  const docScore = matchedDocs.length > 0
    ? W.DOCTOR_MATCH * Math.min(1, matchedDocs.length / Math.max(requiredSpecs.length, 1))
    : requiredSpecs.length === 0 ? W.DOCTOR_MATCH * 0.5 : 0;
  if (matchedDocs.length > 0) reasons.push(`Dr. ${matchedDocs.map(d => d.name).join(", ")} available`);

  // Specialization
  const matchedSpecs = requiredSpecs.filter(s => h.specialization?.includes(s));
  const specScore = requiredSpecs.length > 0
    ? W.SPECIALIZATION * (matchedSpecs.length / requiredSpecs.length)
    : W.SPECIALIZATION * 0.5;
  if (matchedSpecs.length > 0) reasons.push(`Specializes: ${matchedSpecs.join(", ")}`);

  // Status penalty
  let penalty = 0;
  if (h.status === "critical") { penalty = 15; reasons.push("⚠ Critical load"); }
  if (h.status === "offline") { penalty = 100; }

  const totalScore = Math.max(0, Math.round((travelScore + icuScore + docScore + specScore - penalty) * 10) / 10);
  reasons.push(`ETA ~${etaMin} min · ${distKm} km`);

  return {
    hospital_id: h.id,
    hospital_name: h.name,
    score: totalScore,
    distance_km: distKm,
    eta_minutes: etaMin,
    icu_available: res?.icu_beds_available ?? 0,
    er_available: res?.emergency_beds_available ?? 0,
    ventilators_available: res?.ventilators_available ?? 0,
    matched_doctors: matchedDocs.map(d => d.name),
    matched_specializations: matchedSpecs,
    reasons,
    breakdown: {
      travel_time: Math.round(travelScore * 10) / 10,
      icu_availability: Math.round(icuScore * 10) / 10,
      doctor_match: Math.round(docScore * 10) / 10,
      specialization: Math.round(specScore * 10) / 10,
    },
  };
}

// ════════════════════════════════════════════════════════
// MAIN HANDLER — Full emergency dispatch orchestrator
// ════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const start = performance.now();

  try {
    if (req.method !== "POST") return json({ error: "POST only" }, 405);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const {
      condition_type,
      severity = "moderate",
      pickup_latitude,
      pickup_longitude,
      pickup_address,
      patient_id,
      patient_name,
      patient_phone,
      bed_type = "emergency_beds",
    } = body;

    if (!condition_type || pickup_latitude == null || pickup_longitude == null) {
      return json({ error: "Missing: condition_type, pickup_latitude, pickup_longitude" }, 400);
    }

    const steps: { step: string; status: string; detail?: string; duration_ms?: number }[] = [];
    const stepStart = () => performance.now();
    const stepEnd = (name: string, status: string, detail: string, t: number) => {
      steps.push({ step: name, status, detail, duration_ms: Math.round(performance.now() - t) });
    };

    // ─── STEP 1: Create emergency request ───
    let t = stepStart();
    const { data: emergency, error: emErr } = await serviceClient
      .from("emergency_requests")
      .insert({
        condition_type,
        severity,
        pickup_latitude,
        pickup_longitude,
        pickup_address: pickup_address || null,
        patient_id: patient_id || null,
      })
      .select()
      .single();

    if (emErr || !emergency) {
      stepEnd("create_emergency", "failed", emErr?.message || "Unknown error", t);
      return json({ success: false, steps, error: "Failed to create emergency" }, 500);
    }
    stepEnd("create_emergency", "success", `Emergency ${emergency.id} created`, t);

    // ─── STEP 2: Find nearest ambulance ───
    t = stepStart();
    const { data: nearestAmb } = await serviceClient.rpc("find_nearest_ambulance", {
      p_lat: pickup_latitude,
      p_lng: pickup_longitude,
    });

    const ambulance = nearestAmb?.[0] || null;
    if (ambulance) {
      // Dispatch it
      await serviceClient.from("ambulances")
        .update({ status: "on_route" })
        .eq("id", ambulance.ambulance_id);

      await serviceClient.from("emergency_requests")
        .update({ assigned_ambulance_id: ambulance.ambulance_id, status: "dispatched" })
        .eq("id", emergency.id);

      stepEnd("dispatch_ambulance", "success",
        `${ambulance.vehicle_number} dispatched (${ambulance.distance_km.toFixed(1)} km away)`, t);
    } else {
      stepEnd("dispatch_ambulance", "warning", "No ambulances available — queued", t);
    }

    // ─── STEP 3: AI Hospital Recommendation with OSRM ETAs ───
    t = stepStart();
    const normalizedCond = normalizeCondition(condition_type);
    const requiredSpecs = CONDITION_SPECIALTIES[normalizedCond] || [];

    const { data: hospitals, error: hospErr } = await serviceClient
      .from("hospitals")
      .select("id, name, latitude, longitude, specialization, status, hospital_resources(icu_beds_total, icu_beds_available, emergency_beds_total, emergency_beds_available, ventilators_total, ventilators_available), doctors(id, name, specialization, availability_status)")
      .neq("status", "offline");

    if (hospErr || !hospitals?.length) {
      stepEnd("ai_recommendation", "failed", hospErr?.message || "No hospitals found", t);
      return json({ success: false, steps, emergency_id: emergency.id, error: "No hospitals available" }, 500);
    }

    // Fetch OSRM ETAs in parallel for all hospitals
    const origin = ambulance
      ? { lat: ambulance.current_latitude, lng: ambulance.current_longitude }
      : { lat: pickup_latitude, lng: pickup_longitude };

    const etaResults = await Promise.all(
      (hospitals as HospitalRow[]).map(async (hospital) => {
        const osrm = await fetchOSRMEta(origin.lat, origin.lng, hospital.latitude, hospital.longitude);
        if (osrm) return { id: hospital.id, distanceKm: osrm.distanceKm, etaMinutes: osrm.etaMinutes };
        // Fallback to haversine
        const dist = haversine(origin.lat, origin.lng, hospital.latitude, hospital.longitude);
        return { id: hospital.id, distanceKm: Math.round(dist * 10) / 10, etaMinutes: Math.round((dist / 25) * 60 + 2) };
      })
    );

    const etaMap = new Map(etaResults.map(r => [r.id, r]));

    const scored: ScoredHospital[] = (hospitals as HospitalRow[])
      .map(h => {
        const eta = etaMap.get(h.id)!;
        return scoreHospital(h, eta.distanceKm, eta.etaMinutes, requiredSpecs);
      })
      .sort((a, b) => b.score - a.score);

    const bestHospital = scored[0];
    stepEnd("ai_recommendation", "success",
      `${bestHospital.hospital_name} (score: ${bestHospital.score}, ETA: ${bestHospital.eta_minutes}m)`, t);

    // ─── STEP 4: Reserve bed atomically ───
    t = stepStart();
    const { data: reserved } = await serviceClient.rpc("reserve_bed", {
      p_hospital_id: bestHospital.hospital_id,
      p_bed_type: severity === "critical" ? "icu_beds" : bed_type,
    });

    if (reserved) {
      await serviceClient.from("emergency_requests")
        .update({ assigned_hospital_id: bestHospital.hospital_id })
        .eq("id", emergency.id);

      stepEnd("reserve_bed", "success",
        `${severity === "critical" ? "ICU" : "ER"} bed reserved at ${bestHospital.hospital_name}`, t);
    } else {
      // Try next hospital
      let fallback = false;
      for (let i = 1; i < scored.length; i++) {
        const { data: fb } = await serviceClient.rpc("reserve_bed", {
          p_hospital_id: scored[i].hospital_id,
          p_bed_type: severity === "critical" ? "icu_beds" : bed_type,
        });
        if (fb) {
          await serviceClient.from("emergency_requests")
            .update({ assigned_hospital_id: scored[i].hospital_id })
            .eq("id", emergency.id);
          stepEnd("reserve_bed", "fallback",
            `Bed reserved at ${scored[i].hospital_name} (fallback #${i + 1})`, t);
          fallback = true;
          break;
        }
      }
      if (!fallback) {
        stepEnd("reserve_bed", "failed", "No beds available at any hospital", t);
      }
    }

    // ─── STEP 5: Store route in routes table ───
    t = stepStart();
    const assignedHospId = scored.find((_, i) => i === 0)?.hospital_id;
    if (assignedHospId && bestHospital) {
      const trafficLevel = bestHospital.eta_minutes > 20 ? "heavy" : bestHospital.eta_minutes > 10 ? "moderate" : "low";
      await serviceClient.from("routes").insert({
        emergency_id: emergency.id,
        hospital_id: bestHospital.hospital_id,
        distance_km: bestHospital.distance_km,
        estimated_time: bestHospital.eta_minutes,
        traffic_level: trafficLevel,
        ai_score: bestHospital.score,
      });
      stepEnd("store_route", "success", `Route stored: ${bestHospital.distance_km}km, ${trafficLevel} traffic`, t);
    }

    // ─── STEP 6: Update emergency with ETA ───
    await serviceClient.from("emergency_requests")
      .update({
        eta: `${bestHospital.eta_minutes} min`,
        status: ambulance ? "dispatched" : "new",
      })
      .eq("id", emergency.id);

    const totalMs = Math.round(performance.now() - start);

    return json({
      success: true,
      emergency_id: emergency.id,
      recommended_hospital: bestHospital.hospital_name,
      hospital_id: bestHospital.hospital_id,
      eta_minutes: bestHospital.eta_minutes,
      distance_km: bestHospital.distance_km,
      ai_score: bestHospital.score,
      ambulance: ambulance ? {
        id: ambulance.ambulance_id,
        vehicle_number: ambulance.vehicle_number,
        type: ambulance.ambulance_type,
        crew: ambulance.crew,
        distance_km: ambulance.distance_km,
      } : null,
      all_recommendations: scored.slice(0, 5),
      steps,
      total_time_ms: totalMs,
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
