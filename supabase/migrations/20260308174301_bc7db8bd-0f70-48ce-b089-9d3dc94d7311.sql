
-- Enums
CREATE TYPE ambulance_status AS ENUM ('available', 'on_route', 'busy');
CREATE TYPE doctor_availability AS ENUM ('available', 'on_duty', 'off_duty', 'on_leave');
CREATE TYPE emergency_status AS ENUM ('new', 'dispatched', 'in_transit', 'arrived', 'resolved', 'cancelled');
CREATE TYPE traffic_level AS ENUM ('low', 'moderate', 'heavy', 'blocked');

-- 1. hospitals
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'New Delhi',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  contact_number TEXT,
  specialization TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'operational',
  rating NUMERIC(2,1) DEFAULT 4.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hospitals_city ON public.hospitals (city);
CREATE INDEX idx_hospitals_location ON public.hospitals (latitude, longitude);
CREATE INDEX idx_hospitals_status ON public.hospitals (status);

-- 2. hospital_resources
CREATE TABLE public.hospital_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  icu_beds_total INTEGER NOT NULL DEFAULT 0,
  icu_beds_available INTEGER NOT NULL DEFAULT 0,
  emergency_beds_total INTEGER NOT NULL DEFAULT 0,
  emergency_beds_available INTEGER NOT NULL DEFAULT 0,
  general_beds_total INTEGER NOT NULL DEFAULT 0,
  general_beds_available INTEGER NOT NULL DEFAULT 0,
  ventilators_total INTEGER NOT NULL DEFAULT 0,
  ventilators_available INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hospital_id)
);
CREATE INDEX idx_hospital_resources_hospital ON public.hospital_resources (hospital_id);
CREATE INDEX idx_hospital_resources_icu ON public.hospital_resources (icu_beds_available) WHERE icu_beds_available > 0;
CREATE INDEX idx_hospital_resources_emergency ON public.hospital_resources (emergency_beds_available) WHERE emergency_beds_available > 0;
CREATE INDEX idx_hospital_resources_ventilators ON public.hospital_resources (ventilators_available) WHERE ventilators_available > 0;

-- 3. doctors
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  availability_status doctor_availability NOT NULL DEFAULT 'off_duty',
  shift_start TIME,
  shift_end TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_doctors_hospital ON public.doctors (hospital_id);
CREATE INDEX idx_doctors_specialization ON public.doctors (specialization);
CREATE INDEX idx_doctors_availability ON public.doctors (availability_status) WHERE availability_status = 'available';

-- 4. ambulances
CREATE TABLE public.ambulances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL UNIQUE,
  ambulance_type TEXT NOT NULL DEFAULT 'BLS',
  current_latitude DOUBLE PRECISION NOT NULL,
  current_longitude DOUBLE PRECISION NOT NULL,
  status ambulance_status NOT NULL DEFAULT 'available',
  crew TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ambulances_status ON public.ambulances (status) WHERE status = 'available';
CREATE INDEX idx_ambulances_location ON public.ambulances (current_latitude, current_longitude);

-- 5. patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  blood_group TEXT,
  allergies TEXT[] DEFAULT '{}',
  diseases TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  previous_surgeries TEXT[] DEFAULT '{}',
  emergency_contact TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_patients_name ON public.patients (name);
CREATE INDEX idx_patients_blood_group ON public.patients (blood_group);

-- 6. emergency_requests
CREATE TABLE public.emergency_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  condition_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  pickup_latitude DOUBLE PRECISION NOT NULL,
  pickup_longitude DOUBLE PRECISION NOT NULL,
  pickup_address TEXT,
  status emergency_status NOT NULL DEFAULT 'new',
  assigned_ambulance_id UUID REFERENCES public.ambulances(id) ON DELETE SET NULL,
  assigned_hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  eta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX idx_emergency_status ON public.emergency_requests (status) WHERE status NOT IN ('resolved', 'cancelled');
CREATE INDEX idx_emergency_patient ON public.emergency_requests (patient_id);
CREATE INDEX idx_emergency_created ON public.emergency_requests (created_at DESC);
CREATE INDEX idx_emergency_location ON public.emergency_requests (pickup_latitude, pickup_longitude);

-- 7. routes
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_id UUID NOT NULL REFERENCES public.emergency_requests(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  estimated_time INTEGER NOT NULL,
  distance_km NUMERIC(6,2) NOT NULL,
  traffic_level traffic_level NOT NULL DEFAULT 'moderate',
  ai_score NUMERIC(5,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_routes_emergency ON public.routes (emergency_id);
CREATE INDEX idx_routes_score ON public.routes (ai_score DESC);

-- Optimized function: find best hospital within radius
CREATE OR REPLACE FUNCTION public.find_hospitals_in_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 15.0
)
RETURNS TABLE (
  hospital_id UUID,
  hospital_name TEXT,
  distance_km DOUBLE PRECISION,
  icu_available INTEGER,
  er_available INTEGER,
  ventilators_available INTEGER,
  hospital_status TEXT,
  specialization TEXT[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    h.id,
    h.name,
    (6371 * acos(
      cos(radians(p_lat)) * cos(radians(h.latitude)) *
      cos(radians(h.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(h.latitude))
    )) AS distance_km,
    hr.icu_beds_available,
    hr.emergency_beds_available,
    hr.ventilators_available,
    h.status,
    h.specialization
  FROM hospitals h
  JOIN hospital_resources hr ON hr.hospital_id = h.id
  WHERE h.status != 'offline'
    AND (6371 * acos(
      cos(radians(p_lat)) * cos(radians(h.latitude)) *
      cos(radians(h.longitude) - radians(p_lng)) +
      sin(radians(p_lat)) * sin(radians(h.latitude))
    )) <= p_radius_km
  ORDER BY distance_km ASC;
$$;

-- RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambulances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read hospitals" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Public read hospital_resources" ON public.hospital_resources FOR SELECT USING (true);
CREATE POLICY "Public read doctors" ON public.doctors FOR SELECT USING (true);
CREATE POLICY "Public read ambulances" ON public.ambulances FOR SELECT USING (true);
CREATE POLICY "Public read patients" ON public.patients FOR SELECT USING (true);
CREATE POLICY "Public read emergency_requests" ON public.emergency_requests FOR SELECT USING (true);
CREATE POLICY "Public read routes" ON public.routes FOR SELECT USING (true);

CREATE POLICY "Public insert emergency_requests" ON public.emergency_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update emergency_requests" ON public.emergency_requests FOR UPDATE USING (true);
CREATE POLICY "Public insert routes" ON public.routes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update hospital_resources" ON public.hospital_resources FOR UPDATE USING (true);
CREATE POLICY "Public update ambulances" ON public.ambulances FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospitals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hospital_resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_requests;
