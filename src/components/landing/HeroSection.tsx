import { motion } from "framer-motion";
import { ArrowRight, Play, Network, Eye, Shield, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import NetworkVisualization from "./NetworkVisualization";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <NetworkVisualization />

      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="glow-orb w-[600px] h-[600px] top-[-200px] left-[10%] bg-primary/5" />
      <div className="glow-orb w-[400px] h-[400px] bottom-[-100px] right-[10%] bg-neon-blue/5" />

      <div className="container relative mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-8"
          >
            <div className="status-dot-active" />
            <span className="text-xs font-mono font-medium text-primary tracking-wider uppercase">
              Verifiable Agentic GraphRAG
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            <span className="text-foreground">Reveal Hidden</span>
            <br />
            <span className="text-neon">Financial Networks</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            AI-powered compliance intelligence for global finance.
            Uncover hidden ownership, detect fraud networks, and generate
            mathematically verified compliance proofs.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link
              to="/dashboard"
              className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-primary-foreground overflow-hidden transition-all hover:shadow-[0_0_40px_hsl(185_100%_50%/0.3)] hover:scale-[1.02]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <span className="relative z-10">Start Investigation</span>
              <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/investigation"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold border border-border hover:border-primary/30 bg-secondary/50 hover:bg-secondary text-foreground transition-all hover:scale-[1.02]"
            >
              <Play className="h-4 w-4 text-primary" />
              View Demo
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { icon: Network, value: "50M+", label: "Entities Mapped" },
              { icon: Eye, value: "2.4s", label: "Avg. UBO Detection" },
              { icon: Shield, value: "99.7%", label: "Sanctions Accuracy" },
              { icon: Activity, value: "10K/s", label: "Transactions Screened" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                <div className="font-mono text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
