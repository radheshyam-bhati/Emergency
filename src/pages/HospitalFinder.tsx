import DashboardLayout from "@/components/DashboardLayout";
import { mockHospitals, Hospital } from "@/data/mockData";
import { useSimulation } from "@/hooks/useSimulation";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  MapPin, Building2, Bed, Wind, Users, Star, Search, Brain, ArrowRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ScoredHospital extends Hospital {
  score: number;
  reasons: string[];
  estimatedTime: string;
}

const conditions = [
  "Cardiac Arrest", "Stroke", "Road Accident", "Burns", "Respiratory Distress",
  "Head Trauma", "Orthopedic Injury", "General Emergency",
];

const conditionSpecialtyMap: Record<string, string[]> = {
  "Cardiac Arrest": ["Cardiology", "Cardiac Surgery"],
  "Stroke": ["Neurology", "Neurosurgery"],
  "Road Accident": ["Trauma", "Orthopedics", "General Surgery"],
  "Burns": ["Burns", "Trauma"],
  "Respiratory Distress": ["Pulmonology"],
  "Head Trauma": ["Neurology", "Neurosurgery", "Trauma"],
  "Orthopedic Injury": ["Orthopedics"],
  "General Emergency": [],
};

function scoreHospitals(hospitals: Hospital[], condition: string): ScoredHospital[] {
  const requiredSpecs = conditionSpecialtyMap[condition] || [];

  return hospitals
    .map((h) => {
      let score = 0;
      const reasons: string[] = [];

      const icuPct = h.icuBeds.available / h.icuBeds.total;
      const erPct = h.emergencyBeds.available / h.emergencyBeds.total;
      const bedScore = (icuPct * 20 + erPct * 10);
      score += bedScore;
      if (icuPct > 0.2) reasons.push(`${h.icuBeds.available} ICU beds available`);

      const docPct = h.doctors.available / h.doctors.total;
      score += docPct * 20;
      if (docPct > 0.2) reasons.push(`${h.doctors.available} doctors on duty`);

      if (requiredSpecs.length > 0) {
        const matches = requiredSpecs.filter((s) => h.specializations.includes(s));
        const specScore = (matches.length / requiredSpecs.length) * 25;
        score += specScore;
        if (matches.length > 0) reasons.push(`Specializes in ${matches.join(", ")}`);
      } else {
        score += 12;
      }

      const ventPct = h.ventilators.available / h.ventilators.total;
      score += ventPct * 15;
      if (ventPct > 0.2) reasons.push(`${h.ventilators.available} ventilators`);

      if (h.status === "critical") { score -= 15; reasons.push("⚠ Hospital at critical capacity"); }
      if (h.status === "offline") { score -= 50; reasons.push("⚠ Hospital offline"); }

      score += (h.rating / 5) * 10;

      const dist = Math.sqrt(Math.pow(h.lat - 28.56, 2) + Math.pow(h.lng - 77.22, 2));
      const timeMin = Math.round(5 + dist * 200 + Math.random() * 5);
      score -= timeMin * 0.5;
      reasons.push(`~${timeMin} min travel time`);

      return {
        ...h,
        score: Math.max(0, Math.round(score * 10) / 10),
        reasons,
        estimatedTime: `${timeMin} min`,
      };
    })
    .sort((a, b) => b.score - a.score);
}

const HospitalFinder = () => {
  const { hospitals } = useSimulation();
  const [condition, setCondition] = useState("Cardiac Arrest");
  const [searchMode, setSearchMode] = useState(false);

  const scored = useMemo(() => scoreHospitals(hospitals, condition), [hospitals, condition]);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">AI Hospital Finder</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Intelligent recommendation engine — finds the best hospital, not just the nearest
        </p>
      </div>

      {/* Condition Selector */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4 sm:mb-6 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-4 w-4 text-info" />
          <h2 className="text-sm font-semibold">Patient Condition</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {conditions.map((c) => (
            <button
              key={c}
              onClick={() => { setCondition(c); setSearchMode(true); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                condition === c
                  ? "bg-emergency text-emergency-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="mb-4 flex h-36 items-center justify-center rounded-xl border border-border bg-muted/30 grid-pattern sm:mb-6 sm:h-48">
        <div className="text-center">
          <MapPin className="mx-auto mb-2 h-6 w-6 text-emergency sm:h-8 sm:w-8" />
          <div className="text-xs font-medium text-muted-foreground sm:text-sm">Hospital Finder Map</div>
          <div className="text-[10px] text-muted-foreground">
            Showing {scored.length} hospitals ranked for "{condition}"
          </div>
        </div>
      </div>

      {/* AI Scored Results */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Brain className="h-4 w-4 text-stable" />
        <h2 className="text-sm font-semibold">AI Recommended Hospitals</h2>
        <span className="text-[10px] text-muted-foreground">
          — Scored by beds, specialists, distance, and capacity
        </span>
      </div>

      <div className="space-y-3">
        {scored.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`rounded-xl border bg-card p-4 sm:p-5 ${
              i === 0 ? "border-stable/40 ring-1 ring-stable/20" : "border-border"
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold sm:h-10 sm:w-10 ${
                  i === 0 ? "bg-stable/20 text-stable" : i < 3 ? "bg-info/10 text-info" : "bg-muted text-muted-foreground"
                }`}>
                  #{i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold sm:text-base">{h.name}</h3>
                    {i === 0 && (
                      <span className="rounded-md bg-stable/10 px-2 py-0.5 text-[10px] font-bold text-stable">
                        BEST MATCH
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{h.location} · {h.type}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {h.reasons.map((r, ri) => (
                      <span key={ri} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-0 sm:text-right">
                <div className={`font-mono text-xl font-bold sm:text-2xl ${
                  h.score > 50 ? "text-stable" : h.score > 30 ? "text-warning" : "text-emergency"
                }`}>
                  {h.score}
                </div>
                <div className="text-[10px] text-muted-foreground">AI Score</div>
                <div className="mt-1 rounded-md bg-emergency/10 px-2 py-0.5 text-[10px] font-bold text-emergency">
                  ETA {h.estimatedTime}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
              <div className="text-center">
                <Bed className="mx-auto h-3 w-3 text-muted-foreground" />
                <div className="text-xs font-mono font-medium">{h.icuBeds.available}/{h.icuBeds.total}</div>
                <div className="text-[9px] text-muted-foreground">ICU</div>
              </div>
              <div className="text-center">
                <Bed className="mx-auto h-3 w-3 text-muted-foreground" />
                <div className="text-xs font-mono font-medium">{h.emergencyBeds.available}/{h.emergencyBeds.total}</div>
                <div className="text-[9px] text-muted-foreground">Emergency</div>
              </div>
              <div className="text-center">
                <Wind className="mx-auto h-3 w-3 text-muted-foreground" />
                <div className="text-xs font-mono font-medium">{h.ventilators.available}/{h.ventilators.total}</div>
                <div className="text-[9px] text-muted-foreground">Ventilators</div>
              </div>
              <div className="text-center">
                <Users className="mx-auto h-3 w-3 text-muted-foreground" />
                <div className="text-xs font-mono font-medium">{h.doctors.available}/{h.doctors.total}</div>
                <div className="text-[9px] text-muted-foreground">Doctors</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default HospitalFinder;
