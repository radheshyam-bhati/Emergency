import { useState } from "react";
import { Heart, LayoutDashboard, Building2, Ambulance, Activity, ArrowLeft, Users, MapPin, Shield, LogOut, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/command-center", label: "Command Center", icon: LayoutDashboard },
  { to: "/hospitals", label: "Hospitals", icon: Building2 },
  { to: "/ambulances", label: "Ambulances", icon: Ambulance },
  { to: "/patients", label: "Patient Records", icon: Users },
  { to: "/finder", label: "Hospital Finder", icon: MapPin },
  { to: "/admin", label: "Admin Panel", icon: Shield },
];

const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emergency">
          <Heart className="h-4 w-4 text-emergency-foreground" />
        </div>
        <div>
          <span className="text-sm font-bold">EHN</span>
          <span className="ml-1 text-[10px] text-muted-foreground">Control</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-emergency/10 text-emergency font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-2">
        {profile && (
          <div className="mb-2 rounded-lg bg-muted/30 px-3 py-2">
            <div className="text-xs font-medium truncate">{profile.fullName || profile.email}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{profile.role}</div>
          </div>
        )}
        <button
          onClick={() => { handleSignOut(); onNavigate?.(); }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>
        <div className="mt-2 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-stable" />
            <span className="text-[10px] text-stable font-medium">System Online</span>
          </div>
        </div>
      </div>
    </>
  );
};

export const MobileHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-surface-overlay px-4 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 p-0 flex flex-col">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emergency">
          <Heart className="h-3.5 w-3.5 text-emergency-foreground" />
        </div>
        <span className="text-sm font-bold">EHN</span>
      </div>
    </div>
  );
};

const AppSidebar = () => {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r border-border bg-surface-overlay md:flex">
      <SidebarContent />
    </aside>
  );
};

export default AppSidebar;
