import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, Scale, Brain, Lock, BarChart3, Loader2
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useReports, useAlerts, useEntities } from "@/lib/api";

const statusStyle: Record<string, string> = {
  complete: "risk-low",
  draft: "px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border",
  filed: "risk-low",
  pending: "risk-medium",
  active: "risk-high",
  acknowledged: "risk-medium",
  resolved: "risk-low",
  dismissed: "px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-muted text-muted-foreground border border-border",
};

const tabs = [
  { id: "reports", label: "Investigation Reports", icon: Brain },
  { id: "alerts", label: "Risk Alerts", icon: AlertTriangle },
];

export default function RegulatorPage() {
  const [activeTab, setActiveTab] = useState("reports");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const { data: reports, isLoading: reportsLoading } = useReports();
  const { data: alerts, isLoading: alertsLoading } = useAlerts(20);
  const { data: entities } = useEntities(10);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Scale className="h-6 w-6 text-neon-amber" />
                Regulator Portal
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Automated compliance reports and risk alerts
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/20">
              <Lock className="h-3.5 w-3.5 text-neon-green" />
              <span className="text-xs font-mono text-neon-green">AUTHENTICATED</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Reports", value: String(reports?.length ?? 0), icon: Brain, color: "text-neon-cyan" },
              { label: "Active Alerts", value: String(alerts?.filter(a => a.status === "active").length ?? 0), icon: AlertTriangle, color: "text-neon-amber" },
              { label: "Entities Screened", value: String(entities?.length ?? 0), icon: Shield, color: "text-neon-blue" },
              { label: "High Risk", value: String(entities?.filter(e => e.risk_score >= 70).length ?? 0), icon: BarChart3, color: "text-neon-red" },
            ].map((kpi) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4"
              >
                <kpi.icon className={`h-5 w-5 ${kpi.color} mb-3`} />
                <div className="font-mono text-2xl font-bold">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center gap-1 mb-4 border-b border-border/50 pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : reports && reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report, i) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card-hover p-5 cursor-pointer"
                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs text-muted-foreground">{report.report_number}</span>
                              <span className={statusStyle[report.status] || statusStyle.draft}>{report.status}</span>
                            </div>
                            <h3 className="font-semibold mb-2">{report.title}</h3>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {report.agents_used?.map((agent) => (
                                <span key={agent} className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary/10 text-primary border border-primary/20">
                                  {agent}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="font-mono">{report.findings_count} findings</span>
                              {report.confidence && (
                                <span className="font-mono">
                                  Confidence: <span className="text-neon-green">{(report.confidence * 100).toFixed(0)}%</span>
                                </span>
                              )}
                              <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>

                            {expandedReport === report.id && report.content && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-4 p-4 rounded-lg bg-secondary/30 border border-border/30"
                              >
                                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                                  {report.content}
                                </pre>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No reports generated yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Screen entities in the Investigation page and generate reports</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/30">
                            <th className="px-5 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">ID</th>
                            <th className="px-5 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Entity</th>
                            <th className="px-5 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Type</th>
                            <th className="px-5 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Risk</th>
                            <th className="px-5 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="px-5 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                          {alerts.map((alert, i) => (
                            <motion.tr
                              key={alert.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="hover:bg-secondary/20 transition-colors cursor-pointer"
                            >
                              <td className="px-5 py-3 font-mono text-xs">{alert.alert_number}</td>
                              <td className="px-5 py-3 text-sm font-medium">{alert.entity_name}</td>
                              <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{alert.alert_type}</td>
                              <td className="px-5 py-3"><span className={statusStyle[alert.risk_level] || "risk-medium"}>{alert.risk_level}</span></td>
                              <td className="px-5 py-3"><span className={statusStyle[alert.status] || statusStyle.draft}>{alert.status}</span></td>
                              <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-12 text-center">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No alerts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Alerts will appear as entities are screened</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
