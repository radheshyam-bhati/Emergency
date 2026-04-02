// Mock data for the Emergency Hospital Network

export interface Hospital {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  type: string;
  icuBeds: { total: number; available: number };
  emergencyBeds: { total: number; available: number };
  generalBeds: { total: number; available: number };
  ventilators: { total: number; available: number };
  doctors: { total: number; available: number };
  specializations: string[];
  status: "operational" | "high-load" | "critical" | "offline";
  rating: number;
}

export interface Ambulance {
  id: string;
  vehicleNumber: string;
  type: "ALS" | "BLS" | "Patient Transport";
  status: "available" | "dispatched" | "en-route" | "at-hospital";
  lat: number;
  lng: number;
  crew: string;
  currentEmergency?: string;
}

export interface Emergency {
  id: string;
  patientName: string;
  condition: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  location: string;
  timestamp: string;
  assignedAmbulance?: string;
  assignedHospital?: string;
  status: "new" | "dispatched" | "in-transit" | "arrived" | "resolved";
  eta?: string;
}

export interface ActivityEvent {
  id: string;
  type: "emergency" | "dispatch" | "arrival" | "bed-reserved" | "resolved";
  message: string;
  timestamp: string;
}

export const mockHospitals: Hospital[] = [
  {
    id: "h1",
    name: "AIIMS New Delhi",
    location: "Ansari Nagar, New Delhi",
    lat: 28.5672,
    lng: 77.2100,
    type: "Government",
    icuBeds: { total: 120, available: 8 },
    emergencyBeds: { total: 80, available: 12 },
    generalBeds: { total: 600, available: 45 },
    ventilators: { total: 60, available: 5 },
    doctors: { total: 250, available: 42 },
    specializations: ["Cardiology", "Neurology", "Trauma", "Burns"],
    status: "high-load",
    rating: 4.8,
  },
  {
    id: "h2",
    name: "Safdarjung Hospital",
    location: "Ring Road, New Delhi",
    lat: 28.5685,
    lng: 77.2065,
    type: "Government",
    icuBeds: { total: 80, available: 15 },
    emergencyBeds: { total: 60, available: 22 },
    generalBeds: { total: 400, available: 78 },
    ventilators: { total: 40, available: 12 },
    doctors: { total: 180, available: 35 },
    specializations: ["Orthopedics", "General Surgery", "Trauma"],
    status: "operational",
    rating: 4.2,
  },
  {
    id: "h3",
    name: "Max Super Specialty",
    location: "Saket, New Delhi",
    lat: 28.5275,
    lng: 77.2137,
    type: "Private",
    icuBeds: { total: 60, available: 3 },
    emergencyBeds: { total: 40, available: 5 },
    generalBeds: { total: 300, available: 32 },
    ventilators: { total: 35, available: 2 },
    doctors: { total: 150, available: 28 },
    specializations: ["Cardiology", "Oncology", "Neurosurgery"],
    status: "critical",
    rating: 4.6,
  },
  {
    id: "h4",
    name: "Fortis Escorts",
    location: "Okhla Road, New Delhi",
    lat: 28.5503,
    lng: 77.2590,
    type: "Private",
    icuBeds: { total: 50, available: 18 },
    emergencyBeds: { total: 35, available: 20 },
    generalBeds: { total: 250, available: 65 },
    ventilators: { total: 30, available: 15 },
    doctors: { total: 120, available: 30 },
    specializations: ["Cardiology", "Cardiac Surgery", "Vascular Surgery"],
    status: "operational",
    rating: 4.5,
  },
  {
    id: "h5",
    name: "Sir Ganga Ram Hospital",
    location: "Rajinder Nagar, New Delhi",
    lat: 28.6380,
    lng: 77.1880,
    type: "Trust",
    icuBeds: { total: 70, available: 10 },
    emergencyBeds: { total: 45, available: 8 },
    generalBeds: { total: 350, available: 40 },
    ventilators: { total: 32, available: 8 },
    doctors: { total: 160, available: 25 },
    specializations: ["Gastroenterology", "Nephrology", "Pulmonology"],
    status: "high-load",
    rating: 4.4,
  },
  {
    id: "h6",
    name: "Apollo Hospital",
    location: "Mathura Road, New Delhi",
    lat: 28.5440,
    lng: 77.2820,
    type: "Private",
    icuBeds: { total: 55, available: 20 },
    emergencyBeds: { total: 30, available: 18 },
    generalBeds: { total: 280, available: 90 },
    ventilators: { total: 28, available: 14 },
    doctors: { total: 140, available: 38 },
    specializations: ["Orthopedics", "Oncology", "Transplant"],
    status: "operational",
    rating: 4.7,
  },
];

