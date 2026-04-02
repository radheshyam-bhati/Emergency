import { motion } from "framer-motion";
import { Lock, Fingerprint, Server, Key, ShieldAlert, Globe } from "lucide-react";

const items = [
  {
    icon: Lock,
    title: "Zero-Trust Architecture",
    description: "mTLS between all services. No implicit trust boundaries.",
  },
  {
    icon: Fingerprint,
    title: "Hardware Security Modules",
    description: "FIPS 140-2 Level 3 HSMs for key management and signing.",
  },
  {
    icon: Server,
    title: "Sovereign Cloud",
    description: "Deploy in air-gapped environments. Full data residency control.",
  },
  {
    icon: Key,
    title: "End-to-End Encryption",
    description: "AES-256 at rest, TLS 1.3 in transit. Zero-knowledge proofs where applicable.",
  },
  {
    icon: ShieldAlert,
    title: "Immutable Audit Trail",
    description: "Every action logged with RFC 3161 timestamps. 7-year retention.",
  },
  {
    icon: Globe,
    title: "Multi-Jurisdiction Isolation",
    description: "Namespace-level tenant isolation. Data never crosses jurisdictional boundaries.",
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--gradient-surface)" }} />
      <div className="glow-orb w-[400px] h-[400px] bottom-0 left-[20%] bg-neon-green/3" />

      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-neon-green tracking-widest uppercase">
            Security-First
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">
            Bank-Grade Security
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Designed for the most regulated environments on earth.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 border-neon-green/5 hover:border-neon-green/20 transition-colors"
            >
              <item.icon className="h-8 w-8 text-neon-green mb-4" />
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
