import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, User, Shield, Bell, Loader2, CheckCircle2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [realtimeAlerts, setRealtimeAlerts] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("user_id", user.id).single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your display name has been saved." });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Manage your profile, security, and notification preferences</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-primary" />
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input value={user?.email || ""} disabled className="bg-secondary/30 border-border/50 mt-1 text-sm" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="bg-secondary/50 border-border/50 mt-1 text-sm"
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              Save Profile
            </Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-neon-purple" />
            Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Two-Factor Authentication</div>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-amber/10 text-neon-amber border border-neon-amber/20">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Active Sessions</div>
                <p className="text-xs text-muted-foreground">Currently signed in on 1 device</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-neon-green/10 text-neon-green border border-neon-green/20">1 Session</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h2 className="font-semibold text-sm flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-neon-amber" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Email Notifications</div>
                <p className="text-xs text-muted-foreground">Receive alerts and reports via email</p>
              </div>
              <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Real-time Alert Feed</div>
                <p className="text-xs text-muted-foreground">Live push notifications for new risk alerts</p>
              </div>
              <Switch checked={realtimeAlerts} onCheckedChange={setRealtimeAlerts} />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
