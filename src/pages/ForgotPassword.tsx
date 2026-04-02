import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emergency glow-emergency">
            <Heart className="h-7 w-7 text-emergency-foreground" />
          </div>
          <h1 className="text-xl font-bold">Reset Password</h1>
        </div>
        {sent ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Check your email for a password reset link.</p>
            <Link to="/auth" className="mt-4 inline-block text-sm text-emergency hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@hospital.org" className="pl-10" required />
            </div>
            <Button type="submit" className="w-full bg-emergency text-emergency-foreground" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:text-foreground">Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
