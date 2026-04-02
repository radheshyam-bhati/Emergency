import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ──
export interface Entity {
  id: string;
  name: string;
  entity_type: string;
  jurisdiction: string | null;
  risk_score: number;
  sanctions_status: string;
  metadata: Record<string, any>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  alert_number: string;
  entity_id: string | null;
  entity_name: string;
  alert_type: string;
  risk_level: string;
  description: string | null;
  ai_explanation: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  entity_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  report_number: string;
  title: string;
  report_type: string;
  entity_id: string | null;
  content: string | null;
  ai_summary: string | null;
  status: string;
  confidence: number | null;
  agents_used: string[];
  findings_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIInsight {
  severity: string;
  title: string;
  description: string;
  agent: string;
  confidence: number;
}

export interface EntityRelationship {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  ownership_percentage: number | null;
  metadata: Record<string, any>;
  created_at: string;
}

// ── VAGR Types ──
export interface UBOChain {
  beneficial_owner: string;
  ownership_path: string[];
  effective_ownership_pct: number;
  control_type: string;
  is_ubo: boolean;
  risk_level: string;
}

export interface AgentOutput {
  agent: string;
  action: string;
  result: any;
  confidence: number;
  timestamp: string;
}

export interface VAGRResult {
  entity: { id: string; name: string; risk_score: number };
  agent_outputs: AgentOutput[];
  ubo_analysis: {
    ubo_chains: UBOChain[];
    shell_company_indicators: any[];
    compliance_flags: any[];
    overall_risk_assessment: string;
    recommended_actions: string[];
  };
  critique: {
    verified: boolean;
    hallucination_check: string;
    issues: any[];
    final_confidence: number;
    explanation: string;
  };
  verification_status: string;
  escalation: {
    level: string;
    auto_approved: boolean;
    requires_human_review: boolean;
    reason: string;
  };
}

export interface VerificationResult {
  entity: { id: string; name: string };
  verification: {
    status: string;
    total_constraints: number;
    satisfied: number;
    violated: number;
  };
  results: any[];
  violations: any[];
}

// ── Dashboard Stats ──
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [alertsRes, casesRes, entitiesRes] = await Promise.all([
        supabase.from("alerts").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("cases").select("*", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
        supabase.from("entities").select("*", { count: "exact", head: true }),
      ]);
      return {
        activeAlerts: alertsRes.count || 0,
        openCases: casesRes.count || 0,
        entitiesMonitored: entitiesRes.count || 0,
      };
    },
    refetchInterval: 10000,
  });
}

// ── Alerts ──
export function useAlerts(limit = 20) {
  return useQuery({
    queryKey: ["alerts", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Alert[];
    },
    refetchInterval: 15000,
  });
}

// ── Cases ──
export function useCases(limit = 20) {
  return useQuery({
    queryKey: ["cases", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Case[];
    },
  });
}

// ── Entities ──
export function useEntities(limit = 50) {
  return useQuery({
    queryKey: ["entities", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .order("risk_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Entity[];
    },
  });
}

export function useEntity(entityId: string | null) {
  return useQuery({
    queryKey: ["entity", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("id", entityId!)
        .single();
      if (error) throw error;
      return data as Entity;
    },
  });
}

// ── Entity Relationships (Graph) ──
export function useEntityGraph(entityId: string | null) {
  return useQuery({
    queryKey: ["entity-graph", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entity_relationships")
        .select("*, source:entities!source_entity_id(*), target:entities!target_entity_id(*)")
        .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`);
      if (error) throw error;
      return data;
    },
  });
}

// ── Reports ──
export function useReports(limit = 20) {
  return useQuery({
    queryKey: ["reports", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Report[];
    },
  });
}

// ── Entity Screen (AI) ──
export function useEntityScreen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { entity_name: string; entity_type?: string; jurisdiction?: string }) => {
      const { data, error } = await supabase.functions.invoke("entity-screen", { body: params });
      if (error) throw error;
      return data as { entity: Entity; ai_analysis: any };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

// ── Generate Report (AI) ──
export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { entity_id: string; report_type?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-report", { body: params });
      if (error) throw error;
      return data as { report: Report };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

// ── AI Insights ──
export function useAIInsights() {
  return useQuery({
    queryKey: ["ai-insights"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-insights");
      if (error) throw error;
      return (data as { insights: AIInsight[] }).insights;
    },
    refetchInterval: 60000,
  });
}

// ── Activity Log ──
export function useActivityLog(limit = 20) {
  return useQuery({
    queryKey: ["activity-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });
}

// ── Risk Distribution ──
export function useRiskDistribution() {
  return useQuery({
    queryKey: ["risk-distribution"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entities").select("risk_score");
      if (error) throw error;
      const entities = data || [];
      return {
        high: entities.filter(e => (e.risk_score ?? 0) >= 70).length,
        medium: entities.filter(e => (e.risk_score ?? 0) >= 40 && (e.risk_score ?? 0) < 70).length,
        low: entities.filter(e => (e.risk_score ?? 0) < 40).length,
        total: entities.length,
      };
    },
    refetchInterval: 30000,
  });
}

// ── Realtime Alerts Subscription ──
export function subscribeToRealtimeAlerts(onNewAlert: (alert: Alert) => void) {
  const channel = supabase
    .channel("realtime-alerts")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
      onNewAlert(payload.new as Alert);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

// ── VAGR Orchestrator (Multi-Agent UBO Detection) ──
export function useVAGROrchestrator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { entity_id: string; task_type?: string }) => {
      const { data, error } = await supabase.functions.invoke("vagr-orchestrator", { body: params });
      if (error) throw error;
      return data as VAGRResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      queryClient.invalidateQueries({ queryKey: ["activity-log"] });
    },
  });
}

// ── Formal Verification ──
export function useVerifyCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { entity_id: string }) => {
      const { data, error } = await supabase.functions.invoke("verify-compliance", { body: params });
      if (error) throw error;
      return data as VerificationResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-log"] });
    },
  });
}

// ── Verification Log ──
export function useVerificationLog(entityId: string | null) {
  return useQuery({
    queryKey: ["verification-log", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verification_log")
        .select("*")
        .eq("entity_id", entityId!)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });
}

// ── UBO Results ──
export function useUBOResults(entityId: string | null) {
  return useQuery({
    queryKey: ["ubo-results", entityId],
    enabled: !!entityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ubo_results")
        .select("*")
        .eq("root_entity_id", entityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
