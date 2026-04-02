import { useRef, useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Network, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";
import { useEntities } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface GraphNode {
  id: string;
  label: string;
  type: "person" | "organization" | "trust" | "foundation" | "account";
  x: number;
  y: number;
  risk: number;
  sanctions?: boolean;
}

interface GraphEdge {
  source: string;
  target: string;
  label: string;
  ownership?: number;
}

const typeColors: Record<string, { fill: string; stroke: string; text: string }> = {
  person: { fill: "hsl(185, 100%, 50%)", stroke: "hsl(185, 100%, 60%)", text: "#0a1628" },
  organization: { fill: "hsl(220, 90%, 60%)", stroke: "hsl(220, 90%, 70%)", text: "#fff" },
  trust: { fill: "hsl(270, 80%, 60%)", stroke: "hsl(270, 80%, 70%)", text: "#fff" },
  foundation: { fill: "hsl(40, 95%, 55%)", stroke: "hsl(40, 95%, 65%)", text: "#0a1628" },
  account: { fill: "hsl(228, 15%, 25%)", stroke: "hsl(228, 15%, 35%)", text: "#94a3b8" },
};

function riskToColor(risk: number): string {
  if (risk >= 80) return "hsl(0, 85%, 55%)";
  if (risk >= 60) return "hsl(40, 95%, 55%)";
  return "hsl(160, 80%, 45%)";
}

function layoutNodes(entities: any[]): GraphNode[] {
  if (entities.length === 0) return [];
  const cx = 400, cy = 280;
  const radius = Math.min(200, 80 + entities.length * 20);
  return entities.map((e, i) => {
    const angle = (2 * Math.PI * i) / entities.length - Math.PI / 2;
    return {
      id: e.id,
      label: e.name.length > 20 ? e.name.slice(0, 18) + "…" : e.name,
      type: (e.entity_type || "organization") as GraphNode["type"],
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      risk: e.risk_score ?? 0,
      sanctions: e.sanctions_status === "hit",
    };
  });
}

export default function GraphExplorer() {
  const { data: entities, isLoading } = useEntities(30);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    async function fetchRelationships() {
      const { data } = await supabase
        .from("entity_relationships")
        .select("*, source:entities!source_entity_id(id, name, entity_type, risk_score, sanctions_status), target:entities!target_entity_id(id, name, entity_type, risk_score, sanctions_status)")
        .eq("is_active", true)
        .limit(100);
      if (data) setRelationships(data);
    }
    fetchRelationships();
  }, [entities]);

  const graphNodes = layoutNodes(entities || []);
  const graphEdges: GraphEdge[] = relationships.map((r: any) => ({
    source: r.source_entity_id,
    target: r.target_entity_id,
    label: r.relationship_type || "RELATED",
    ownership: r.ownership_percentage ? Number(r.ownership_percentage) : undefined,
  }));

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    graphNodes.forEach(n => {
      positions[n.id] = nodePositions[n.id] || { x: n.x, y: n.y };
    });
    setNodePositions(positions);
  }, [entities?.length]);

  const handleMouseDown = useCallback((nodeId: string) => {
    setDragNode(nodeId);
    setSelectedNode(nodeId);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!dragNode || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoom;
      const y = (e.clientY - rect.top) / zoom;
      setNodePositions((prev) => ({ ...prev, [dragNode]: { x, y } }));
    },
    [dragNode, zoom]
  );

  const handleMouseUp = useCallback(() => setDragNode(null), []);

  const getNodePos = (id: string) => nodePositions[id] || { x: 400, y: 280 };
  const selectedData = graphNodes.find((n) => n.id === selectedNode);

  if (isLoading) {
    return (
      <div className="glass-card flex items-center justify-center" style={{ minHeight: 400 }}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading entity graph…</span>
      </div>
    );
  }

  if (!entities || entities.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Network className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No entities in graph yet</p>
        <p className="text-xs text-muted-foreground mt-1">Screen an entity to populate the graph</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <h2 className="font-semibold flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          Entity Graph Explorer
          <span className="font-mono text-[10px] text-muted-foreground ml-2">
            {graphNodes.length} nodes · {graphEdges.length} edges
          </span>
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.min(z + 0.1, 2))} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => setZoom(1)} className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="flex-1 relative bg-background/50" style={{ minHeight: 560 }}>
          <svg
            ref={svgRef}
            width="100%"
            height="560"
            className="cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <g transform={`scale(${zoom})`}>
              {graphEdges.map((edge, i) => {
                const s = getNodePos(edge.source);
                const t = getNodePos(edge.target);
                const mx = (s.x + t.x) / 2;
                const my = (s.y + t.y) / 2;
                const isHighlighted = hoveredNode === edge.source || hoveredNode === edge.target;
                return (
                  <g key={`edge-${i}`}>
                    <line
                      x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                      stroke={isHighlighted ? "hsl(185, 100%, 50%)" : "hsl(228, 15%, 20%)"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      strokeDasharray={edge.label === "TRANSACTS_WITH" ? "4 4" : "none"}
                      opacity={hoveredNode && !isHighlighted ? 0.2 : 0.8}
                    />
                    <rect x={mx - 32} y={my - 8} width={64} height={16} rx={4}
                      fill="hsl(228, 22%, 9%)" stroke="hsl(228, 15%, 16%)" strokeWidth={0.5} opacity={isHighlighted ? 1 : 0.7}
                    />
                    <text x={mx} y={my + 4} textAnchor="middle" fontSize={7} fontFamily="JetBrains Mono" fill="hsl(215, 15%, 50%)">
                      {edge.ownership ? `${edge.label} ${edge.ownership}%` : edge.label}
                    </text>
                  </g>
                );
              })}

              {graphNodes.map((node) => {
                const pos = getNodePos(node.id);
                const colors = typeColors[node.type] || typeColors.organization;
                const isHovered = hoveredNode === node.id;
                const isSelected = selectedNode === node.id;
                const r = node.type === "person" ? 28 : 24;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                    onMouseDown={() => handleMouseDown(node.id)}
                    className="cursor-pointer"
                  >
                    {(isHovered || isSelected) && (
                      <circle r={r + 10} fill="none" stroke={colors.stroke} strokeWidth={1} opacity={0.3}>
                        <animate attributeName="r" values={`${r + 8};${r + 14};${r + 8}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle r={r + 3} fill="none" stroke={riskToColor(node.risk)} strokeWidth={2} opacity={0.4} />
                    <circle
                      r={r} fill={colors.fill}
                      stroke={isSelected ? "#fff" : colors.stroke}
                      strokeWidth={isSelected ? 2 : 1}
                      opacity={hoveredNode && !isHovered ? 0.4 : 1}
                    />
                    {node.sanctions && (
                      <circle cx={r - 4} cy={-r + 4} r={6} fill="hsl(0, 85%, 55%)" stroke="hsl(228, 22%, 9%)" strokeWidth={2} />
                    )}
                    <text y={r + 16} textAnchor="middle" fontSize={9} fontFamily="Inter" fontWeight={500} fill="hsl(210, 20%, 85%)">
                      {node.label}
                    </text>
                    <text y={4} textAnchor="middle" fontSize={8} fontFamily="JetBrains Mono" fontWeight={600} fill={colors.text}>
                      {node.type.charAt(0).toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
        {selectedData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 border-l border-border/50 p-5 bg-card/50"
          >
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (typeColors[selectedData.type] || typeColors.organization).fill }} />
                <span className="font-mono text-xs uppercase text-muted-foreground">{selectedData.type}</span>
              </div>
              <h3 className="font-semibold text-lg">{selectedData.label}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <span className="font-mono font-bold" style={{ color: riskToColor(selectedData.risk) }}>{selectedData.risk}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${selectedData.risk}%` }} className="h-full rounded-full" style={{ backgroundColor: riskToColor(selectedData.risk) }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Connections</span>
                <span className="font-mono text-sm text-foreground">
                  {graphEdges.filter((e) => e.source === selectedData.id || e.target === selectedData.id).length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sanctions</span>
                <span className={selectedData.sanctions ? "risk-high" : "risk-low"}>
                  {selectedData.sanctions ? "HIT" : "CLEAR"}
                </span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Legend</span>
              <div className="mt-2 space-y-1.5">
                {Object.entries(typeColors).map(([type, colors]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.fill }} />
                    <span className="text-xs text-muted-foreground capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
