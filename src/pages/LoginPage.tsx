import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, Eye, EyeOff, ArrowRight, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NetworkVisualization from "@/components/landing/NetworkVisualization";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Stage = "login" | "signup";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stage, setStage] = useState<Stage>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (error) {
      setErrors({ general: error.message });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName || email },
      },
    });
    setSubmitting(false);

    if (error) {
      setErrors({ general: error.message });
    } else {
      setSignupSuccess(true);
    }
  };

  if (signupSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
        <NetworkVisualization />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 glass-card p-10 max-w-md mx-4 text-center space-y-4">
          <Shield className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-xl font-bold">Check your email</h2>
          <p className="text-sm text-muted-foreground">We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>. Click it to activate your account.</p>
          <Button variant="outline" onClick={() => { setSignupSuccess(false); setStage("login"); }}>Back to Login</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <NetworkVisualization />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <div className="glow-orb w-96 h-96 bg-primary/10 -top-48 -left-48 absolute" />
      <div className="glow-orb w-72 h-72 bg-accent/10 -bottom-36 -right-36 absolute" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 md:p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-7 w-7 text-primary" />
              <span className="font-mono text-lg font-bold text-foreground">VAGR<span className="text-primary">Hub</span></span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {stage === "login" ? "Secure Access" : "Create Account"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {stage === "login" ? "Sign in to your compliance dashboard" : "Join the compliance intelligence platform"}
            </p>
          </div>

          {errors.general && (
            <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {errors.general}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={stage}
              initial={{ opacity: 0, x: stage === "login" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: stage === "login" ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={stage === "login" ? handleLogin : handleSignup}
              className="space-y-5"
            >
              {stage === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-muted-foreground">Display Name</Label>
                  <Input
                    id="name"
                    placeholder="Senior Analyst"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary/50 border-border/50 focus:border-primary/50 h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="analyst@institution.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined, general: undefined })); }}
                  className="bg-secondary/50 border-border/50 focus:border-primary/50 h-11"
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined, general: undefined })); }}
                    className="bg-secondary/50 border-border/50 focus:border-primary/50 h-11 pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button type="submit" disabled={submitting} className="w-full h-11 font-semibold group transition-shadow hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : stage === "login" ? (
                  <>Sign In <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
                ) : (
                  <>Create Account <UserPlus className="h-4 w-4" /></>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStage(stage === "login" ? "signup" : "login"); setErrors({}); }}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {stage === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2 pt-2">
            <Lock className="h-3 w-3 text-neon-green" />
            <span className="text-[11px] font-mono text-muted-foreground tracking-wide">End-to-End Encrypted Login</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