export const mockAmbulances: Ambulance[] = [
  { id: "a1", vehicleNumber: "DL-01-AB-1234", type: "ALS", status: "en-route", lat: 28.5500, lng: 77.2200, crew: "Team Alpha", currentEmergency: "e1" },
  { id: "a2", vehicleNumber: "DL-01-CD-5678", type: "BLS", status: "available", lat: 28.5800, lng: 77.2400, crew: "Team Beta" },
  { id: "a3", vehicleNumber: "DL-01-EF-9012", type: "ALS", status: "dispatched", lat: 28.6000, lng: 77.1900, crew: "Team Gamma", currentEmergency: "e2" },
  { id: "a4", vehicleNumber: "DL-01-GH-3456", type: "Patient Transport", status: "at-hospital", lat: 28.5672, lng: 77.2100, crew: "Team Delta" },
  { id: "a5", vehicleNumber: "DL-01-IJ-7890", type: "ALS", status: "available", lat: 28.5300, lng: 77.2500, crew: "Team Echo" },
  { id: "a6", vehicleNumber: "DL-01-KL-2345", type: "BLS", status: "en-route", lat: 28.5600, lng: 77.2700, crew: "Team Foxtrot", currentEmergency: "e3" },
];

export const mockEmergencies: Emergency[] = [
  { id: "e1", patientName: "Rajesh Kumar", condition: "Cardiac Arrest", severity: "critical", location: "Connaught Place, Delhi", timestamp: "2 min ago", assignedAmbulance: "a1", assignedHospital: "AIIMS New Delhi", status: "in-transit", eta: "6 min" },
  { id: "e2", patientName: "Priya Sharma", condition: "Road Accident — Multiple Fractures", severity: "serious", location: "Karol Bagh, Delhi", timestamp: "8 min ago", assignedAmbulance: "a3", assignedHospital: "Sir Ganga Ram Hospital", status: "dispatched", eta: "12 min" },
  { id: "e3", patientName: "Amit Verma", condition: "Severe Burns", severity: "critical", location: "Lajpat Nagar, Delhi", timestamp: "15 min ago", assignedAmbulance: "a6", assignedHospital: "Safdarjung Hospital", status: "in-transit", eta: "4 min" },
  { id: "e4", patientName: "Sunita Devi", condition: "Respiratory Distress", severity: "serious", location: "Dwarka, Delhi", timestamp: "22 min ago", status: "new" },
  { id: "e5", patientName: "Vikram Singh", condition: "Stroke", severity: "critical", location: "Nehru Place, Delhi", timestamp: "35 min ago", assignedAmbulance: "a4", assignedHospital: "Max Super Specialty", status: "arrived" },
];

export const mockActivity: ActivityEvent[] = [
  { id: "ev1", type: "emergency", message: "New critical emergency: Cardiac Arrest at Connaught Place", timestamp: "2 min ago" },
  { id: "ev2", type: "dispatch", message: "Ambulance DL-01-AB-1234 dispatched to Connaught Place", timestamp: "2 min ago" },
  { id: "ev3", type: "bed-reserved", message: "ICU bed reserved at AIIMS for Rajesh Kumar", timestamp: "1 min ago" },
  { id: "ev4", type: "arrival", message: "Ambulance DL-01-GH-3456 arrived at Max Super Specialty", timestamp: "5 min ago" },
  { id: "ev5", type: "resolved", message: "Emergency resolved: Patient Vikram Singh stabilized", timestamp: "10 min ago" },
  { id: "ev6", type: "emergency", message: "New serious emergency: Road Accident at Karol Bagh", timestamp: "8 min ago" },
  { id: "ev7", type: "dispatch", message: "Ambulance DL-01-EF-9012 dispatched to Karol Bagh", timestamp: "7 min ago" },
  { id: "ev8", type: "bed-reserved", message: "Emergency bed reserved at Sir Ganga Ram Hospital", timestamp: "7 min ago" },
];
