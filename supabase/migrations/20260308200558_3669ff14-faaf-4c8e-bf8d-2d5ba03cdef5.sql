
-- Add BODS-compliant temporal fields and verification status to entities
ALTER TABLE public.entities 
  ADD COLUMN IF NOT EXISTS bods_statement_id text,
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_result jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS source_documents text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS pep_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS country_risk_score integer DEFAULT 0;

-- Add temporal ownership tracking to entity_relationships
ALTER TABLE public.entity_relationships
  ADD COLUMN IF NOT EXISTS valid_from timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_to timestamp with time zone,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS confidence_score numeric DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified';

-- Verification audit trail table
CREATE TABLE IF NOT EXISTS public.verification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE,
  verification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  constraints_checked jsonb DEFAULT '[]'::jsonb,
  constraints_satisfied jsonb DEFAULT '[]'::jsonb,
  constraints_violated jsonb DEFAULT '[]'::jsonb,
  reasoning_trace text,
  agent_outputs jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view verification logs"
  ON public.verification_log FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert verification logs"
  ON public.verification_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- UBO detection results table
CREATE TABLE IF NOT EXISTS public.ubo_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  root_entity_id uuid REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  beneficial_owner_id uuid REFERENCES public.entities(id),
  ownership_chain jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_ownership_pct numeric NOT NULL DEFAULT 0,
  is_ubo boolean NOT NULL DEFAULT false,
  control_type text DEFAULT 'ownership',
  detection_method text DEFAULT 'graph_traversal',
  verified boolean NOT NULL DEFAULT false,
  verification_details jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ubo_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view UBO results"
  ON public.ubo_results FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert UBO results"
  ON public.ubo_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Enable realtime on verification_log
ALTER PUBLICATION supabase_realtime ADD TABLE public.verification_log;
