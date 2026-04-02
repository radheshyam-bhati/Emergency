
-- Entities table (core entity registry)
CREATE TABLE public.entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'organization' CHECK (entity_type IN ('person', 'organization', 'trust', 'foundation', 'account')),
  jurisdiction TEXT,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  sanctions_status TEXT DEFAULT 'clear' CHECK (sanctions_status IN ('clear', 'hit', 'proximity')),
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view entities" ON public.entities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert entities" ON public.entities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update entities" ON public.entities FOR UPDATE TO authenticated USING (true);

-- Entity relationships (ownership graph - replaces Neo4j)
CREATE TABLE public.entity_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  target_entity_id UUID NOT NULL REFERENCES public.entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('OWNS', 'CONTROLS', 'BENEFICIARY_OF', 'TRANSACTS_WITH', 'NOMINEE_FOR')),
  ownership_percentage NUMERIC(5,2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.entity_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view relationships" ON public.entity_relationships FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert relationships" ON public.entity_relationships FOR INSERT TO authenticated WITH CHECK (true);

-- Cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'escalated', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  entity_id UUID REFERENCES public.entities(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view cases" ON public.cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cases" ON public.cases FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update cases" ON public.cases FOR UPDATE TO authenticated USING (true);

-- Alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_number TEXT NOT NULL UNIQUE,
  entity_id UUID REFERENCES public.entities(id),
  entity_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('UBO_CHANGE', 'SANCTIONS_PROXIMITY', 'STRUCTURING', 'NOMINEE_CLUSTER', 'CIRCULAR_FLOW', 'PEP_MATCH', 'ANOMALY')),
  risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  ai_explanation TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'investigation' CHECK (report_type IN ('investigation', 'compliance', 'sar', 'ai_analysis')),
  entity_id UUID REFERENCES public.entities(id),
  content TEXT,
  ai_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'filed', 'pending')),
  confidence NUMERIC(3,2),
  agents_used TEXT[] DEFAULT '{}',
  findings_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view reports" ON public.reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Authenticated users can update reports" ON public.reports FOR UPDATE TO authenticated USING (true);

-- Activity log (audit trail)
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view activity" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Enable realtime for alerts (live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- Auto-generate case numbers
CREATE OR REPLACE FUNCTION public.generate_case_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.case_number := 'CASE-' || LPAD(nextval('case_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1000;
CREATE TRIGGER set_case_number BEFORE INSERT ON public.cases FOR EACH ROW WHEN (NEW.case_number IS NULL OR NEW.case_number = '') EXECUTE FUNCTION public.generate_case_number();

-- Auto-generate alert numbers
CREATE OR REPLACE FUNCTION public.generate_alert_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.alert_number := 'ALT-' || LPAD(nextval('alert_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS alert_number_seq START 1000;
CREATE TRIGGER set_alert_number BEFORE INSERT ON public.alerts FOR EACH ROW WHEN (NEW.alert_number IS NULL OR NEW.alert_number = '') EXECUTE FUNCTION public.generate_alert_number();

-- Auto-generate report numbers
CREATE OR REPLACE FUNCTION public.generate_report_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.report_number := 'RPT-' || LPAD(nextval('report_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS report_number_seq START 1000;
CREATE TRIGGER set_report_number BEFORE INSERT ON public.reports FOR EACH ROW WHEN (NEW.report_number IS NULL OR NEW.report_number = '') EXECUTE FUNCTION public.generate_report_number();

-- Updated_at triggers
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Recursive ownership query function
CREATE OR REPLACE FUNCTION public.get_ownership_graph(root_entity_id UUID, max_depth INTEGER DEFAULT 5)
RETURNS TABLE(
  source_id UUID, source_name TEXT, source_type TEXT,
  target_id UUID, target_name TEXT, target_type TEXT,
  relationship_type TEXT, ownership_percentage NUMERIC,
  depth INTEGER
)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH RECURSIVE graph AS (
    SELECT
      er.source_entity_id, es.name AS source_name, es.entity_type AS source_type,
      er.target_entity_id, et.name AS target_name, et.entity_type AS target_type,
      er.relationship_type, er.ownership_percentage,
      1 AS depth
    FROM entity_relationships er
    JOIN entities es ON es.id = er.source_entity_id
    JOIN entities et ON et.id = er.target_entity_id
    WHERE er.source_entity_id = root_entity_id OR er.target_entity_id = root_entity_id
    
    UNION ALL
    
    SELECT
      er.source_entity_id, es.name, es.entity_type,
      er.target_entity_id, et.name, et.entity_type,
      er.relationship_type, er.ownership_percentage,
      g.depth + 1
    FROM entity_relationships er
    JOIN entities es ON es.id = er.source_entity_id
    JOIN entities et ON et.id = er.target_entity_id
    JOIN graph g ON (er.source_entity_id = g.target_entity_id OR er.target_entity_id = g.source_entity_id)
    WHERE g.depth < max_depth
  )
  SELECT DISTINCT * FROM graph;
$$;
