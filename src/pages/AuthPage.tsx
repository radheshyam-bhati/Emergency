import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Lock, Mail, Shield, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    let error;

    if (isSignUp) {
      const res = await signUp(email, password, fullName);
      error = res.error;
    } else {
      const res = await signIn(email, password);
      error = res.error;
    }

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(isSignUp ? "Account created and signed in" : "Signed in successfully");
    navigate("/command-center");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emergency glow-emergency">
            <Heart className="h-7 w-7 text-emergency-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Emergency Hospital Network</h1>
          <p className="mt-1 text-sm text-muted-foreground">{isSignUp ? "Create a dispatcher account to request access." : "Sign in as an admin or dispatcher to access the live control room."}</p>
        </div>

        <div className="rounded-xl border border-emergency/20 bg-emergency/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emergency/10 text-emergency">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Authenticated Control Room Access</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use your provisioned operator credentials to enter the live emergency coordination workspace.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
          {isSignUp && (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Enter full name"
                    className="pl-10"
                    required={isSignUp}
                  />
                </div>
              </div>

            </>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="operator@network.example"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-medium text-muted-foreground">Password</label>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-xs font-medium text-emergency hover:underline"
                  onClick={() => toast.info("Password recovery feature coming soon")}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={isSignUp ? "At least 12 characters" : "Enter your password"}
                className="pl-10 pr-10"
                minLength={isSignUp ? 12 : 1}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-emergency text-emergency-foreground hover:bg-emergency/90" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
          
          <div className="text-center text-sm pt-2">
            <span className="text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </span>{" "}
            <button
              type="button"
              className="font-medium text-emergency hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
