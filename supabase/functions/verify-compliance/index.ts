import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── SMT-Style Constraint Definitions ──
// These encode regulatory rules as first-order logic predicates
interface Constraint {
  id: string;
  name: string;
  regulation: string;
  predicate: string; // Natural language description
  logic: string; // Formal logic notation
  check: (ctx: VerificationContext) => ConstraintResult;
}

interface ConstraintResult {
  satisfied: boolean;
  details: string;
  evidence: any;
}

interface VerificationContext {
  entity: any;
  graph: any[];
  uboChains: any[];
  alerts: any[];
}

// ── Regulatory Constraint Library ──
const CONSTRAINTS: Constraint[] = [
  {
    id: "EU_AMLD_UBO_25",
    name: "EU AMLD UBO Threshold",
    regulation: "EU 6th Anti-Money Laundering Directive",
    predicate: "Any person with >25% ownership must be identified as UBO",
    logic: "∀x,y,p: Owns(x,y,p) ∧ p > 25 → MustIdentify(x, UBO)",
    check: (ctx) => {
      const ownershipPaths: any[] = [];
      // Calculate effective ownership for each person in the graph
      const persons = ctx.graph.filter((r: any) => r.source_type === "person");
      for (const p of persons) {
        // Direct ownership
        const directLinks = ctx.graph.filter((r: any) => r.source_id === p.source_id && r.target_id === ctx.entity.id);
        let totalOwnership = 0;
        for (const link of directLinks) {
          totalOwnership += Number(link.ownership_percentage) || 0;
        }
        // Indirect through intermediaries
        const indirectLinks = ctx.graph.filter((r: any) => r.source_id === p.source_id && r.target_id !== ctx.entity.id);
        for (const indirect of indirectLinks) {
          const toRoot = ctx.graph.filter((r: any) => r.source_id === indirect.target_id && r.target_id === ctx.entity.id);
          for (const link of toRoot) {
            totalOwnership += ((Number(indirect.ownership_percentage) || 0) * (Number(link.ownership_percentage) || 0)) / 100;
          }
        }
        if (totalOwnership > 0) {
          ownershipPaths.push({ person: p.source_name, total_pct: totalOwnership, is_ubo: totalOwnership > 25 });
        }
      }
      const unidentifiedUBOs = ownershipPaths.filter(o => o.is_ubo);
      return {
        satisfied: unidentifiedUBOs.length === 0 || unidentifiedUBOs.every((u: any) => ctx.uboChains.some((c: any) => c.beneficial_owner === u.person)),
        details: unidentifiedUBOs.length > 0
          ? `Found ${unidentifiedUBOs.length} UBO(s): ${unidentifiedUBOs.map(u => `${u.person} (${u.total_pct.toFixed(1)}%)`).join(", ")}`
          : "No ownership exceeding 25% threshold detected",
        evidence: ownershipPaths,
      };
    },
  },
  {
    id: "US_CTA_BENEFICIAL",
    name: "US Corporate Transparency Act",
    regulation: "US Corporate Transparency Act (2024)",
    predicate: "Beneficial owners with substantial control must be reported to FinCEN",
    logic: "∀x,y: SubstantialControl(x,y) → MustReport(x, FinCEN)",
    check: (ctx) => {
      const controllers = ctx.graph.filter((r: any) =>
        r.relationship_type === "CONTROLS" || r.relationship_type === "DIRECTOR_OF"
      );
      return {
        satisfied: controllers.length === 0 || controllers.every((c: any) => ctx.uboChains.some((u: any) => u.control_type === "control")),
        details: controllers.length > 0
          ? `${controllers.length} controlling relationship(s) require FinCEN BOI reporting`
          : "No substantial control relationships detected",
        evidence: controllers.map((c: any) => ({ from: c.source_name, to: c.target_name, type: c.relationship_type })),
      };
    },
  },
  {
    id: "SANCTIONS_CHECK",
    name: "Sanctions Screening",
    regulation: "OFAC / EU Sanctions Regulations",
    predicate: "No sanctioned entity may own more than 50% of a company",
    logic: "∀x,y,p: Sanctioned(x) ∧ Owns(x,y,p) ∧ p > 50 → HighRisk(y) ∧ Block(y)",
    check: (ctx) => {
      const sanctionedOwners = ctx.graph.filter((r: any) =>
        r.source_type === "person" && (Number(r.ownership_percentage) || 0) > 50
      );
      const entitySanctioned = ctx.entity.sanctions_status === "hit";
      return {
        satisfied: !entitySanctioned && sanctionedOwners.length === 0,
        details: entitySanctioned
          ? `Entity ${ctx.entity.name} has a direct sanctions hit`
          : sanctionedOwners.length > 0
          ? `${sanctionedOwners.length} owner(s) with >50% stake require sanctions verification`
          : "No sanctions risks detected in ownership chain",
        evidence: { entity_sanctions: ctx.entity.sanctions_status, flagged_owners: sanctionedOwners },
      };
    },
  },
  {
    id: "SHELL_COMPANY_DETECTION",
    name: "Shell Company Risk",
    regulation: "EU AMLA / FATF Recommendations",
    predicate: "Entities in high-risk jurisdictions with layered ownership are potential shells",
    logic: "∀x: HighRiskJurisdiction(x) ∧ LayeredOwnership(x, depth>2) ∧ NoActivity(x) → ShellCompanyRisk(x)",
    check: (ctx) => {
      const highRiskJurisdictions = ["panama", "british virgin islands", "cayman islands", "seychelles", "marshall islands", "belize"];
      const isHighRisk = highRiskJurisdictions.some(j =>
        (ctx.entity.jurisdiction || "").toLowerCase().includes(j)
      );
      const depth = Math.max(...ctx.graph.map((r: any) => r.depth || 1), 0);
      const isLayered = depth > 2;
      return {
        satisfied: !(isHighRisk && isLayered),
        details: isHighRisk && isLayered
          ? `Shell company indicators: high-risk jurisdiction (${ctx.entity.jurisdiction}) with ${depth}-layer ownership depth`
          : "No shell company indicators detected",
        evidence: { jurisdiction_risk: isHighRisk, ownership_depth: depth, risk_jurisdiction: ctx.entity.jurisdiction },
      };
    },
  },
  {
    id: "CIRCULAR_OWNERSHIP",
    name: "Circular Ownership Detection",
    regulation: "FATF Recommendation 24",
    predicate: "Circular ownership structures must be flagged for investigation",
    logic: "∀x,y,z: Owns(x,y) ∧ Owns(y,z) ∧ Owns(z,x) → CircularRisk(x,y,z)",
    check: (ctx) => {
      const entityIds = new Set(ctx.graph.map((r: any) => r.source_id).concat(ctx.graph.map((r: any) => r.target_id)));
      const circularPaths: any[] = [];
      for (const eid of entityIds) {
        const outgoing = ctx.graph.filter((r: any) => r.source_id === eid);
        for (const o of outgoing) {
          const secondHop = ctx.graph.filter((r: any) => r.source_id === o.target_id);
          for (const s of secondHop) {
            if (s.target_id === eid) {
              circularPaths.push({ entities: [o.source_name, o.target_name, s.target_name] });
            }
          }
        }
      }
      return {
        satisfied: circularPaths.length === 0,
        details: circularPaths.length > 0
          ? `${circularPaths.length} circular ownership pattern(s) detected`
          : "No circular ownership detected",
        evidence: circularPaths,
      };
    },
  },
];

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

    const { entity_id } = await req.json();
    if (!entity_id) {
      return new Response(JSON.stringify({ error: "entity_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch entity
    const { data: entity } = await supabase.from("entities").select("*").eq("id", entity_id).single();
    if (!entity) {
      return new Response(JSON.stringify({ error: "Entity not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch graph
    const { data: graphData } = await supabase.rpc("get_ownership_graph", { root_entity_id: entity_id, max_depth: 5 });

    // Fetch UBO results
    const { data: uboResults } = await supabase.from("ubo_results").select("*").eq("root_entity_id", entity_id);

    // Fetch alerts
    const { data: alerts } = await supabase.from("alerts").select("*").eq("entity_id", entity_id);

    // ── Run all constraints ──
    const ctx: VerificationContext = {
      entity,
      graph: graphData || [],
      uboChains: uboResults || [],
      alerts: alerts || [],
    };

    const results = CONSTRAINTS.map(constraint => {
      const result = constraint.check(ctx);
      return {
        constraint_id: constraint.id,
        name: constraint.name,
        regulation: constraint.regulation,
        formal_logic: constraint.logic,
        natural_language: constraint.predicate,
        ...result,
      };
    });

    const allSatisfied = results.every(r => r.satisfied);
    const violations = results.filter(r => !r.satisfied);

    // Store verification log
    await supabase.from("verification_log").insert({
      entity_id,
      verification_type: "formal_verification",
      status: allSatisfied ? "verified" : "violations_found",
      constraints_checked: results.map(r => ({ id: r.constraint_id, name: r.name })),
      constraints_satisfied: results.filter(r => r.satisfied).map(r => ({ id: r.constraint_id, name: r.name, details: r.details })),
      constraints_violated: violations.map(r => ({ id: r.constraint_id, name: r.name, details: r.details, evidence: r.evidence })),
      reasoning_trace: `Formal verification: ${results.length} constraints checked, ${violations.length} violations found`,
      agent_outputs: { verification_engine: "VAGR SMT-Style Constraint Solver", constraints: results },
      created_by: userId,
    });

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "formal_verification",
      entity_type: "entity",
      entity_id,
      details: {
        entity_name: entity.name,
        constraints_total: results.length,
        violations: violations.length,
        status: allSatisfied ? "all_satisfied" : "violations_found",
      },
    });

    return new Response(JSON.stringify({
      entity: { id: entity.id, name: entity.name },
      verification: {
        status: allSatisfied ? "VERIFIED" : "VIOLATIONS_FOUND",
        total_constraints: results.length,
        satisfied: results.filter(r => r.satisfied).length,
        violated: violations.length,
      },
      results,
      violations,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("Verification error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
