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

// ── OSRM free routing ──
async function fetchOSRMEta(
  oLat: number, oLng: number, dLat: number, dLng: number
): Promise<{ distanceKm: number; etaMinutes: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    return {
      distanceKm: Math.round((data.routes[0].distance / 1000) * 10) / 10,
      etaMinutes: Math.round(data.routes[0].duration / 60),
    };
  } catch { return null; }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CONDITION_SPECIALTIES: Record<string, string[]> = {
  heart_attack: ["Cardiology", "Cardiac Surgery"],
  cardiac_arrest: ["Cardiology", "Cardiac Surgery"],
  stroke: ["Neurology", "Neurosurgery"],
  road_accident: ["Trauma", "Orthopedics", "General Surgery"],
  severe_burns: ["Burns", "Trauma"],
  burns: ["Burns", "Trauma"],
  respiratory_distress: ["Pulmonology"],
  head_trauma: ["Neurology", "Neurosurgery", "Trauma"],
  orthopedic_injury: ["Orthopedics"],
  chest_pain: ["Cardiology"],
  kidney_failure: ["Nephrology"],
  cancer_emergency: ["Oncology"],
  transplant: ["Transplant"],
  general: [],
  general_emergency: [],
};

function normalizeCondition(raw: string): string {
  return raw.toLowerCase().replace(/[\s\-—]+/g, "_").replace(/[^a-z_]/g, "");
}

const W = { TRAVEL_TIME: 35, ICU_AVAILABILITY: 25, DOCTOR_MATCH: 25, SPECIALIZATION: 15 };

interface HospitalRow {
  id: string; name: string; latitude: number; longitude: number;
  specialization: string[]; status: string; rating: number;
  hospital_resources: { icu_beds_total: number; icu_beds_available: number; emergency_beds_total: number; emergency_beds_available: number; ventilators_total: number; ventilators_available: number; }[];
  doctors: { id: string; name: string; specialization: string; availability_status: string; }[];
}

function scoreHospital(h: HospitalRow, distKm: number, etaMin: number, requiredSpecs: string[]) {
  const res = Array.isArray(h.hospital_resources) ? h.hospital_resources[0] : h.hospital_resources;
  const reasons: string[] = [];

  const travelScore = Math.max(0, W.TRAVEL_TIME * (1 - etaMin / 40));

  let icuScore = 0;
  if (res) {
    const icuPct = res.icu_beds_available / Math.max(res.icu_beds_total, 1);
    const erPct = res.emergency_beds_available / Math.max(res.emergency_beds_total, 1);
    icuScore = W.ICU_AVAILABILITY * (icuPct * 0.6 + erPct * 0.4);
    if (res.icu_beds_available > 0) reasons.push(`${res.icu_beds_available} ICU beds`);
    if (res.emergency_beds_available > 0) reasons.push(`${res.emergency_beds_available} ER beds`);
    if (res.ventilators_available > 0) reasons.push(`${res.ventilators_available} ventilators`);
  }

  const availDocs = (h.doctors || []).filter(d => d.availability_status === "available" || d.availability_status === "on_duty");
  const matchedDocs = requiredSpecs.length > 0 ? availDocs.filter(d => requiredSpecs.includes(d.specialization)) : availDocs;
  const docScore = matchedDocs.length > 0
    ? W.DOCTOR_MATCH * Math.min(1, matchedDocs.length / Math.max(requiredSpecs.length, 1))
    : requiredSpecs.length === 0 ? W.DOCTOR_MATCH * 0.5 : 0;
  if (matchedDocs.length > 0) reasons.push(`${matchedDocs.map(d => d.name).join(", ")} available`);

  const matchedSpecs = requiredSpecs.filter(s => h.specialization?.includes(s));
  const specScore = requiredSpecs.length > 0 ? W.SPECIALIZATION * (matchedSpecs.length / requiredSpecs.length) : W.SPECIALIZATION * 0.5;
  if (matchedSpecs.length > 0) reasons.push(`Specializes: ${matchedSpecs.join(", ")}`);

  let penalty = 0;
  if (h.status === "critical") { penalty = 15; reasons.push("⚠ Critical load"); }
  if (h.status === "offline") penalty = 100;

  const totalScore = Math.max(0, Math.round((travelScore + icuScore + docScore + specScore - penalty) * 10) / 10);
  reasons.push(`ETA ~${etaMin} min · ${distKm} km`);

  return {
    hospital_id: h.id, hospital_name: h.name, score: totalScore,
    distance_km: distKm, eta_minutes: etaMin,
    icu_available: res?.icu_beds_available ?? 0, er_available: res?.emergency_beds_available ?? 0,
    ventilators_available: res?.ventilators_available ?? 0,
    matched_doctors: matchedDocs.map(d => d.name), matched_specializations: matchedSpecs, reasons,
    breakdown: {
      travel_time: Math.round(travelScore * 10) / 10,
      icu_availability: Math.round(icuScore * 10) / 10,
      doctor_match: Math.round(docScore * 10) / 10,
      specialization: Math.round(specScore * 10) / 10,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const start = performance.now();

  try {
    if (req.method !== "POST") return json({ error: "POST only" }, 405);

    const body = await req.json();
    const { condition = "general", latitude, longitude, radius_km = 15, top_n = 5 } = body;
    if (latitude == null || longitude == null) return json({ error: "Missing: latitude, longitude" }, 400);

    const normalizedCondition = normalizeCondition(condition);
    const requiredSpecs = CONDITION_SPECIALTIES[normalizedCondition] || [];

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: hospitals, error } = await serviceClient
      .from("hospitals")
      .select("id, name, latitude, longitude, specialization, status, rating, hospital_resources(icu_beds_total, icu_beds_available, emergency_beds_total, emergency_beds_available, ventilators_total, ventilators_available), doctors(id, name, specialization, availability_status)")
      .neq("status", "offline");

    if (error) return json({ error: error.message }, 500);

    // Fetch OSRM ETAs in parallel
    const etaResults = await Promise.all(
      ((hospitals || []) as HospitalRow[]).map(async (hospital) => {
        const osrm = await fetchOSRMEta(latitude, longitude, hospital.latitude, hospital.longitude);
        if (osrm) return { id: hospital.id, ...osrm };
        const dist = haversine(latitude, longitude, hospital.latitude, hospital.longitude);
        return {
          id: hospital.id,
          distanceKm: Math.round(dist * 10) / 10,
          etaMinutes: Math.round((dist / 25) * 60 + 2),
        };
      })
    );
    const etaMap = new Map(etaResults.map(r => [r.id, r]));

    const scored = (hospitals as HospitalRow[])
      .map(h => {
        const eta = etaMap.get(h.id)!;
        return scoreHospital(h, eta.distanceKm, eta.etaMinutes, requiredSpecs);
      })
      .filter(h => h.distance_km <= radius_km)
      .sort((a, b) => b.score - a.score)
      .slice(0, top_n);

    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    const best = scored[0];

    return json({
      success: true,
      query: { condition: normalizedCondition, required_specializations: requiredSpecs, location: { latitude, longitude }, radius_km },
      recommended_hospital: best?.hospital_name ?? null,
      eta_minutes: best?.eta_minutes ?? null,
      distance_km: best?.distance_km ?? null,
      score: best?.score ?? 0,
      reason: best?.reasons.join(" · ") ?? "No hospitals found",
      scoring_weights: W,
      all_recommendations: scored,
      response_time_ms: elapsed,
    });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
});
