import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, Filter, GitBranch, Users, Globe } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GraphExplorer from "@/components/dashboard/GraphExplorer";
import { Input } from "@/components/ui/input";
import { useEntities } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export default function GraphPage() {
  const { data: entities } = useEntities(50);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [graphStats, setGraphStats] = useState({ nodes: 0, edges: 0, maxDepth: 0 });

  useEffect(() => {
    async function fetchStats() {
      const [{ count: nodeCount }, { count: edgeCount }] = await Promise.all([
        supabase.from("entities").select("*", { count: "exact", head: true }),
        supabase.from("entity_relationships").select("*", { count: "exact", head: true }),
      ]);
      setGraphStats({ nodes: nodeCount || 0, edges: edgeCount || 0, maxDepth: 5 });
    }
    fetchStats();
  }, [entities]);

  const filtered = entities?.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Ownership Graph Explorer
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Visualize entity relationships, ownership chains, and UBO structures
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Entities", value: graphStats.nodes, icon: Users, color: "text-primary" },
            { label: "Relationships", value: graphStats.edges, icon: GitBranch, color: "text-neon-purple" },
            { label: "Max Traversal Depth", value: graphStats.maxDepth, icon: Globe, color: "text-neon-amber" },
          ].map((stat) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">{stat.label}</span>
              </div>
              <div className="font-mono text-2xl font-bold">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <GraphExplorer />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Entity Directory
            </h2>
            <Input
              placeholder="Filter entities…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-secondary/50 border-border/50 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filtered.slice(0, 12).map((entity) => (
              <div
                key={entity.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/30 hover:bg-primary/5 ${
                  selectedEntityId === entity.id ? "border-primary/50 bg-primary/10" : "border-border/50 bg-secondary/20"
                }`}
                onClick={() => setSelectedEntityId(entity.id)}
              >
                <div className="font-medium text-xs truncate">{entity.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground capitalize">{entity.entity_type}</span>
                  <span className="font-mono text-[10px] font-bold" style={{
                    color: entity.risk_score >= 70 ? "hsl(0,85%,55%)" : entity.risk_score >= 40 ? "hsl(40,95%,55%)" : "hsl(160,80%,45%)"
                  }}>{entity.risk_score}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-6 text-sm text-muted-foreground">
                {entities?.length ? "No matching entities" : "No entities yet — screen entities from the Investigation page"}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
