import { motion } from "framer-motion";
import { GitBranch, Brain, ShieldCheck, Zap, Search } from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "UBO Detection",
    description: "Automatically trace Ultimate Beneficial Ownership through complex multi-layered corporate structures across 200+ jurisdictions.",
    color: "neon-cyan",
  },
  {
    icon: Brain,
    title: "Fraud Network Discovery",
    description: "AI agents detect hidden fraud rings, synthetic identity clusters, and coordinated financial crime patterns in real time.",
    color: "neon-blue",
  },
  {
    icon: ShieldCheck,
    title: "Sanctions Screening",
    description: "Screen entities against OFAC, EU, and UN sanctions lists with 99.7% accuracy. Fuzzy matching and alias resolution included.",
    color: "neon-green",
  },
  {
    icon: Search,
    title: "Explainable AI Compliance",
    description: "Every AI finding includes evidence chains, confidence scores, and formal verification proofs. No black boxes — regulator-ready.",
    color: "neon-purple",
  },
  {
    icon: Zap,
    title: "Real-Time Risk Monitoring",
    description: "Process 10K transactions/second. Detect structuring, circular flows, and anomalous patterns before they become threats.",
    color: "neon-amber",
  },
];

const colorMap: Record<string, string> = {
  "neon-cyan": "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20",
  "neon-blue": "text-neon-blue bg-neon-blue/10 border-neon-blue/20",
  "neon-green": "text-neon-green bg-neon-green/10 border-neon-green/20",
  "neon-purple": "text-neon-purple bg-neon-purple/10 border-neon-purple/20",
  "neon-amber": "text-neon-amber bg-neon-amber/10 border-neon-amber/20",
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] top-[20%] right-[-200px] bg-neon-blue/3" />

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-primary tracking-widest uppercase">
            Core Capabilities
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">
            Intelligence at Every Layer
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Five integrated AI systems working in concert to detect, analyze,
            and verify financial crime across global networks.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glass-card-hover group p-6"
            >
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-4 transition-transform group-hover:scale-110 ${
                  colorMap[feature.color]
                }`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
