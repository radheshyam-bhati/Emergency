import { motion } from "framer-motion";
import { Scale, FileText, Globe2, CheckCircle2 } from "lucide-react";

const regulations = [
  {
    icon: Scale,
    name: "AMLA",
    full: "EU Anti-Money Laundering Authority",
    items: [
      "Art 3(6): ≥25% beneficial ownership detection",
      "Art 18: Enhanced due diligence for high-risk countries",
      "Art 30: Central register of beneficial ownership",
      "Art 32-34: Suspicious transaction reporting",
    ],
  },
  {
    icon: FileText,
    name: "CTA",
    full: "US Corporate Transparency Act",
    items: [
      "31 USC 5336: BOI reporting for reporting companies",
      "25% ownership threshold detection",
      "Substantial control test (senior officers)",
      "23 exemption category classification",
    ],
  },
  {
    icon: Globe2,
    name: "GDPR",
    full: "General Data Protection Regulation",
    items: [
      "Art 6(1)(c): Legal obligation basis for AML",
      "Art 17: Right to erasure with AML override",
      "Art 35: Automated DPIA generation",
      "Cross-border transfer enforcement (SCCs)",
    ],
  },
];

export default function ComplianceSection() {
  return (
    <section id="compliance" className="relative py-28 overflow-hidden">
      <div className="glow-orb w-[500px] h-[500px] top-[10%] left-[-200px] bg-neon-amber/3" />

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="font-mono text-xs text-neon-amber tracking-widest uppercase">
            Regulatory Compliance
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-4">
            Built for Regulators
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Mathematically verified compliance across every major regulatory framework.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {regulations.map((reg, i) => (
            <motion.div
              key={reg.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 hover:border-neon-amber/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-neon-amber/10 border border-neon-amber/20">
                  <reg.icon className="h-5 w-5 text-neon-amber" />
                </div>
                <div>
                  <h3 className="font-mono text-lg font-bold">{reg.name}</h3>
                  <p className="text-xs text-muted-foreground">{reg.full}</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {reg.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-secondary-foreground">
                    <CheckCircle2 className="h-4 w-4 text-neon-green mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
