import { motion } from "framer-motion";
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Users, ArrowUpRight } from "lucide-react";

export default function DashboardPreviewSection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="glow-orb w-[600px] h-[600px] top-[10%] right-[-200px] bg-primary/3" />

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-primary tracking-widest uppercase">
            Product Preview
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">
            Command Center for Compliance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A real-time intelligence dashboard designed for analysts, investigators, and compliance officers.
          </p>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Glow behind dashboard */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-primary/10 via-neon-blue/5 to-transparent blur-2xl" />

          {/* Dashboard frame */}
          <div className="relative glass-card rounded-2xl overflow-hidden border-primary/10">
            {/* Title bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border/50 bg-card/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-neon-red/60" />
                <div className="w-3 h-3 rounded-full bg-neon-amber/60" />
                <div className="w-3 h-3 rounded-full bg-neon-green/60" />
              </div>
              <span className="text-xs font-mono text-muted-foreground ml-3">
                vagr-hub.io/dashboard
              </span>
            </div>

            {/* Dashboard content */}
            <div className="p-5 space-y-5">
              {/* KPI row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Active Cases", value: "847", change: "+12", icon: Users, color: "text-primary" },
                  { label: "Risk Alerts", value: "23", change: "+3", icon: AlertTriangle, color: "text-neon-amber" },
                  { label: "Verified Today", value: "1,204", change: "+89", icon: CheckCircle2, color: "text-neon-green" },
                  { label: "Throughput", value: "9.8K/s", change: "+0.4K", icon: TrendingUp, color: "text-neon-blue" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-xl border border-border/50 bg-card/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-[10px] font-mono text-neon-green flex items-center gap-0.5">
                        <ArrowUpRight className="h-3 w-3" />
                        {kpi.change}
                      </span>
                    </div>
                    <div className="font-mono text-xl font-bold text-foreground">{kpi.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{kpi.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart + Alerts row */}
              <div className="grid md:grid-cols-3 gap-3">
                {/* Fake chart area */}
                <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/60 p-4">
                  <div className="text-xs font-mono text-muted-foreground mb-3">Transaction Volume — 24h</div>
                  <div className="h-32 flex items-end gap-1.5">
                    {[40, 55, 35, 70, 85, 65, 90, 75, 60, 80, 95, 50, 70, 85, 60, 45, 75, 90, 70, 55].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.03, duration: 0.4 }}
                        className="flex-1 rounded-sm bg-gradient-to-t from-primary/60 to-primary/20"
                      />
                    ))}
                  </div>
                </div>

                {/* Alerts */}
                <div className="rounded-xl border border-border/50 bg-card/60 p-4">
                  <div className="text-xs font-mono text-muted-foreground mb-3">Active Alerts</div>
                  <div className="space-y-2.5">
                    {[
                      { level: "risk-critical", text: "Shell company cluster BVI" },
                      { level: "risk-high", text: "Sanctions proximity alert" },
                      { level: "risk-medium", text: "Unusual tx pattern" },
                    ].map((a, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-2"
                      >
                        <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-secondary-foreground truncate">{a.text}</span>
                        <span className={`${a.level} ml-auto shrink-0 text-[9px]`}>
                          {a.level.split("-")[1].toUpperCase()}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
