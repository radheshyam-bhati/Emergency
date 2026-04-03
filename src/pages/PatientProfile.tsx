import DashboardLayout from "@/components/DashboardLayout";
import { useSimulation } from "@/hooks/useSimulation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, User, Phone, MapPin,
  AlertTriangle, FileText, Clock, Building2, Search, Ambulance,
  ShieldCheck, HeartPulse, Route,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import DecisionReplayPanel from "@/components/DecisionReplayPanel";
import FallbackStrategyBanner from "@/components/FallbackStrategyBanner";
import { getDispatch } from "@/api/dispatch";
import { formatRelativeTime } from "@/lib/time";
import type { Emergency } from "@/types/domain";

const InfoCard = ({ label, value, icon: Icon, alert }: {
  label: string; value: string; icon: React.ElementType; alert?: boolean;
}) => (
  <div className={`rounded-xl border p-3 sm:p-4 ${alert ? "border-emergency/30 bg-emergency/5" : "border-border bg-card"}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground sm:text-xs">{label}</span>
      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${alert ? "text-emergency" : "text-muted-foreground"}`} />
    </div>
    <div className="mt-1 font-mono text-xl font-bold sm:mt-2 sm:text-2xl">{value}</div>
  </div>
);

const statusTone: Record<string, string> = {
  pending: "text-warning",
  queued: "text-warning",
  assigned: "text-info",
  "in-transit": "text-emergency",
  arrived: "text-stable",
  completed: "text-stable",
  cancelled: "text-muted-foreground",
};

const severitySummary: Record<Emergency["severity"], string> = {
  critical: "Immediate intervention required",
  serious: "Fast intervention recommended",
  moderate: "Stable but time-sensitive",
  minor: "Lower-acuity incident intake",
};

const PatientDetail = ({
  patient,
  dispatchDetail,
}: {
  patient: Emergency;
  dispatchDetail?: Awaited<ReturnType<typeof getDispatch>> | null;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4 sm:space-y-6"
  >
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary sm:h-14 sm:w-14">
          <User className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold sm:text-xl">{patient.patientName}</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">{patient.condition} · {patient.severity}</p>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{patient.patientPhone ?? "No phone captured"}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{patient.pickupAddress}</span>
          </div>
        </div>
      </div>
      <div className={`rounded-lg bg-emergency/10 px-3 py-1.5 text-xs font-semibold ${statusTone[patient.status] ?? "text-emergency"}`}>
        {patient.status.replace("-", " ")}
      </div>
    </div>

    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-emergency" /> Live Dispatch Snapshot
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <InfoCard label="Severity" value={patient.severity.toUpperCase()} icon={HeartPulse} alert={patient.severity === "critical"} />
        <InfoCard label="Queue State" value={patient.queueReason ?? "ACTIVE"} icon={AlertTriangle} alert={Boolean(patient.queueReason)} />
        <InfoCard label="ETA" value={patient.dispatch?.etaMinutes ? `${patient.dispatch.etaMinutes} min` : "Pending"} icon={Route} />
        <InfoCard label="Last Update" value={formatRelativeTime(patient.updatedAt)} icon={Clock} />
      </div>
    </div>

    <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-info" /> Incident Summary
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="rounded-lg bg-muted px-3 py-2 font-medium text-foreground">{patient.condition}</div>
          <p>{severitySummary[patient.severity]}</p>
          <p>Created {formatRelativeTime(patient.createdAt)} by operator #{patient.createdByUserId}.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Ambulance className="h-4 w-4 text-warning" /> Ambulance Assignment
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="rounded-lg bg-warning/10 px-3 py-2 font-medium text-foreground">
            {patient.assignedAmbulance?.vehicleNumber ?? "Waiting for assignment"}
          </div>
          <p>{patient.dispatch?.distanceKm ? `${patient.dispatch.distanceKm.toFixed(1)} km planned route` : "Assignment pending or queued."}</p>
          <p>{patient.queueReason === "NO_AMBULANCE" ? "SEAE will retry when a unit is free." : "Nearest available unit is tracked automatically."}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-stable" /> Hospital Destination
        </h3>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="rounded-lg bg-stable/10 px-3 py-2 font-medium text-foreground">
            {patient.assignedHospital?.name ?? "Awaiting capacity match"}
          </div>
          <p>{patient.dispatch?.score ? `SEAE score: ${patient.dispatch.score}` : "Stored as queue candidate until a hospital clears the threshold."}</p>
          <p>{patient.queueReason === "NO_CAPABLE_HOSPITAL" ? "Capacity or specialization limits triggered fallback handling." : "Capacity reservation is recorded in the backend."}</p>
        </div>
      </div>
    </div>

    {dispatchDetail?.decision && (
      <div className="space-y-4">
        {dispatchDetail.decision.fallbackStrategy !== "nearest-available" && (
          <FallbackStrategyBanner
            fallbackStrategy={dispatchDetail.decision.fallbackStrategy}
            queueReason={dispatchDetail.decision.queueReason}
            retryCount={dispatchDetail.dispatch?.retryCount ?? 0}
          />
        )}
        <DecisionReplayPanel decision={dispatchDetail.decision} />
      </div>
    )}

    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Clock className="h-4 w-4 text-info" /> Operational Timeline
      </h3>
      <div className="space-y-3">
        {[
          { label: "Emergency created", value: patient.createdAt },
          { label: "Last updated", value: patient.updatedAt },
          { label: "Completed", value: patient.completedAt },
        ]
          .filter((entry) => entry.value)
          .map((entry) => (
          <div key={entry.label} className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <Building2 className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
              <div>
                <p className="text-sm font-medium">{entry.label}</p>
                <p className="text-xs text-muted-foreground">{patient.pickupAddress}</p>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{formatRelativeTime(entry.value!)}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const PatientProfile = () => {
  const { emergencies } = useSimulation();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const filtered = useMemo(
    () =>
      emergencies.filter((patient) =>
        `${patient.patientName} ${patient.condition} ${patient.pickupAddress}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [emergencies, search],
  );
  const selected =
    filtered.find((patient) => patient.id === selectedId) ??
    emergencies.find((patient) => patient.id === selectedId) ??
    filtered[0] ??
    emergencies[0] ??
    null;
  const dispatchDetailQuery = useQuery({
    queryKey: ["dispatch-detail", selected?.id],
    queryFn: () => getDispatch(selected!.id),
    enabled: Boolean(selected?.dispatch),
  });

  useEffect(() => {
    if (selectedId && filtered.some((patient) => patient.id === selectedId)) {
      return;
    }

    setSelectedId(filtered[0]?.id ?? emergencies[0]?.id ?? null);
  }, [emergencies, filtered, selectedId]);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Patient Incident Records</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{emergencies.length} persisted emergency records</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients or incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:space-y-2 lg:overflow-x-visible lg:pb-0">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`shrink-0 rounded-xl border p-3 text-left transition-colors lg:w-full ${
                  selected?.id === p.id
                    ? "border-emergency/30 bg-emergency/5"
                    : "border-border bg-card hover:border-emergency/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="whitespace-nowrap text-sm font-semibold">{p.patientName}</p>
                    <p className="whitespace-nowrap text-[10px] text-muted-foreground">{p.severity} · {p.status}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selected ? (
          <PatientDetail patient={selected} dispatchDetail={dispatchDetailQuery.data} />
        ) : (
          <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No emergency records are available yet. Create a new emergency from the command center to populate this view.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
