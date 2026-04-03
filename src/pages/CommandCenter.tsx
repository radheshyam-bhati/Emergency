import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import EmergencyCard from "@/components/EmergencyCard";
import HospitalCard from "@/components/HospitalCard";
import ActivityFeed from "@/components/ActivityFeed";
import NewEmergencyForm from "@/components/NewEmergencyForm";
import LiveMap from "@/components/LiveMap";
import DecisionReplayPanel from "@/components/DecisionReplayPanel";
import FallbackStrategyBanner from "@/components/FallbackStrategyBanner";
import { useSimulation } from "@/hooks/useSimulation";
import { getDispatch } from "@/api/dispatch";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Ambulance as AmbulanceIcon, Bed, Building2, Clock, Activity, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip } from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const CommandCenter = () => {
  const { profile } = useAuth();
  const { hospitals, ambulances, emergencies, activity, metrics, realtimeConnected, loading } = useSimulation();

  const activeEmergencies = emergencies.filter((e) => e.status !== "completed" && e.status !== "cancelled");
  const criticalCount = activeEmergencies.filter((e) => e.severity === "critical").length;
  const featuredEmergency = activeEmergencies.find((emergency) => emergency.dispatch) ?? activeEmergencies[0] ?? null;
  const featuredDispatchQuery = useQuery({
    queryKey: ["dispatch-detail", featuredEmergency?.id],
    queryFn: () => getDispatch(featuredEmergency!.id),
    enabled: Boolean(featuredEmergency?.dispatch),
  });

  const mapHospitals = useMemo(() => hospitals.map((h) => ({ id: h.id, name: h.name, lat: h.lat, lng: h.lng, status: h.status })), [hospitals]);
  const mapAmbulances = useMemo(() => ambulances.map((a) => ({ id: a.id, vehicleNumber: a.vehicleNumber, lat: a.lat, lng: a.lng, status: a.status })), [ambulances]);
  const mapEmergencies = useMemo(
    () =>
      emergencies
        .filter((emergency) => emergency.status !== "completed" && emergency.status !== "cancelled")
        .map((emergency) => ({
          id: emergency.id,
          lat: emergency.pickupLatitude,
          lng: emergency.pickupLongitude,
          severity: emergency.severity,
        })),
    [emergencies],
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Command Center</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground sm:text-sm">Real-time emergency operations — New Delhi Region</p>
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium ${
              realtimeConnected ? "bg-stable/10 text-stable" : "bg-muted text-muted-foreground"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${realtimeConnected ? "bg-stable" : "bg-muted-foreground"}`} />
              {loading ? "Syncing..." : realtimeConnected ? "Realtime" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {profile?.role !== "admin" && <NewEmergencyForm />}
          <div className="flex items-center gap-2 rounded-lg border border-emergency/30 bg-emergency/10 px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emergency opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emergency" />
            </span>
            <span className="text-xs font-semibold text-emergency">{activeEmergencies.length} Active</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Active Emergencies" value={metrics?.summary.activeEmergencies ?? activeEmergencies.length} icon={<AlertTriangle className="h-4 w-4 text-emergency" />} trend={`${criticalCount} critical`} variant="emergency" />
        <StatCard label="Available Ambulances" value={`${metrics?.summary.availableAmbulances ?? 0}/${ambulances.length}`} icon={<AmbulanceIcon className="h-4 w-4 text-info" />} trend={`${metrics?.summary.busyAmbulances ?? 0} busy`} variant="info" />
        <StatCard label="Avg Response Time" value={`${metrics?.summary.avgResponseMinutes ?? 0}m`} icon={<Clock className="h-4 w-4 text-stable" />} trend={`Dispatch delay ${metrics?.insights.avgDispatchDelay ?? 0}m`} variant="stable" />
        <StatCard label="Efficiency Score" value={metrics?.insights.efficiencyScore ?? 0} icon={<Bed className="h-4 w-4 text-warning" />} trend={`${metrics?.insights.overloadedHospitals ?? 0} overloaded hospitals`} />
      </div>

      {/* Live Map */}
      <LiveMap
        hospitals={mapHospitals}
        ambulances={mapAmbulances}
        emergencies={mapEmergencies}
        className="mb-4 h-56 sm:mb-6 sm:h-72"
      />

      {featuredDispatchQuery.data?.decision && (
        <div className="mb-4 space-y-3 sm:mb-6">
          {featuredDispatchQuery.data.decision.fallbackStrategy !== "nearest-available" && (
            <FallbackStrategyBanner
              fallbackStrategy={featuredDispatchQuery.data.decision.fallbackStrategy}
              queueReason={featuredDispatchQuery.data.decision.queueReason}
              retryCount={featuredDispatchQuery.data.dispatch?.retryCount ?? 0}
            />
          )}
          <DecisionReplayPanel
            decision={featuredDispatchQuery.data.decision}
            compact
            title="System Flow / Decision Replay"
          />
        </div>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Emergencies Panel */}
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-emergency" />
            <h2 className="text-sm font-semibold">Live Emergencies</h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 sm:max-h-[500px]">
            <AnimatePresence mode="popLayout">
              {activeEmergencies.map((e, i) => (
                <EmergencyCard key={e.id} emergency={e} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Hospitals */}
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-info" />
            <h2 className="text-sm font-semibold">Hospital Status</h2>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 sm:max-h-[500px]">
            {hospitals.slice(0, 4).map((h) => (
              <HospitalCard key={h.id} hospital={h} />
            ))}
          </div>
        </div>

        {/* Activity + Fleet */}
        <div className="lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-stable" />
            <h2 className="text-sm font-semibold">Activity Feed</h2>
          </div>
          <div className="rounded-xl border border-border bg-card p-2 max-h-[280px] overflow-y-auto">
            <ActivityFeed events={activity} />
          </div>

          <div className="mt-4">
            <div className="mb-3 flex items-center gap-2">
              <AmbulanceIcon className="h-4 w-4 text-info" />
              <h2 className="text-sm font-semibold">Ambulance Fleet</h2>
            </div>
            <div className="space-y-2">
              {ambulances.map((a) => {
                const statusColor =
                  a.status === "available" ? "text-stable" :
                  a.status === "en-route" ? "text-emergency" :
                  a.status === "assigned" || a.status === "queued" ? "text-warning" : "text-info";
                return (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                    <div>
                      <span className="text-xs font-mono font-medium">{a.vehicleNumber}</span>
                      <span className="ml-2 text-[10px] text-muted-foreground">{a.type}</span>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase ${statusColor}`}>{a.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-stable" />
            <h2 className="text-sm font-semibold">Response Time (Today)</h2>
            <span className="ml-auto text-[10px] text-muted-foreground">Target: &lt; 8 min</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart
              data={(metrics?.responseTrend ?? []).map((point) => ({
                t: point.label,
                v: point.avgResponseMinutes,
              }))}
            >
              <defs>
                <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0,85%,55%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0,85%,55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "hsl(215,15%,55%)" }} />
              <YAxis tick={{ fontSize: 9, fill: "hsl(215,15%,55%)" }} unit="m" />
              <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="v" stroke="hsl(0,85%,55%)" fill="url(#respGrad)" strokeWidth={2} name="Avg Response" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h2 className="text-sm font-semibold">Incident Heatmap (24h)</h2>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {(metrics?.incidentHeatmap ?? []).map((bucket) => {
              const bg =
                bucket.count >= 3
                  ? "bg-emergency"
                  : bucket.count === 2
                    ? "bg-warning"
                    : bucket.count === 1
                      ? "bg-info/40"
                      : "bg-muted";
              return <div key={bucket.label} className={`aspect-square rounded-sm ${bg}`} title={`${bucket.label} · ${bucket.count} incidents`} />;
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>00:00</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-muted" />Low</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-info/40" />Med</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-warning" />High</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emergency" />Critical</span>
            </div>
            <span>23:59</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CommandCenter;
