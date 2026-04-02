import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseToolArguments, requestAiGateway } from "../_shared/ai-gateway.ts";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    const { entity_name, entity_type, jurisdiction } = await req.json();
    if (!entity_name) {
      return new Response(JSON.stringify({ error: "entity_name is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let riskAssessment = {
      risk_score: 50,
      explanation: "AI analysis unavailable",
      sanctions_status: "clear",
      risk_factors: [] as string[],
    };

    const gatewayResponse = await requestAiGateway({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: `You are a financial crime compliance AI analyst. Analyze entities for AML/KYC risk. Return JSON only with fields: risk_score (0-100), explanation (string), sanctions_status ("clear"|"hit"|"proximity"), risk_factors (string array).` },
        { role: "user", content: `Analyze this entity for financial crime risk:\nName: ${entity_name}\nType: ${entity_type || "organization"}\nJurisdiction: ${jurisdiction || "Unknown"}\n\nProvide a realistic risk assessment.` }
      ],
      tools: [{
        type: "function",
        function: {
          name: "risk_assessment",
          description: "Return structured risk assessment for an entity",
          parameters: {
            type: "object",
            properties: {
              risk_score: { type: "number", minimum: 0, maximum: 100 },
              explanation: { type: "string" },
              sanctions_status: { type: "string", enum: ["clear", "hit", "proximity"] },
              risk_factors: { type: "array", items: { type: "string" } },
            },
            required: ["risk_score", "explanation", "sanctions_status", "risk_factors"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "risk_assessment" } },
    });

    if (gatewayResponse?.ok) {
      const aiData = await gatewayResponse.json();
      const parsedAssessment = parseToolArguments<typeof riskAssessment>(aiData);
      if (parsedAssessment) {
        riskAssessment = parsedAssessment;
      }
    }

    const { data: entity, error: entityError } = await supabase
      .from("entities")
      .insert({
        name: entity_name,
        entity_type: entity_type || "organization",
        jurisdiction: jurisdiction || null,
        risk_score: riskAssessment.risk_score,
        sanctions_status: riskAssessment.sanctions_status,
        metadata: { ai_explanation: riskAssessment.explanation, risk_factors: riskAssessment.risk_factors || [] },
        created_by: userId,
      })
      .select()
      .single();

    if (entityError) {
      return new Response(JSON.stringify({ error: entityError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "entity_screened",
      entity_type: "entity",
      entity_id: entity.id,
      details: { entity_name, risk_score: riskAssessment.risk_score }
    });

    return new Response(JSON.stringify({
      entity,
      ai_analysis: riskAssessment
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
