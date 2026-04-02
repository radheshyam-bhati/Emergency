import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ShieldCheck } from "lucide-react";
import { useRiskDistribution } from "@/lib/api";

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card p-2.5 text-xs border-neon">
      <p className="font-mono font-medium" style={{ color: d.color }}>{d.name}</p>
      <p className="font-mono text-muted-foreground">{d.value} entities ({d.total > 0 ? ((d.value / d.total) * 100).toFixed(1) : 0}%)</p>
    </div>
  );
};

export default function RiskScoreSummary() {
  const { data: dist } = useRiskDistribution();

  const riskData = [
    { name: "High Risk", value: dist?.high ?? 0, color: "hsl(0, 85%, 55%)", total: dist?.total ?? 0 },
    { name: "Medium Risk", value: dist?.medium ?? 0, color: "hsl(40, 95%, 55%)", total: dist?.total ?? 0 },
    { name: "Low Risk", value: dist?.low ?? 0, color: "hsl(160, 80%, 45%)", total: dist?.total ?? 0 },
  ];

  const total = dist?.total ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h2 className="font-semibold flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-neon-green" />
          Risk Distribution
        </h2>
        <span className="font-mono text-xs text-muted-foreground">{total} entities</span>
      </div>

      <div className="p-5">
        {total === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No entities screened yet</p>
            <p className="text-xs text-muted-foreground mt-1">Use the Investigation page to screen entities</p>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative" style={{ width: 140, height: 140 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {riskData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-bold text-foreground">{total}</span>
                <span className="text-[9px] font-mono text-muted-foreground uppercase">Total</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {riskData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-muted-foreground">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{d.value}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
