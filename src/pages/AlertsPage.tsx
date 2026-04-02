import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, ChevronRight, CheckCircle2, Clock,
  AlertTriangle, XCircle, Filter, Search
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAlerts } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const riskBadge: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-neon-amber/10 text-neon-amber border-neon-amber/20",
  low: "bg-neon-green/10 text-neon-green border-neon-green/20",
};

const statusIcon: Record<string, typeof CheckCircle2> = {
  active: AlertTriangle,
  investigating: Clock,
  resolved: CheckCircle2,
  dismissed: XCircle,
};

export default function AlertsPage() {
  const { data: alerts, refetch } = useAlerts(100);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = (alerts || []).filter(a => {
    if (filter !== "all" && a.status !== filter) return false;
    if (searchTerm && !a.entity_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: alerts?.length || 0,
    active: alerts?.filter(a => a.status === "active").length || 0,
    investigating: alerts?.filter(a => a.status === "investigating").length || 0,
    resolved: alerts?.filter(a => a.status === "resolved").length || 0,
  };

  const handleUpdateStatus = async (alertId: string, newStatus: string) => {
    const { error } = await supabase.from("alerts").update({
      status: newStatus,
      ...(newStatus === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
    }).eq("id", alertId);
    if (error) {
      toast({ title: "Failed to update alert", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Alert updated", description: `Status changed to ${newStatus}` });
      refetch();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Risk Alerts
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Monitor, investigate, and resolve compliance alerts</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Alerts", value: counts.all, color: "text-foreground" },
            { label: "Active", value: counts.active, color: "text-destructive" },
            { label: "Investigating", value: counts.investigating, color: "text-neon-amber" },
            { label: "Resolved", value: counts.resolved, color: "text-neon-green" },
          ].map((s) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
              <div className="text-[10px] font-mono text-muted-foreground uppercase">{s.label}</div>
              <div className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search alerts by entity…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 bg-secondary/50 border-border/50 text-xs"
          />
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="investigating">Investigating</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Alert List */}
        <div className="space-y-2">
          {filtered.length > 0 ? filtered.map((alert, i) => {
            const StatusIcon = statusIcon[alert.status] || AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <StatusIcon className={`h-5 w-5 shrink-0 mt-0.5 ${
                      alert.status === "active" ? "text-destructive" :
                      alert.status === "investigating" ? "text-neon-amber" :
                      alert.status === "resolved" ? "text-neon-green" : "text-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-[10px] text-muted-foreground">{alert.alert_number}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${riskBadge[alert.risk_level] || riskBadge.medium}`}>
                          {alert.risk_level.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{alert.alert_type}</span>
                      </div>
                      <div className="font-semibold text-sm">{alert.entity_name}</div>
                      {alert.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>}
                      {alert.ai_explanation && (
                        <p className="text-xs text-primary/70 mt-1.5 bg-primary/5 px-2 py-1 rounded inline-block">
                          AI: {alert.ai_explanation}
                        </p>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                        {alert.resolved_at && <span className="ml-3">Resolved: {new Date(alert.resolved_at).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {alert.status === "active" && (
                      <Button size="sm" variant="outline" className="text-[10px] h-7 border-neon-amber/30 text-neon-amber hover:bg-neon-amber/10"
                        onClick={() => handleUpdateStatus(alert.id, "investigating")}>
                        Investigate
                      </Button>
                    )}
                    {(alert.status === "active" || alert.status === "investigating") && (
                      <Button size="sm" variant="outline" className="text-[10px] h-7 border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                        onClick={() => handleUpdateStatus(alert.id, "resolved")}>
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }) : (
            <div className="glass-card p-12 text-center">
              <ShieldAlert className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchTerm || filter !== "all" ? "No alerts match your filters" : "No alerts yet — screen entities to generate alerts"}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
