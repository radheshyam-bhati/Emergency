import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Activity,
  ShieldAlert, Users, ChevronRight, BarChart3,
  FileWarning, Zap
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TransactionCharts from "@/components/dashboard/TransactionCharts";
import AIInsights from "@/components/dashboard/AIInsights";
import RiskScoreSummary from "@/components/dashboard/RiskScoreSummary";
import { useDashboardStats, useAlerts, useActivityLog, subscribeToRealtimeAlerts, Alert } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const riskClass: Record<string, string> = {
  critical: "risk-critical",
  high: "risk-high",
  medium: "risk-medium",
  low: "risk-low",
};

const typeIcon: Record<string, string> = {
  entity_screened: "text-neon-cyan",
  alert_created: "text-neon-red",
  case_created: "text-neon-amber",
  report_generated: "text-neon-green",
};

export default function DashboardPage() {
  const { data: stats } = useDashboardStats();
  const { data: alerts } = useAlerts(5);
  const { data: activityLog } = useActivityLog(6);
  const [liveCount, setLiveCount] = useState(47203);

  useEffect(() => {
    const unsub = subscribeToRealtimeAlerts((alert: Alert) => {
      toast({
        title: `New Alert: ${alert.entity_name}`,
        description: alert.description || alert.alert_type,
        variant: "destructive",
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((c) => c + Math.floor(Math.random() * 5) + 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const displayAlerts = alerts && alerts.length > 0 ? alerts : [
    { id: "placeholder", alert_number: "ALT-0000", entity_name: "No alerts yet", alert_type: "INFO", risk_level: "low", description: "Screen an entity to generate alerts", status: "active", created_at: new Date().toISOString(), entity_id: null, ai_explanation: null, resolved_at: null },
  ];

  const displayActivity = activityLog && activityLog.length > 0 ? activityLog : [
    { id: "1", created_at: new Date().toISOString(), action: "System started", details: {}, user_id: null, entity_type: null, entity_id: null },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time financial crime monitoring</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Alerts", value: String(stats?.activeAlerts ?? 0), change: "live", icon: AlertTriangle, color: "text-neon-red" },
            { label: "Open Cases", value: String(stats?.openCases ?? 0), change: "live", icon: FileWarning, color: "text-neon-amber" },
            { label: "Entities Monitored", value: stats?.entitiesMonitored ? (stats.entitiesMonitored >= 1000 ? `${(stats.entitiesMonitored / 1000).toFixed(1)}K` : String(stats.entitiesMonitored)) : "0", change: "live", icon: Users, color: "text-neon-cyan" },
            { label: "Txns Processed", value: liveCount.toLocaleString(), change: "live", icon: Zap, color: "text-neon-green" },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-[10px] font-mono text-neon-green animate-pulse-neon">● LIVE</span>
              </div>
              <div className="font-mono text-xl font-bold">{kpi.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 glass-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-neon-red" />
                Risk Alerts
              </h2>
              <span className="risk-critical">{displayAlerts.length} Active</span>
            </div>
            <div className="divide-y divide-border/30 max-h-[380px] overflow-y-auto">
              {displayAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-5 py-3 hover:bg-secondary/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{alert.alert_number}</span>
                        <span className={riskClass[alert.risk_level] || "risk-medium"}>{alert.risk_level}</span>
                      </div>
                      <div className="font-medium text-sm">{alert.entity_name}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{alert.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-4 glass-card p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
              <h2 className="font-semibold flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-primary" />
                Activity Monitor
              </h2>
              <div className="status-dot-active" />
            </div>
            <div className="divide-y divide-border/20 max-h-[380px] overflow-y-auto">
              {displayActivity.map((item: any, i: number) => (
                <motion.div
                  key={item.id || i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="px-5 py-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground mt-0.5 shrink-0">
                      {new Date(item.created_at).toLocaleTimeString()}
                    </span>
                    <p className={`text-xs leading-relaxed ${typeIcon[item.action] || "text-muted-foreground"}`}>
                      {item.action}{item.details?.entity_name ? ` — ${item.details.entity_name}` : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <RiskScoreSummary />
          </div>
        </div>

        <AIInsights />
        <TransactionCharts />
      </div>
    </DashboardLayout>
  );
}
