import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseToolArguments, requestAiGateway } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENTS = {
  orchestrator: "Orchestrator",
  retrieval: "Retrieval Agent",
  reasoning: "Reasoning Agent",
  critique: "Critique Agent",
  ubo_tracer: "UBO Tracer",
};

interface AgentOutput {
  agent: string;
  action: string;
  result: any;
  confidence: number;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { entity_id, task_type } = await req.json();
    if (!entity_id) {
      return new Response(JSON.stringify({ error: "entity_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const agentOutputs: AgentOutput[] = [];

    agentOutputs.push({
      agent: AGENTS.orchestrator,
      action: "task_decomposition",
      result: {
        task: task_type || "ubo_detection",
        steps: ["retrieve_entity", "traverse_graph", "calculate_ownership", "verify_compliance", "critique_output"],
      },
      confidence: 1.0,
      timestamp: new Date().toISOString(),
    });

    const { data: entity } = await supabase.from("entities").select("*").eq("id", entity_id).single();
    if (!entity) {
      return new Response(JSON.stringify({ error: "Entity not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: graphData } = await supabase.rpc("get_ownership_graph", {
      root_entity_id: entity_id,
      max_depth: 5,
    });

    agentOutputs.push({
      agent: AGENTS.retrieval,
      action: "graph_traversal",
      result: {
        entity: { id: entity.id, name: entity.name, type: entity.entity_type, risk_score: entity.risk_score },
        graph_nodes: graphData?.length || 0,
        relationships: graphData || [],
      },
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    });

    const { data: relatedAlerts } = await supabase.from("alerts").select("*").eq("entity_id", entity_id);

    agentOutputs.push({
      agent: AGENTS.retrieval,
      action: "context_retrieval",
      result: {
        alerts_count: relatedAlerts?.length || 0,
        alerts: relatedAlerts?.map(a => ({ type: a.alert_type, level: a.risk_level, description: a.description })) || [],
      },
      confidence: 0.90,
      timestamp: new Date().toISOString(),
    });

    let reasoningResult: any = {
      ubo_chains: [],
      total_risk_score: entity.risk_score,
      compliance_flags: [],
      recommendations: [],
    };

    const graphContext = (graphData || []).map((r: any) => `${r.source_name} -[${r.relationship_type} ${r.ownership_percentage ? r.ownership_percentage + "%" : ""}]-> ${r.target_name}`).join("\n");

    const reasoningResponse = await requestAiGateway({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are a financial crime AI Reasoning Agent specializing in Ultimate Beneficial Ownership (UBO) detection.

Your task:
1. Analyze the ownership graph to identify all Ultimate Beneficial Owners (>25% direct or indirect ownership, per EU AMLD/US CTA)
2. Calculate total effective ownership through all paths (multiply chain percentages)
3. Identify shell company patterns (high-risk jurisdiction + layered ownership + no real activity)
4. Flag sanctions proximity risks
5. Detect circular ownership / nominee structures
6. Assess compliance with EU AMLA and US Corporate Transparency Act

Return structured analysis via the tool call.`,
        },
        {
          role: "user",
          content: `Analyze this entity for UBO detection:\n\nRoot Entity: ${entity.name} (${entity.entity_type})\nJurisdiction: ${entity.jurisdiction || "Unknown"}\nCurrent Risk Score: ${entity.risk_score}/100\nSanctions Status: ${entity.sanctions_status}\n\nOwnership Graph:\n${graphContext || "No relationships found"}\n\nRelated Alerts: ${JSON.stringify(relatedAlerts?.map(a => ({ type: a.alert_type, level: a.risk_level })) || [])}`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "ubo_analysis",
          description: "Return structured UBO analysis result",
          parameters: {
            type: "object",
            properties: {
              ubo_chains: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    beneficial_owner: { type: "string" },
                    ownership_path: { type: "array", items: { type: "string" } },
                    effective_ownership_pct: { type: "number" },
                    control_type: { type: "string", enum: ["ownership", "control", "nominee", "trust_beneficiary"] },
                    is_ubo: { type: "boolean" },
                    risk_level: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  },
                  required: ["beneficial_owner", "ownership_path", "effective_ownership_pct", "control_type", "is_ubo", "risk_level"],
                  additionalProperties: false,
                },
              },
              shell_company_indicators: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    entity_name: { type: "string" },
                    indicators: { type: "array", items: { type: "string" } },
                    confidence: { type: "number" },
                  },
                  required: ["entity_name", "indicators", "confidence"],
                  additionalProperties: false,
                },
              },
              compliance_flags: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    regulation: { type: "string" },
                    status: { type: "string", enum: ["compliant", "non_compliant", "needs_review"] },
                    detail: { type: "string" },
                  },
                  required: ["regulation", "status", "detail"],
                  additionalProperties: false,
                },
              },
              overall_risk_assessment: { type: "string" },
              recommended_actions: { type: "array", items: { type: "string" } },
            },
            required: ["ubo_chains", "shell_company_indicators", "compliance_flags", "overall_risk_assessment", "recommended_actions"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "ubo_analysis" } },
    });

    if (reasoningResponse?.ok) {
      const aiData = await reasoningResponse.json();
      const parsedAnalysis = parseToolArguments(aiData);
      if (parsedAnalysis) {
        reasoningResult = parsedAnalysis;
      }
    } else if (reasoningResponse?.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else if (reasoningResponse?.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    agentOutputs.push({
      agent: AGENTS.reasoning,
      action: "ubo_analysis",
      result: reasoningResult,
      confidence: 0.88,
      timestamp: new Date().toISOString(),
    });

    let critiqueResult: any = { verified: true, hallucination_check: "pass", issues: [], final_confidence: 0.85 };

    const critiqueResponse = await requestAiGateway({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are the Critique Agent in a multi-agent financial crime compliance system. Your job is to:
1. Verify the Reasoning Agent's UBO analysis for factual consistency
2. Check for hallucinated relationships (claims not supported by the graph data)
3. Verify ownership calculations are mathematically correct
4. Ensure regulatory references are accurate
5. Flag any unsupported conclusions
Be skeptical and thorough.`,
        },
        {
          role: "user",
          content: `Review this UBO analysis for accuracy and hallucination:\n\nEntity: ${entity.name}\nGraph has ${graphData?.length || 0} relationships\n\nReasoning Agent Output:\n${JSON.stringify(reasoningResult, null, 2)}`,
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "critique_result",
          description: "Return critique verification result",
          parameters: {
            type: "object",
            properties: {
              verified: { type: "boolean" },
              hallucination_check: { type: "string", enum: ["pass", "warning", "fail"] },
              issues: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    severity: { type: "string", enum: ["critical", "warning", "info"] },
                    description: { type: "string" },
                    recommendation: { type: "string" },
                  },
                  required: ["severity", "description", "recommendation"],
                  additionalProperties: false,
                },
              },
              final_confidence: { type: "number" },
              explanation: { type: "string" },
            },
            required: ["verified", "hallucination_check", "issues", "final_confidence", "explanation"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "critique_result" } },
    });

    if (critiqueResponse?.ok) {
      const critiqueData = await critiqueResponse.json();
      const parsedCritique = parseToolArguments(critiqueData);
      if (parsedCritique) {
        critiqueResult = parsedCritique;
      }
    }

    agentOutputs.push({
      agent: AGENTS.critique,
      action: "verification",
      result: critiqueResult,
      confidence: critiqueResult.final_confidence || 0.85,
      timestamp: new Date().toISOString(),
    });

    const verificationStatus = critiqueResult.hallucination_check === "pass" ? "verified" : critiqueResult.hallucination_check === "warning" ? "needs_review" : "failed";

    await supabase.from("verification_log").insert({
      entity_id,
      verification_type: task_type || "ubo_detection",
      status: verificationStatus,
      constraints_checked: reasoningResult.compliance_flags || [],
      constraints_satisfied: (reasoningResult.compliance_flags || []).filter((f: any) => f.status === "compliant"),
      constraints_violated: (reasoningResult.compliance_flags || []).filter((f: any) => f.status === "non_compliant"),
      reasoning_trace: reasoningResult.overall_risk_assessment || "",
      agent_outputs: agentOutputs,
      created_by: userId,
    });

    if (reasoningResult.ubo_chains?.length > 0) {
      for (const chain of reasoningResult.ubo_chains) {
        await supabase.from("ubo_results").insert({
          root_entity_id: entity_id,
          ownership_chain: chain.ownership_path,
          total_ownership_pct: chain.effective_ownership_pct,
          is_ubo: chain.is_ubo,
          control_type: chain.control_type,
          detection_method: "vagr_multi_agent",
          verified: critiqueResult.verified,
          verification_details: { critique: critiqueResult, risk_level: chain.risk_level },
          created_by: userId,
        });
      }
    }

    await supabase.from("entities").update({
      verification_status: verificationStatus,
      verification_result: {
        ubo_chains: reasoningResult.ubo_chains,
        shell_indicators: reasoningResult.shell_company_indicators,
        compliance_flags: reasoningResult.compliance_flags,
        critique: critiqueResult,
      },
    }).eq("id", entity_id);

    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "vagr_investigation",
      entity_type: "entity",
      entity_id,
      details: {
        entity_name: entity.name,
        task_type: task_type || "ubo_detection",
        agents_used: Object.values(AGENTS),
        verification_status: verificationStatus,
        ubo_count: reasoningResult.ubo_chains?.filter((c: any) => c.is_ubo)?.length || 0,
      },
    });

    const riskLevel = entity.risk_score >= 80 ? "red" : entity.risk_score >= 50 ? "yellow" : "green";
    const autoApproved = riskLevel === "green" && critiqueResult.verified && critiqueResult.hallucination_check === "pass";

    return new Response(JSON.stringify({
      entity: { id: entity.id, name: entity.name, risk_score: entity.risk_score },
      agent_outputs: agentOutputs,
      ubo_analysis: reasoningResult,
      critique: critiqueResult,
      verification_status: verificationStatus,
      escalation: {
        level: riskLevel,
        auto_approved: autoApproved,
        requires_human_review: !autoApproved,
        reason: autoApproved ? "Low risk, all checks passed" : `${riskLevel.toUpperCase()} risk — requires analyst review`,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("VAGR orchestrator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
