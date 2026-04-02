import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import NotificationPanel from "./NotificationPanel";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <header className="h-14 flex items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur-xl px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search entities, cases, alerts..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="w-64 lg:w-80 h-8 pl-9 text-xs bg-secondary/50 border-border/50 focus:border-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Live indicator */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neon-green/10 border border-neon-green/20">
                <div className="status-dot-active" />
                <span className="text-[10px] font-mono text-neon-green">LIVE</span>
              </div>

              {/* Notifications */}
              <NotificationPanel />

              {/* User */}
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-secondary/50 transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-primary">SA</span>
                </div>
                <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
