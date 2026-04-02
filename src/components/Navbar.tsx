import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";

const navItems = [
  { label: "Product", href: "/#features" },
  { label: "Security", href: "/#security" },
  { label: "Compliance", href: "/#compliance" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Investigation", href: "/investigation" },
  { label: "Regulator", href: "/regulator" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/60 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <div className="absolute inset-0 rounded-lg animate-glow-pulse" />
          </div>
          <span className="font-mono text-lg font-bold tracking-tight text-foreground">
            VAGR<span className="text-primary">Hub</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/50"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-all hover:border-primary/50 hover:shadow-[0_0_15px_hsl(185_100%_50%/0.15)]"
          >
            Open Platform
          </Link>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground p-2">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl"
          >
            <div className="flex flex-col p-4 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
