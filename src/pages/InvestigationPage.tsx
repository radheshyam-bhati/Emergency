import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Shield, AlertTriangle, CheckCircle2, Brain,
  Search, User, Building2, Landmark,
  FileBarChart, Globe,
  Loader2, ShieldCheck, XCircle, Workflow,
  Scale, Fingerprint
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import GraphExplorer from "@/components/dashboard/GraphExplorer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useEntityScreen, useEntities, useGenerateReport,
  useVAGROrchestrator, useVerifyCompliance,
  Entity, VAGRResult, VerificationResult
} from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

function riskToColor(risk: number): string {
  if (risk >= 80) return "hsl(0, 85%, 55%)";
  if (risk >= 60) return "hsl(40, 95%, 55%)";
  return "hsl(160, 80%, 45%)";
}

const escalationColors: Record<string, string> = {
  red: "bg-destructive/10 text-destructive border-destructive/20",
  yellow: "bg-neon-amber/10 text-neon-amber border-neon-amber/20",
  green: "bg-neon-green/10 text-neon-green border-neon-green/20",
};

export default function InvestigationPage() {
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("organization");
  const [searchJurisdiction, setSearchJurisdiction] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [vagrResult, setVagrResult] = useState<VAGRResult | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const entityScreen = useEntityScreen();
  const generateReport = useGenerateReport();
  const vagrOrchestrator = useVAGROrchestrator();
  const verifyCompliance = useVerifyCompliance();
  const { data: entities } = useEntities(20);

  const handleScreen = async () => {
    if (!searchName.trim()) {
      toast({ title: "Enter an entity name", variant: "destructive" });
      return;
    }
    try {
      const result = await entityScreen.mutateAsync({
        entity_name: searchName.trim(),
        entity_type: searchType,
        jurisdiction: searchJurisdiction || undefined,
      });
      setSelectedEntity(result.entity);
      setVagrResult(null);
      setVerificationResult(null);
      setActiveTab("overview");
      toast({
        title: "Entity Screened",
        description: `${result.entity.name} — Risk Score: ${result.ai_analysis.risk_score}/100`,
      });
    } catch (e: any) {
      toast({ title: "Screening failed", description: e.message, variant: "destructive" });
    }
  };

  const handleVAGR = async () => {
    if (!selectedEntity) return;
    try {
      const result = await vagrOrchestrator.mutateAsync({ entity_id: selectedEntity.id, task_type: "ubo_detection" });
      setVagrResult(result);
      setActiveTab("agents");
      toast({
        title: "VAGR Analysis Complete",
        description: `${result.ubo_analysis.ubo_chains?.filter(c => c.is_ubo).length || 0} UBO(s) detected — ${result.verification_status}`,
      });
    } catch (e: any) {
      toast({ title: "VAGR analysis failed", description: e.message, variant: "destructive" });
    }
  };

  const handleVerify = async () => {
    if (!selectedEntity) return;
    try {
      const result = await verifyCompliance.mutateAsync({ entity_id: selectedEntity.id });
      setVerificationResult(result);
      setActiveTab("verification");
      toast({
        title: result.verification.status === "VERIFIED" ? "Compliance Verified ✓" : "Violations Found",
        description: `${result.verification.satisfied}/${result.verification.total_constraints} constraints satisfied`,
        variant: result.verification.violated > 0 ? "destructive" : "default",
      });
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedEntity) return;
    try {
      const result = await generateReport.mutateAsync({ entity_id: selectedEntity.id });
      toast({ title: "Report Generated", description: result.report.title });
    } catch (e: any) {
      toast({ title: "Report generation failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h2 className="font-semibold flex items-center gap-2 mb-4 text-sm">
            <Search className="h-4 w-4 text-primary" />
            VAGR Entity Screening — AI-Powered Multi-Agent Analysis
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Entity name (e.g., Meridian Holdings Ltd)"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="bg-secondary/50 border-border/50 focus:border-primary/50 flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleScreen()}
            />
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[160px] bg-secondary/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="trust">Trust</SelectItem>
                <SelectItem value="foundation">Foundation</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Jurisdiction"
              value={searchJurisdiction}
              onChange={(e) => setSearchJurisdiction(e.target.value)}
              className="bg-secondary/50 border-border/50 focus:border-primary/50 w-[180px]"
            />
            <Button onClick={handleScreen} disabled={entityScreen.isPending} className="gap-2">
              {entityScreen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Screen Entity
            </Button>
          </div>
        </motion.div>

        {selectedEntity && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-foreground">{selectedEntity.id.slice(0, 8).toUpperCase()}</span>
                  <span className={selectedEntity.risk_score >= 70 ? "risk-critical" : selectedEntity.risk_score >= 40 ? "risk-medium" : "risk-low"}>
                    {selectedEntity.risk_score >= 70 ? "HIGH RISK" : selectedEntity.risk_score >= 40 ? "MEDIUM" : "LOW"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-mono ${selectedEntity.sanctions_status === "hit" ? "bg-destructive/10 text-destructive border border-destructive/20" : selectedEntity.sanctions_status === "proximity" ? "bg-neon-amber/10 text-neon-amber border border-neon-amber/20" : "bg-neon-green/10 text-neon-green border border-neon-green/20"}`}>
                    SANCTIONS: {selectedEntity.sanctions_status.toUpperCase()}
                  </span>
                  {vagrResult && (
                    <span className={`px-2 py-0.5 rounded text-xs font-mono border ${escalationColors[vagrResult.escalation.level]}`}>
                      {vagrResult.escalation.level.toUpperCase()} — {vagrResult.escalation.auto_approved ? "AUTO-APPROVED" : "NEEDS REVIEW"}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-foreground">{selectedEntity.name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {(selectedEntity.metadata as any)?.ai_explanation || "AI analysis complete"}
                </p>
                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{selectedEntity.jurisdiction || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="capitalize">{selectedEntity.entity_type}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="text-center">
                  <div className="text-[10px] font-mono uppercase text-muted-foreground">Risk</div>
                  <div className="font-mono text-3xl font-bold" style={{ color: riskToColor(selectedEntity.risk_score) }}>{selectedEntity.risk_score}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={handleVAGR} disabled={vagrOrchestrator.isPending}>
                    {vagrOrchestrator.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Workflow className="h-3.5 w-3.5" />}
                    Run VAGR Agents
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10" onClick={handleVerify} disabled={verifyCompliance.isPending}>
                    {verifyCompliance.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scale className="h-3.5 w-3.5" />}
                    Verify Compliance
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs border-neon-green/30 text-neon-green hover:bg-neon-green/10" onClick={handleGenerateReport} disabled={generateReport.isPending}>
                    {generateReport.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileBarChart className="h-3.5 w-3.5" />}
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>

            {(vagrResult || verificationResult) && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="bg-secondary/50">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="agents">Agent Pipeline</TabsTrigger>
                  <TabsTrigger value="ubo">UBO Detection</TabsTrigger>
                  <TabsTrigger value="verification">Formal Verification</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {vagrResult && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">UBOs Found</div>
                        <div className="font-mono text-2xl font-bold text-primary">{vagrResult.ubo_analysis.ubo_chains?.filter(c => c.is_ubo).length || 0}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Shell Indicators</div>
                        <div className="font-mono text-2xl font-bold text-neon-amber">{vagrResult.ubo_analysis.shell_company_indicators?.length || 0}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Confidence</div>
                        <div className="font-mono text-2xl font-bold text-neon-green">{((vagrResult.critique.final_confidence || 0) * 100).toFixed(0)}%</div>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">Hallucination</div>
                        <div className={`font-mono text-2xl font-bold ${vagrResult.critique.hallucination_check === "pass" ? "text-neon-green" : "text-destructive"}`}>
                          {vagrResult.critique.hallucination_check === "pass" ? "CLEAR" : "FLAG"}
                        </div>
                      </div>
                    </div>
                  )}
                  {vagrResult?.ubo_analysis.overall_risk_assessment && (
                    <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                      <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2">AI Risk Assessment</h3>
                      <p className="text-sm text-foreground leading-relaxed">{vagrResult.ubo_analysis.overall_risk_assessment}</p>
                    </div>
                  )}
                  {vagrResult?.ubo_analysis.recommended_actions && vagrResult.ubo_analysis.recommended_actions.length > 0 && (
                    <div className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                      <h3 className="text-xs font-mono uppercase text-muted-foreground mb-2">Recommended Actions</h3>
                      <ul className="space-y-1.5">
                        {vagrResult.ubo_analysis.recommended_actions.map((action, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="agents" className="mt-4 space-y-3">
                  {vagrResult?.agent_outputs.map((output, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-4 rounded-lg bg-secondary/20 border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="font-mono text-xs font-bold text-primary">{output.agent}</span>
                          <span className="text-[10px] text-muted-foreground">→ {output.action}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(output.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-mono text-xs text-neon-green">{(output.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <Progress value={output.confidence * 100} className="h-1 mb-2" />
                      <pre className="text-[11px] text-muted-foreground font-mono overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {typeof output.result === "string" ? output.result : JSON.stringify(output.result, null, 2)}
                      </pre>
                    </motion.div>
                  ))}
                  {vagrResult?.critique.explanation && (
                    <div className="p-4 rounded-lg bg-neon-purple/5 border border-neon-purple/20">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-neon-purple" />
                        <span className="font-mono text-xs font-bold text-neon-purple">Critique Agent Summary</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{vagrResult.critique.explanation}</p>
                      {vagrResult.critique.issues?.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {vagrResult.critique.issues.map((issue: any, i: number) => (
                            <div key={i} className={`text-xs flex items-start gap-1.5 ${issue.severity === "critical" ? "text-destructive" : issue.severity === "warning" ? "text-neon-amber" : "text-muted-foreground"}`}>
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{issue.description}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="ubo" className="mt-4 space-y-3">
                  {vagrResult?.ubo_analysis.ubo_chains?.length ? vagrResult.ubo_analysis.ubo_chains.map((chain, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`p-4 rounded-lg border ${chain.is_ubo ? "bg-destructive/5 border-destructive/20" : "bg-secondary/20 border-border/50"}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">{chain.beneficial_owner}</span>
                          {chain.is_ubo && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-destructive/10 text-destructive border border-destructive/20">UBO</span>
                          )}
                        </div>
                        <span className="font-mono text-sm font-bold" style={{ color: riskToColor(chain.effective_ownership_pct > 50 ? 90 : chain.effective_ownership_pct > 25 ? 70 : 40) }}>
                          {chain.effective_ownership_pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap mt-2">
                        {chain.ownership_path.map((step, j) => (
                          <span key={j} className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary border border-border/50 text-foreground">{step}</span>
                            {j < chain.ownership_path.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span>Control: <span className="text-foreground capitalize">{chain.control_type}</span></span>
                        <span>Risk: <span className={chain.risk_level === "critical" || chain.risk_level === "high" ? "text-destructive" : "text-neon-green"}>{chain.risk_level}</span></span>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      {vagrResult ? "No UBO chains detected" : "Run VAGR Agents to detect UBOs"}
                    </div>
                  )}

                  {vagrResult?.ubo_analysis.shell_company_indicators?.length > 0 && (
                    <div className="p-4 rounded-lg bg-neon-amber/5 border border-neon-amber/20">
                      <h3 className="text-xs font-mono uppercase text-neon-amber mb-3 flex items-center gap-2">
                        <Fingerprint className="h-3.5 w-3.5" />
                        Shell Company Indicators
                      </h3>
                      {vagrResult.ubo_analysis.shell_company_indicators.map((shell: any, i: number) => (
                        <div key={i} className="mb-2 last:mb-0">
                          <div className="font-semibold text-sm">{shell.entity_name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {shell.indicators?.map((ind: string, j: number) => (
                              <span key={j} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neon-amber/10 text-neon-amber border border-neon-amber/20">{ind}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="verification" className="mt-4 space-y-3">
                  {verificationResult ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        {verificationResult.verification.status === "VERIFIED" ? (
                          <CheckCircle2 className="h-6 w-6 text-neon-green" />
                        ) : (
                          <XCircle className="h-6 w-6 text-destructive" />
                        )}
                        <div>
                          <div className="font-bold text-lg">{verificationResult.verification.status}</div>
                          <div className="text-xs text-muted-foreground">
                            {verificationResult.verification.satisfied}/{verificationResult.verification.total_constraints} constraints satisfied
                          </div>
                        </div>
                      </div>
                      {verificationResult.results.map((result: any, i: number) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className={`p-4 rounded-lg border ${result.satisfied ? "bg-neon-green/5 border-neon-green/20" : "bg-destructive/5 border-destructive/20"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {result.satisfied ? <CheckCircle2 className="h-4 w-4 text-neon-green" /> : <XCircle className="h-4 w-4 text-destructive" />}
                              <span className="font-semibold text-sm">{result.name}</span>
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">{result.constraint_id}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">{result.regulation}</div>
                          <div className="font-mono text-[10px] text-primary/70 bg-primary/5 px-2 py-1 rounded mt-1 mb-2">{result.formal_logic}</div>
                          <p className="text-sm text-foreground">{result.details}</p>
                        </motion.div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Click "Verify Compliance" to run formal constraint checking
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </motion.div>
        )}

        <div className="grid xl:grid-cols-12 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-8">
            <GraphExplorer />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="xl:col-span-4">
            <div className="glass-card overflow-hidden h-full">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
                <h2 className="font-semibold flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  Screened Entities
                </h2>
                <span className="font-mono text-[10px] text-muted-foreground">{entities?.length || 0} entities</span>
              </div>
              <div className="divide-y divide-border/30 max-h-[520px] overflow-y-auto">
                {entities && entities.length > 0 ? entities.map((entity, i) => (
                  <motion.div
                    key={entity.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="px-4 py-3 hover:bg-secondary/30 transition-colors cursor-pointer group"
                    onClick={() => { setSelectedEntity(entity); setVagrResult(null); setVerificationResult(null); setActiveTab("overview"); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary border border-border shrink-0 mt-0.5">
                        {entity.entity_type === "person" ? <User className="h-4 w-4 text-muted-foreground" /> :
                         entity.entity_type === "trust" ? <Landmark className="h-4 w-4 text-muted-foreground" /> :
                         <Building2 className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-xs truncate">{entity.name}</span>
                          <span className="font-mono text-xs font-bold" style={{ color: riskToColor(entity.risk_score) }}>{entity.risk_score}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-muted-foreground capitalize">{entity.entity_type}</span>
                          <span className="text-[9px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground">{entity.jurisdiction || "Unknown"}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">No entities screened yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use the search above to screen an entity</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
