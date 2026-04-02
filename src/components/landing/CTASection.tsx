import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function CTASection() {
  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-surface)" }} />
      <div className="glow-orb w-[600px] h-[600px] top-[-100px] left-[30%] bg-primary/5" />
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-8 animate-glow-pulse">
            <Shield className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-foreground">Stop Financial Crime</span>
            <br />
            <span className="text-neon">Before It Happens</span>
          </h2>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Join leading banks and regulators using VAGR Hub to protect
            the global financial system with AI-powered intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-primary-foreground transition-all hover:shadow-[0_0_40px_hsl(185_100%_50%/0.3)] hover:scale-[1.02]"
              style={{ background: "var(--gradient-primary)" }}
            >
              Login
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="mailto:demo@vagr-hub.io"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold border border-border hover:border-primary/30 bg-secondary/50 hover:bg-secondary text-foreground transition-all hover:scale-[1.02]"
            >
              Request Demo
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
