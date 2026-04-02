
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.notify_on_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  u record;
BEGIN
  FOR u IN SELECT user_id FROM user_roles LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      u.user_id,
      'New Alert: ' || NEW.alert_type,
      'Risk alert for ' || NEW.entity_name || ' — ' || UPPER(NEW.risk_level) || ' risk',
      CASE WHEN NEW.risk_level = 'critical' THEN 'critical'
           WHEN NEW.risk_level = 'high' THEN 'warning'
           ELSE 'info' END,
      '/alerts'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_alert_created
  AFTER INSERT ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_alert();
