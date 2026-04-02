-- Enable realtime for tables not yet added (ambulances, hospital_resources)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_resources;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;