
-- Enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'hospital', 'ambulance', 'doctor');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role app_role NOT NULL DEFAULT 'admin',
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  ambulance_id UUID REFERENCES public.ambulances(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_profiles_hospital ON public.profiles (hospital_id) WHERE hospital_id IS NOT NULL;

-- User roles table (for RBAC checks)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user ON public.user_roles (user_id);

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'admin')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'admin')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Now update existing table RLS to require auth for writes
-- Drop permissive write policies
DROP POLICY IF EXISTS "Public insert emergency_requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Public update emergency_requests" ON public.emergency_requests;
DROP POLICY IF EXISTS "Public insert routes" ON public.routes;
DROP POLICY IF EXISTS "Public update hospital_resources" ON public.hospital_resources;
DROP POLICY IF EXISTS "Public update ambulances" ON public.ambulances;

-- Auth-required write policies
CREATE POLICY "Auth insert emergency_requests" ON public.emergency_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update emergency_requests" ON public.emergency_requests
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth insert routes" ON public.routes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update hospital_resources" ON public.hospital_resources
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'hospital'));

CREATE POLICY "Auth update ambulances" ON public.ambulances
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ambulance'));

-- Realtime for profiles
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
