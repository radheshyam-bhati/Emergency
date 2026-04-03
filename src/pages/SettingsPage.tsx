import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import AppSidebar, { MobileHeader } from "@/components/AppSidebar";

const SettingsPage = () => {
  const { profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    // Simulated save
    setTimeout(() => {
      toast.success("Settings saved successfully.");
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:pl-56">
        <MobileHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and network settings.</p>
          </div>

          <div className="mx-auto max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={profile?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Your email cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input value={profile?.role || ""} className="capitalize" disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure emergency alert forwarding.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Email Alerts</label>
                    <p className="text-xs text-muted-foreground">Receive major dispatch alerts via email.</p>
                  </div>
                  <Button 
                    variant={emailAlerts ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => {
                      if (!emailAlerts) toast.success("Email alerts configured!");
                      setEmailAlerts(!emailAlerts);
                    }}
                  >
                    {emailAlerts ? "Disable" : "Configure"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-medium">Push Notifications</label>
                    <p className="text-xs text-muted-foreground">Web push notifications for incoming events.</p>
                  </div>
                  <Button 
                    variant={pushEnabled ? "secondary" : "outline"} 
                    size="sm"
                    onClick={() => {
                      if (!pushEnabled) toast.success("Push notifications enabled!");
                      setPushEnabled(!pushEnabled);
                    }}
                  >
                    {pushEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button onClick={handleSave} className="bg-emergency hover:bg-emergency/90" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
