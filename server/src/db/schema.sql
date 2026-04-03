CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'dispatcher')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hospitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'high-load', 'critical', 'offline')),
  rating REAL NOT NULL,
  icu_total INTEGER NOT NULL,
  icu_available INTEGER NOT NULL,
  er_total INTEGER NOT NULL,
  er_available INTEGER NOT NULL,
  general_total INTEGER NOT NULL,
  general_available INTEGER NOT NULL,
  ventilator_total INTEGER NOT NULL,
  ventilator_available INTEGER NOT NULL,
  doctors_total INTEGER NOT NULL,
  doctors_available INTEGER NOT NULL,
  specializations_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ambulances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'queued', 'assigned', 'en-route', 'at-hospital')),
  crew_name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  current_hospital_id INTEGER,
  current_emergency_id INTEGER,
  last_seen_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (current_hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (current_emergency_id) REFERENCES emergencies(id)
);

CREATE TABLE IF NOT EXISTS emergencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_name TEXT NOT NULL,
  patient_phone TEXT,
  condition TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'serious', 'moderate', 'minor')),
  pickup_address TEXT NOT NULL,
  pickup_latitude REAL NOT NULL,
  pickup_longitude REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'queued', 'assigned', 'in-transit', 'arrived', 'completed', 'cancelled')),
  queue_reason TEXT,
  created_by_user_id INTEGER NOT NULL,
  assigned_hospital_id INTEGER,
  assigned_ambulance_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id),
  FOREIGN KEY (assigned_ambulance_id) REFERENCES ambulances(id)
);

CREATE TABLE IF NOT EXISTS dispatches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  emergency_id INTEGER NOT NULL UNIQUE,
  ambulance_id INTEGER,
  hospital_id INTEGER,
  score REAL,
  distance_km REAL,
  eta_minutes INTEGER,
  pickup_eta_minutes INTEGER,
  transport_eta_minutes INTEGER,
  ranking_snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'assigned', 'in-transit', 'arrived', 'completed', 'cancelled')),
  queue_reason TEXT,
  pickup_route_json TEXT,
  hospital_route_json TEXT,
  route_phase TEXT NOT NULL DEFAULT 'idle',
  route_progress REAL NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_retry_at TEXT,
  escalated_at TEXT,
  dispatched_at TEXT,
  en_route_at TEXT,
  arrived_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (emergency_id) REFERENCES emergencies(id),
  FOREIGN KEY (ambulance_id) REFERENCES ambulances(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emergencies_status ON emergencies(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_status ON dispatches(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
