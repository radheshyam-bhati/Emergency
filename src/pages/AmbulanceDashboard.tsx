import DashboardLayout from "@/components/DashboardLayout";
import { useSimulation } from "@/hooks/useSimulation";
import LiveMap from "@/components/LiveMap";
import { Ambulance as AmbIcon, MapPin, Users, Activity, Navigation } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

const statusConfig: Record<string, { color: string; bg: string; glow: string }> = {
  available: { color: "text-stable", bg: "bg-stable/10", glow: "" },
  dispatched: { color: "text-warning", bg: "bg-warning/10", glow: "glow-warning" },
  "en-route": { color: "text-emergency", bg: "bg-emergency/10", glow: "glow-emergency" },
  "at-hospital": { color: "text-info", bg: "bg-info/10", glow: "" },
};

const AmbulanceDashboard = () => {
  const { ambulances } = useSimulation();
  const available = ambulances.filter((a) => a.status === "available").length;
  const active = ambulances.length - available;

  const mapAmbulances = useMemo(() => ambulances.map((a) => ({
    id: a.id, vehicleNumber: a.vehicleNumber, lat: a.lat, lng: a.lng, status: a.status,
  })), [ambulances]);

  return (
    <DashboardLayout>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Ambulance Fleet</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {ambulances.length} ambulances — {available} available, {active} active
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: "Available", count: available, color: "text-stable" },
            { label: "Active", count: active, color: "text-emergency" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card px-4 py-2 text-center">
              <div className={`font-mono text-xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <LiveMap ambulances={mapAmbulances} className="mb-4 h-56 sm:mb-6 sm:h-72" />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ambulances.map((amb, i) => {
          const cfg = statusConfig[amb.status];
          return (
            <motion.div
              key={amb.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border border-border bg-card p-4 sm:p-5 transition-all hover:border-emergency/20 ${
                amb.status === "en-route" ? "ring-1 ring-emergency/20" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg}`}>
                    <AmbIcon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <span className="font-mono text-sm font-semibold">{amb.vehicleNumber}</span>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${cfg.color} ${cfg.bg}`}>
                  {amb.status}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">{amb.type}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  {amb.crew}
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <Navigation className="h-3 w-3" />
                  {amb.lat.toFixed(4)}, {amb.lng.toFixed(4)}
                </div>
              </div>

              {amb.currentEmergency && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 rounded-lg bg-emergency/10 px-3 py-2 text-[10px] font-medium text-emergency flex items-center gap-1.5"
                >
                  <Activity className="h-3 w-3 pulse-emergency" />
                  Emergency #{amb.currentEmergency}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default AmbulanceDashboard;
