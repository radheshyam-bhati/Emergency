import { motion } from "framer-motion";
import { Database, Bot, GitBranch, ShieldCheck, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Database,
    label: "Data Ingestion",
    description: "Corporate registries, sanctions databases, KYC documents, and transaction streams are unified into a single knowledge graph.",
    color: "neon-cyan",
  },
  {
    icon: Bot,
    label: "AI Agents",
    description: "Seven autonomous agents — orchestrator, retrieval, graph analyst, fraud detector, reasoning, compliance, and critique — collaborate in self-correcting loops.",
    color: "neon-blue",
  },
  {
    icon: GitBranch,
    label: "Graph Analysis",
    description: "GraphRAG traverses ownership chains, detects shell networks, resolves duplicate identities, and maps beneficial ownership paths.",
    color: "neon-purple",
  },
  {
    icon: ShieldCheck,
    label: "Compliance Decision",
    description: "SMT solver formally verifies compliance rules. Every verdict is mathematically provable, auditor-ready, and explainable.",
    color: "neon-green",
  },
];

const dotColor: Record<string, string> = {
  "neon-cyan": "bg-neon-cyan shadow-[0_0_12px_hsl(var(--neon-cyan)/0.5)]",
  "neon-blue": "bg-neon-blue shadow-[0_0_12px_hsl(var(--neon-blue)/0.5)]",
  "neon-purple": "bg-neon-purple shadow-[0_0_12px_hsl(var(--neon-purple)/0.5)]",
  "neon-green": "bg-neon-green shadow-[0_0_12px_hsl(var(--neon-green)/0.5)]",
};

const iconBg: Record<string, string> = {
  "neon-cyan": "bg-neon-cyan/10 border-neon-cyan/20 text-neon-cyan",
  "neon-blue": "bg-neon-blue/10 border-neon-blue/20 text-neon-blue",
  "neon-purple": "bg-neon-purple/10 border-neon-purple/20 text-neon-purple",
  "neon-green": "bg-neon-green/10 border-neon-green/20 text-neon-green",
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-surface)" }} />
      <div className="glow-orb w-[500px] h-[500px] top-[30%] left-[-200px] bg-neon-purple/3" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <span className="font-mono text-xs text-neon-purple tracking-widest uppercase">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">
            From Raw Data to Verified Compliance
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A four-stage pipeline powered by autonomous AI agents and formal verification.
          </p>
        </motion.div>

        {/* Desktop: horizontal flow */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-4 gap-6 relative">
            {/* Connecting line */}
            <div className="absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-neon-cyan/30 via-neon-purple/30 to-neon-green/30" />

            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative text-center"
              >
                {/* Step dot on the line */}
                <div className="flex justify-center mb-6">
                  <div className={`w-4 h-4 rounded-full ${dotColor[step.color]} z-10`} />
                </div>

                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl border mb-4 ${iconBg[step.color]}`}>
                  <step.icon className="h-6 w-6" />
                </div>

                <div className="font-mono text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical flow */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex gap-5"
            >
              <div className="shrink-0">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${iconBg[step.color]}`}>
                  <step.icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                  Step {i + 1}
                </div>
                <h3 className="text-base font-semibold mb-1">{step.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Animated flow indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="hidden lg:flex items-center justify-center gap-3 mt-14 text-sm text-muted-foreground"
        >
          <span className="font-mono text-neon-cyan">Data</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary/40" />
          <span className="font-mono text-neon-blue">AI Agents</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary/40" />
          <span className="font-mono text-neon-purple">Graph Analysis</span>
          <ArrowRight className="h-3.5 w-3.5 text-primary/40" />
          <span className="font-mono text-neon-green">Compliance Decision</span>
        </motion.div>
      </div>
    </section>
  );
}
