import { motion } from "framer-motion";
import { ArrowLeftRight, TrendingUp, BarChart3 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import TransactionCharts from "@/components/dashboard/TransactionCharts";
import { useDashboardStats, useRiskDistribution } from "@/lib/api";

export default function TransactionsPage() {
  const { data: stats } = useDashboardStats();
  const { data: riskDist } = useRiskDistribution();

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Transaction Monitoring
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Real-time transaction volume, jurisdiction risk analysis, and AML monitoring</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Active Alerts", value: stats?.activeAlerts ?? 0, color: "text-destructive" },
            { label: "Open Cases", value: stats?.openCases ?? 0, color: "text-neon-amber" },
            { label: "High Risk Entities", value: riskDist?.high ?? 0, color: "text-destructive" },
            { label: "Total Monitored", value: riskDist?.total ?? 0, color: "text-primary" },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">{kpi.label}</div>
              <div className={`font-mono text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <TransactionCharts />

        {/* Risk Distribution */}
        {riskDist && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-neon-amber" />
              Entity Risk Distribution
            </h2>
            <div className="flex items-end gap-1 h-20">
              {[
                { label: "High", count: riskDist.high, color: "bg-destructive" },
                { label: "Medium", count: riskDist.medium, color: "bg-neon-amber" },
                { label: "Low", count: riskDist.low, color: "bg-neon-green" },
              ].map((bucket) => {
                const pct = riskDist.total > 0 ? (bucket.count / riskDist.total) * 100 : 0;
                return (
                  <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(pct, 5)}%` }}
                      className={`w-full rounded-t ${bucket.color} opacity-80`}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{bucket.label}</span>
                    <span className="text-xs font-mono font-bold">{bucket.count}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
