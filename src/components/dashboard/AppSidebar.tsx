import {
  LayoutDashboard, Search as SearchIcon, Network, ArrowLeftRight,
  ShieldAlert, FileText, Settings, Shield, LogOut, ChevronDown
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Investigations", url: "/investigation", icon: SearchIcon },
  { title: "Graph Explorer", url: "/graph", icon: Network },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Risk Alerts", url: "/alerts", icon: ShieldAlert },
];

const secondaryNav = [
  { title: "Reports", url: "/regulator", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-mono text-sm font-bold tracking-tight text-foreground">
              VAGR<span className="text-primary">Hub</span>
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 px-3">
            {!collapsed ? "Main" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10 hover:text-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60 px-3">
            {!collapsed ? "System" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      activeClassName="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10 hover:text-primary"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-mono font-bold text-primary">
              {(user?.email?.[0] ?? "U").toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.user_metadata?.display_name ?? "User"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={async () => { await signOut(); navigate("/login"); }}
              title="Sign out"
            >
              <LogOut className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer shrink-0" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
