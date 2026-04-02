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

    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: recentAlerts } = await supabase.from("alerts").select("*").order("created_at", { ascending: false }).limit(10);
    const { data: entities } = await supabase.from("entities").select("*").order("risk_score", { ascending: false }).limit(10);

    let insights = [];

    if ((recentAlerts?.length || 0) > 0 || (entities?.length || 0) > 0) {
      const gatewayResponse = await requestAiGateway({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a financial crime AI analyst. Analyze the data and produce actionable insights." },
          { role: "user", content: `Analyze these alerts and entities, return insights:\n\nAlerts: ${JSON.stringify(recentAlerts || [])}\nHigh-risk entities: ${JSON.stringify(entities?.map(e => ({ name: e.name, risk: e.risk_score, type: e.entity_type })) || [])}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_insights",
              description: "Return structured AI insights",
              parameters: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        severity: { type: "string", enum: ["critical", "high", "medium", "info"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        agent: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["severity", "title", "description", "agent", "confidence"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["insights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_insights" } },
      });

      if (gatewayResponse?.ok) {
        const aiData = await gatewayResponse.json();
        const response = parseToolArguments<{ insights?: unknown[] }>(aiData);
        if (Array.isArray(response?.insights)) {
          insights = response.insights;
        }
      }
    }

    if (insights.length === 0) {
      insights = [
        { severity: "info", title: "System Ready", description: "AI analysis is active. Screen entities to generate insights.", agent: "System", confidence: 100 }
      ];
    }

    return new Response(JSON.stringify({ insights }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
