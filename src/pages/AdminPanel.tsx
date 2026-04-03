import DashboardLayout from "@/components/DashboardLayout";
import { useSimulation } from "@/hooks/useSimulation";
import { motion } from "framer-motion";
import {
  Shield, Building2, Ambulance, Activity, AlertTriangle,
  Clock, TrendingDown, Bed, FileText,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

const COLORS = ["hsl(0,85%,55%)", "hsl(25,95%,55%)", "hsl(160,70%,45%)", "hsl(215,80%,50%)"];

const AdminPanel = () => {
  const { hospitals, ambulances, emergencies, activity, metrics } = useSimulation();

  const ambulanceStatusData = metrics?.fleetStatus ?? [];
  const hospitalCapacity =
    metrics?.hospitalCapacity.map((hospital) => ({
      name: hospital.name.split(" ")[0],
      icu: hospital.icu,
      emergency: hospital.emergency,
      general: hospital.general,
    })) ?? [];
  const responseTimeData =
    metrics?.responseTrend.map((point) => ({
      time: point.label,
      avg: point.avgResponseMinutes,
    })) ?? [];
  const emergencySeverity = metrics?.severityBreakdown ?? [];

  const roles = [
    { role: "Admin", access: "Full analytics, configuration, and audit visibility", icon: Shield },
    { role: "Dispatcher", access: "Create emergencies, run SEAE, and assign ambulances", icon: Ambulance },
  ];

  return (
    <DashboardLayout>
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Admin Panel</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">System overview and analytics — Emergency Hospital Network</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-stable/10 px-3 py-1.5">
          <Activity className="h-3 w-3 text-stable" />
          <span className="text-xs font-semibold text-stable">All Systems Operational</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "Total Hospitals", value: hospitals.length, icon: Building2, color: "text-info" },
          { label: "Active Ambulances", value: metrics?.summary.availableAmbulances ?? ambulances.length, icon: Ambulance, color: "text-stable" },
          { label: "Active Emergencies", value: metrics?.summary.activeEmergencies ?? emergencies.filter((e) => e.status !== "completed" && e.status !== "cancelled").length, icon: AlertTriangle, color: "text-emergency" },
          { label: "Avg Response", value: `${metrics?.summary.avgResponseMinutes ?? 0}m`, icon: Clock, color: "text-warning" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground sm:text-xs">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="mt-2 font-mono text-xl font-bold sm:text-2xl">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Hospital Capacity Chart */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Bed className="h-4 w-4 text-info" /> Hospital Bed Availability
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hospitalCapacity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="icu" fill="hsl(0,85%,55%)" name="ICU" radius={[2, 2, 0, 0]} />
              <Bar dataKey="emergency" fill="hsl(45,95%,55%)" name="Emergency" radius={[2, 2, 0, 0]} />
              <Bar dataKey="general" fill="hsl(160,70%,45%)" name="General" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Response Time Trend */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Clock className="h-4 w-4 text-warning" /> Response Time Trend (Today)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,14%)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215,15%,55%)" }} unit="m" />
              <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 11 }} />
              <Line type="monotone" dataKey="avg" stroke="hsl(0,85%,55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(0,85%,55%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Ambulance Status Pie */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Ambulance className="h-4 w-4 text-stable" /> Fleet Status Distribution
          </h3>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width="100%" height={180} className="sm:w-1/2">
              <PieChart>
                <Pie data={ambulanceStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                  {ambulanceStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220,18%,7%)", border: "1px solid hsl(220,15%,14%)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 sm:flex-col sm:gap-2">
              {ambulanceStatusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-mono font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emergency Severity + Roles */}
        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4 text-emergency" /> Emergency Breakdown
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {emergencySeverity.map((s, i) => (
                <div key={s.name} className="text-center">
                  <div className="font-mono text-lg font-bold sm:text-xl" style={{ color: COLORS[i] }}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.name}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-lg border border-border px-3 py-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Efficiency Score</div>
                <div className="mt-1 font-mono text-xl font-bold">{metrics?.insights.efficiencyScore ?? 0}</div>
              </div>
              <div className="rounded-lg border border-border px-3 py-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Success Rate</div>
                <div className="mt-1 font-mono text-xl font-bold">{metrics?.insights.successRate ?? 0}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4 text-info" /> Role-Based Access
            </h3>
            <div className="space-y-2">
              {roles.map((r) => (
                <div key={r.role} className="rounded-lg border border-border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <r.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{r.role}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{r.access}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent System Events */}
      <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:mt-6 sm:p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-muted-foreground" /> Recent System Events
        </h3>
        <div className="space-y-2">
          {activity.slice(0, 8).map((e) => (
            <div key={e.id} className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span>{e.message}</span>
              <span className="text-muted-foreground">{e.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
