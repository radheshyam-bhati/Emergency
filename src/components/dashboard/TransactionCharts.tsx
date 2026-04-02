import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const transactionData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  volume: Math.floor(Math.random() * 8000 + 2000),
  alerts: Math.floor(Math.random() * 15 + 1),
  blocked: Math.floor(Math.random() * 5),
}));

const jurisdictionRisk = [
  { name: "BVI", score: 94, count: 347 },
  { name: "Panama", score: 89, count: 218 },
  { name: "Seychelles", score: 85, count: 164 },
  { name: "Cyprus", score: 72, count: 421 },
  { name: "Liechtenstein", score: 68, count: 89 },
  { name: "Latvia", score: 61, count: 156 },
  { name: "Estonia", score: 55, count: 203 },
  { name: "UK", score: 32, count: 1247 },
  { name: "Germany", score: 18, count: 892 },
  { name: "USA", score: 15, count: 2103 },
];

function riskColor(score: number) {
  if (score >= 80) return "hsl(0, 85%, 55%)";
  if (score >= 60) return "hsl(40, 95%, 55%)";
  if (score >= 40) return "hsl(185, 100%, 50%)";
  return "hsl(160, 80%, 45%)";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs border-neon">
      <p className="font-mono text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="font-mono" style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function TransactionCharts() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Transaction Volume */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            Transaction Volume (24h)
          </h3>
          <span className="font-mono text-xs text-muted-foreground">SWIFT / SEPA</span>
        </div>
        <div className="p-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={transactionData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185, 100%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 85%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 15%, 14%)" />
              <XAxis
                dataKey="hour"
                tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(228, 15%, 14%)" }}
                interval={3}
              />
              <YAxis
                tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                name="Transactions"
                stroke="hsl(185, 100%, 50%)"
                strokeWidth={2}
                fill="url(#volumeGradient)"
              />
              <Area
                type="monotone"
                dataKey="alerts"
                name="Alerts"
                stroke="hsl(0, 85%, 55%)"
                strokeWidth={1.5}
                fill="url(#alertGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Jurisdiction Risk Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <BarChart3 className="h-4 w-4 text-neon-amber" />
            Jurisdiction Risk Scores
          </h3>
          <span className="font-mono text-xs text-muted-foreground">Top 10</span>
        </div>
        <div className="p-4" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={jurisdictionRisk} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 15%, 14%)" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(228, 15%, 14%)" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "hsl(215, 15%, 50%)", fontSize: 10, fontFamily: "JetBrains Mono" }}
                tickLine={false}
                axisLine={false}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" name="Risk Score" radius={[0, 4, 4, 0]} barSize={14}>
                {jurisdictionRisk.map((entry, i) => (
                  <Cell key={i} fill={riskColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
