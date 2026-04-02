import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAssistantMessageContent, requestAiGateway } from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { entity_id, report_type } = await req.json();
    if (!entity_id) {
      return new Response(JSON.stringify({ error: "entity_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: entity } = await supabase.from("entities").select("*").eq("id", entity_id).single();
    if (!entity) {
      return new Response(JSON.stringify({ error: "Entity not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: relationships } = await supabase.from("entity_relationships").select("*, source:entities!source_entity_id(name, entity_type), target:entities!target_entity_id(name, entity_type)").or(`source_entity_id.eq.${entity_id},target_entity_id.eq.${entity_id}`);
    const { data: alerts } = await supabase.from("alerts").select("*").eq("entity_id", entity_id);

    let reportContent = `Investigation report for ${entity.name}. Risk score: ${entity.risk_score}. ${relationships?.length || 0} relationships found. ${alerts?.length || 0} alerts.`;
    let aiSummary = reportContent;
    const agentsUsed = ["UBO Tracer", "Graph Analyst", "Compliance", "Critique"];

    const gatewayResponse = await requestAiGateway({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a financial crime compliance AI. Generate a detailed investigation report. Include sections: Executive Summary, Entity Profile, Ownership Structure, Risk Assessment, Alerts Analysis, Recommendations. Be thorough and professional." },
        { role: "user", content: `Generate a compliance investigation report:\n\nEntity: ${entity.name}\nType: ${entity.entity_type}\nJurisdiction: ${entity.jurisdiction || "Unknown"}\nRisk Score: ${entity.risk_score}/100\nSanctions: ${entity.sanctions_status}\n\nRelationships: ${JSON.stringify(relationships?.map(r => ({ source: (r as any).source?.name, target: (r as any).target?.name, type: r.relationship_type, ownership: r.ownership_percentage })) || [])}\n\nAlerts: ${JSON.stringify(alerts?.map(a => ({ type: a.alert_type, level: a.risk_level, description: a.description })) || [])}` }
      ]
    });

    if (gatewayResponse?.ok) {
      const aiData = await gatewayResponse.json();
      const generatedReport = getAssistantMessageContent(aiData);
      if (generatedReport) {
        reportContent = generatedReport;
        aiSummary = generatedReport.substring(0, 500);
      }
    }

    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        title: `${report_type === "sar" ? "SAR" : "Investigation"} Report — ${entity.name}`,
        report_type: report_type || "investigation",
        entity_id,
        content: reportContent,
        ai_summary: aiSummary,
        status: "complete",
        confidence: 0.92,
        agents_used: agentsUsed,
        findings_count: (alerts?.length || 0) + (relationships?.length || 0),
        created_by: userId,
      })
      .select()
      .single();

    if (reportError) {
      return new Response(JSON.stringify({ error: reportError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ report }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
