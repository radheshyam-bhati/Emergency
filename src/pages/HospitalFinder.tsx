import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bed,
  Brain,
  MapPin,
  Navigation,
  ShieldAlert,
  Stethoscope,
  Users,
  Wind,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import LiveMap from "@/components/LiveMap";
import { Input } from "@/components/ui/input";
import { useSimulation } from "@/hooks/useSimulation";
import type { EmergencySeverity } from "@/types/domain";

const conditions = [
  "Cardiac Arrest",
  "Stroke",
  "Road Accident",
  "Severe Burns",
  "Respiratory Distress",
  "Head Trauma",
  "Orthopedic Injury",
  "General Emergency",
];

const severities: EmergencySeverity[] = ["critical", "serious", "moderate", "minor"];

const HospitalFinder = () => {
  const { hospitals, previewDecision } = useSimulation();
  const [condition, setCondition] = useState("Cardiac Arrest");
  const [severity, setSeverity] = useState<EmergencySeverity>("critical");
  const [pickupAddress, setPickupAddress] = useState("Connaught Place, Delhi");
  const [pickupLatitude, setPickupLatitude] = useState("28.6315");
  const [pickupLongitude, setPickupLongitude] = useState("77.2167");
  const deferredCondition = useDeferredValue(condition);
  const deferredSeverity = useDeferredValue(severity);
  const deferredAddress = useDeferredValue(pickupAddress);
  const deferredLatitude = useDeferredValue(pickupLatitude);
  const deferredLongitude = useDeferredValue(pickupLongitude);

  const previewQuery = useQuery({
    queryKey: [
      "dispatch-preview",
      deferredCondition,
      deferredSeverity,
      deferredAddress,
      deferredLatitude,
      deferredLongitude,
    ],
    queryFn: () =>
      previewDecision({
        condition: deferredCondition,
        severity: deferredSeverity,
        pickupAddress: deferredAddress,
        pickupLatitude: Number(deferredLatitude),
        pickupLongitude: Number(deferredLongitude),
      }),
    enabled: Boolean(deferredCondition && deferredAddress && deferredLatitude && deferredLongitude),
  });

  const topHospitals = previewQuery.data?.ranking.slice(0, 3) ?? [];

  const mapHospitals = useMemo(
    () =>
      hospitals.map((hospital) => ({
        id: hospital.id,
        name: hospital.name,
        lat: hospital.lat,
        lng: hospital.lng,
        status: hospital.status,
      })),
    [hospitals],
  );

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Smart Emergency Allocation Engine</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          SEAE scores every hospital using distance, live capacity, specialist coverage, and severity weighting.
        </p>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-info" />
            <h2 className="text-sm font-semibold">SEAE Inputs</h2>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {conditions.map((option) => (
              <button
                key={option}
                onClick={() => setCondition(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  condition === option
                    ? "bg-emergency text-emergency-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {severities.map((option) => (
              <button
                key={option}
                onClick={() => setSeverity(option)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-colors ${
                  severity === option
                    ? "border-emergency bg-emergency/10 text-emergency"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input value={pickupAddress} onChange={(event) => setPickupAddress(event.target.value)} />
            <Input value={pickupLatitude} onChange={(event) => setPickupLatitude(event.target.value)} />
            <Input value={pickupLongitude} onChange={(event) => setPickupLongitude(event.target.value)} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold">Why the Choice Is Credible</h2>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Distance score rewards closer hospitals without blindly picking the nearest one.</p>
            <p>Critical cases heavily weight ICU capacity and specialist availability.</p>
            <p>Capacity penalties are applied when ICU, ER, or staffing levels drop.</p>
            <p>Every dispatch stores the full ranking snapshot for later review.</p>
          </div>
        </div>
      </div>

      <LiveMap
        hospitals={mapHospitals}
        className="mb-4 h-64 sm:mb-6 sm:h-80"
        showRouting
        routeOrigin={{
          lat: Number(pickupLatitude),
          lng: Number(pickupLongitude),
        }}
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Brain className="h-4 w-4 text-stable" />
        <h2 className="text-sm font-semibold">SEAE Ranking Snapshot</h2>
        <span className="text-[10px] text-muted-foreground">
          {previewQuery.isLoading ? "Calculating..." : `${previewQuery.data?.ranking.length ?? 0} hospitals evaluated`}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-3">
          {previewQuery.data?.ranking.map((hospital, index) => (
            <motion.div
              key={hospital.hospitalId}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className={`rounded-xl border bg-card p-4 sm:p-5 ${
                hospital.recommended ? "border-stable/40 ring-1 ring-stable/20" : "border-border"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold sm:text-base">{hospital.name}</h3>
                    {hospital.recommended && (
                      <span className="rounded-md bg-stable/10 px-2 py-0.5 text-[10px] font-bold text-stable">
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {hospital.penalties.length > 0 ? (
                      hospital.penalties.map((penalty) => (
                        <span key={penalty} className="rounded bg-warning/10 px-2 py-0.5 text-[10px] text-warning">
                          {penalty}
                        </span>
                      ))
                    ) : (
                      <span className="rounded bg-stable/10 px-2 py-0.5 text-[10px] text-stable">
                        No major penalties
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-mono text-2xl font-bold text-stable">{hospital.totalScore}</div>
                  <div className="text-[10px] text-muted-foreground">Total Score</div>
                  <div className="mt-1 text-[10px] font-medium text-muted-foreground">
                    {hospital.distanceKm} km · {hospital.etaMinutes} min ETA
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Navigation className="h-4 w-4 text-info" />
              <h2 className="text-sm font-semibold">Why This Hospital Was Chosen</h2>
            </div>

            {topHospitals[0] ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-stable/10 px-3 py-2">
                  <div className="text-sm font-semibold text-stable">{topHospitals[0].name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {topHospitals[0].distanceKm} km away · ETA {topHospitals[0].etaMinutes} min
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Distance Score
                    </div>
                    <div className="font-mono text-lg font-bold">{topHospitals[0].breakdown.distance}</div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Bed className="h-3 w-3" />
                      ICU / ER
                    </div>
                    <div className="font-mono text-lg font-bold">
                      {topHospitals[0].breakdown.icu + topHospitals[0].breakdown.er}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      Doctors
                    </div>
                    <div className="font-mono text-lg font-bold">{topHospitals[0].breakdown.doctors}</div>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center gap-1 text-muted-foreground">
                      <Stethoscope className="h-3 w-3" />
                      Specialty Match
                    </div>
                    <div className="font-mono text-lg font-bold">{topHospitals[0].breakdown.specialization}</div>
                  </div>
                </div>

                {previewQuery.data?.factors && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-lg border border-border p-3">
                      <div className="mb-1 text-muted-foreground">Pickup ETA</div>
                      <div className="font-mono text-lg font-bold">{previewQuery.data.factors.pickupEtaMinutes}m</div>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <div className="mb-1 text-muted-foreground">Transport ETA</div>
                      <div className="font-mono text-lg font-bold">{previewQuery.data.factors.transportEtaMinutes}m</div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Rejected Options
                  </div>
                  <div className="space-y-2">
                    {(previewQuery.data?.rejectedOptions ?? []).slice(0, 4).map((option) => (
                      <div key={`${option.kind}-${option.id}`} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{option.name}</span> · {option.reason}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hospital recommendation is available for the current inputs.</p>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Wind className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-semibold">Top 3 Snapshot</h2>
            </div>

            <div className="space-y-2">
              {topHospitals.map((hospital, index) => (
                <div key={hospital.hospitalId} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                  <div>
                    <div className="font-medium">#{index + 1} {hospital.name}</div>
                    <div className="text-muted-foreground">{hospital.distanceKm} km · {hospital.etaMinutes} min</div>
                  </div>
                  <div className="font-mono font-bold">{hospital.totalScore}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HospitalFinder;
