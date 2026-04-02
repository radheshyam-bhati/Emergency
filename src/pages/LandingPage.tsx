import { Activity, Ambulance, Building2, Heart, MapPin, Shield, Users, Zap, ArrowRight, Phone, Brain, Clock, Bed } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

const stats = [
  { label: "Hospitals Connected", value: "2,847", icon: Building2, color: "text-info" },
  { label: "Ambulances Active", value: "12,340", icon: Ambulance, color: "text-stable" },
  { label: "Lives Saved", value: "89,000+", icon: Heart, color: "text-emergency" },
  { label: "Avg Response Time", value: "8.2 min", icon: Zap, color: "text-warning" },
];

const features = [
  { icon: Activity, title: "Real-Time Bed Tracking", description: "Live ICU, emergency, and general bed availability across all connected hospitals.", gradient: "from-emergency/20 to-critical/20" },
  { icon: Brain, title: "AI-Powered Routing", description: "Smart hospital recommendation considering distance, traffic, specialization, and capacity.", gradient: "from-info/20 to-secondary/20" },
  { icon: Users, title: "Doctor Availability", description: "Real-time tracking of specialist doctors across the network for critical cases.", gradient: "from-stable/20 to-accent/20" },
  { icon: Shield, title: "Automated Bed Reservation", description: "Instant bed allocation the moment an ambulance is dispatched to a hospital.", gradient: "from-warning/20 to-critical/20" },
];

const workflow = [
  { step: "01", title: "Emergency Detected", desc: "Call received or alert triggered", icon: Phone, color: "text-emergency" },
  { step: "02", title: "AI Scores Hospitals", desc: "Beds, doctors, distance, specialization", icon: Brain, color: "text-info" },
  { step: "03", title: "Ambulance Dispatched", desc: "Nearest available unit assigned", icon: Ambulance, color: "text-stable" },
  { step: "04", title: "Bed Reserved", desc: "Hospital prepared for arrival", icon: Bed, color: "text-warning" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const LandingPage = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emergency glow-emergency">
              <Heart className="h-5 w-5 text-emergency-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">EHN</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">Emergency Hospital Network</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/command-center">
              <Button size="sm" className="bg-emergency text-emergency-foreground hover:bg-emergency/90 glow-emergency">
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Emergency
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero with parallax */}
      <section ref={heroRef} className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[700px] w-[700px] rounded-full bg-emergency/5 blur-[120px]"
        />
        <motion.div
          style={{ y: heroY }}
          className="absolute top-1/2 left-1/4 h-[300px] w-[300px] rounded-full bg-info/3 blur-[80px]"
        />

        <div className="container relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emergency/30 bg-emergency/10 px-4 py-1.5 text-sm text-emergency">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emergency opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emergency" />
              </span>
              System Active — Monitoring 2,847 Hospitals
            </div>
          </motion.div>

          <motion.h1
            className="mx-auto max-w-4xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Every Second{" "}
            <span className="text-gradient-emergency">Saves a Life</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            India's intelligent emergency hospital coordination platform. AI-powered routing
            connects patients to the <span className="text-foreground font-medium">best hospital</span> — not just the nearest one.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:gap-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link to="/command-center">
              <Button size="lg" className="bg-emergency text-emergency-foreground hover:bg-emergency/90 glow-emergency h-12 w-full px-8 text-base font-semibold sm:w-auto">
                Open Command Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/hospitals">
              <Button size="lg" variant="outline" className="h-12 w-full px-8 text-base border-border hover:bg-muted sm:w-auto">
                View Hospital Network
              </Button>
            </Link>
          </motion.div>

          {/* Live pulse indicator */}
          <motion.div
            className="mt-10 flex items-center justify-center gap-4 sm:mt-16 sm:gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[
              { label: "Active Emergencies", value: "47", color: "text-emergency" },
              { label: "Ambulances En-Route", value: "23", color: "text-warning" },
              { label: "ICU Beds Free", value: "312", color: "text-stable" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className={`font-mono text-2xl font-bold ${item.color} animate-count-up`}>{item.value}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{item.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats with animated counters */}
      <section className="border-y border-border bg-surface-elevated py-20">
        <div className="container">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="group text-center"
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted transition-transform group-hover:scale-110">
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold font-mono">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24">
        <div className="container">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-muted-foreground">From emergency call to hospital arrival in under 8 minutes</p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((w, i) => (
              <motion.div
                key={w.step}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative rounded-xl border border-border bg-card p-6 text-center"
              >
                <div className="mb-4 text-[10px] font-mono font-bold text-muted-foreground">STEP {w.step}</div>
                <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted`}>
                  <w.icon className={`h-6 w-6 ${w.color}`} />
                </div>
                <h3 className="font-semibold">{w.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{w.desc}</p>
                {i < workflow.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 text-muted-foreground md:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 border-t border-border">
        <div className="container">
          <motion.div
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold sm:text-4xl">Intelligent Emergency Coordination</h2>
            <p className="mt-4 text-muted-foreground">Beyond simple dispatch — a complete emergency operations platform.</p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-2">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:border-emergency/30 hover:shadow-lg hover:shadow-emergency/5"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
                <div className="relative z-10">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emergency/10 text-emergency transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-24">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl"
          >
            <h2 className="text-3xl font-bold sm:text-4xl">Ready to Transform Emergency Response?</h2>
            <p className="mt-4 text-muted-foreground">Join the network saving thousands of lives across India.</p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="bg-emergency text-emergency-foreground hover:bg-emergency/90 glow-emergency h-12 px-8">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/finder">
                <Button size="lg" variant="outline" className="h-12 px-8 border-border hover:bg-muted">
                  Try Hospital Finder
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-emergency" />
            Emergency Hospital Network — India
          </div>
          <div>Saving lives through technology</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
