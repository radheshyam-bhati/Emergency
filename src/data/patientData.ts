export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  bloodGroup: string;
  phone: string;
  address: string;
  emergencyContact: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  recentVisits: {
    date: string;
    hospital: string;
    reason: string;
    doctor: string;
  }[];
  vitals: {
    heartRate: number;
    bp: string;
    spo2: number;
    temperature: number;
  };
}

export const mockPatients: Patient[] = [
  {
    id: "p1",
    name: "Rajesh Kumar",
    age: 54,
    gender: "Male",
    bloodGroup: "B+",
    phone: "+91 98765 43210",
    address: "C-12, Connaught Place, New Delhi",
    emergencyContact: "+91 98765 43211",
    conditions: ["Hypertension", "Type 2 Diabetes", "Coronary Artery Disease"],
    allergies: ["Penicillin", "Sulfa Drugs"],
    medications: ["Metformin 500mg", "Amlodipine 5mg", "Aspirin 75mg"],
    recentVisits: [
      { date: "2026-03-06", hospital: "AIIMS New Delhi", reason: "Cardiac Arrest — Emergency", doctor: "Dr. Arora" },
      { date: "2026-02-15", hospital: "Max Super Specialty", reason: "Routine Cardiology Checkup", doctor: "Dr. Mehta" },
      { date: "2025-12-10", hospital: "AIIMS New Delhi", reason: "Chest Pain — ER Visit", doctor: "Dr. Sharma" },
    ],
    vitals: { heartRate: 92, bp: "145/92", spo2: 96, temperature: 98.6 },
  },
  {
    id: "p2",
    name: "Priya Sharma",
    age: 29,
    gender: "Female",
    bloodGroup: "O+",
    phone: "+91 87654 32109",
    address: "B-8, Karol Bagh, New Delhi",
    emergencyContact: "+91 87654 32100",
    conditions: ["Asthma"],
    allergies: ["Ibuprofen"],
    medications: ["Salbutamol Inhaler"],
    recentVisits: [
      { date: "2026-03-07", hospital: "Sir Ganga Ram Hospital", reason: "Road Accident — Multiple Fractures", doctor: "Dr. Verma" },
    ],
    vitals: { heartRate: 110, bp: "100/70", spo2: 94, temperature: 99.2 },
  },
  {
    id: "p3",
    name: "Amit Verma",
    age: 37,
    gender: "Male",
    bloodGroup: "A+",
    phone: "+91 76543 21098",
    address: "D-15, Lajpat Nagar, New Delhi",
    emergencyContact: "+91 76543 21099",
    conditions: [],
    allergies: [],
    medications: [],
    recentVisits: [
      { date: "2026-03-07", hospital: "Safdarjung Hospital", reason: "Severe Burns — Emergency", doctor: "Dr. Singh" },
    ],
    vitals: { heartRate: 125, bp: "90/60", spo2: 91, temperature: 101.4 },
  },
  {
    id: "p4",
    name: "Sunita Devi",
    age: 62,
    gender: "Female",
    bloodGroup: "AB-",
    phone: "+91 65432 10987",
    address: "H-22, Dwarka, New Delhi",
    emergencyContact: "+91 65432 10988",
    conditions: ["COPD", "Hypertension"],
    allergies: ["Aspirin"],
    medications: ["Tiotropium Inhaler", "Losartan 50mg"],
    recentVisits: [
      { date: "2026-03-07", hospital: "Pending Assignment", reason: "Respiratory Distress — Emergency", doctor: "Pending" },
      { date: "2026-01-20", hospital: "Apollo Hospital", reason: "COPD Exacerbation", doctor: "Dr. Nair" },
    ],
    vitals: { heartRate: 105, bp: "160/100", spo2: 88, temperature: 99.8 },
  },
  {
    id: "p5",
    name: "Vikram Singh",
    age: 45,
    gender: "Male",
    bloodGroup: "O-",
    phone: "+91 54321 09876",
    address: "F-9, Nehru Place, New Delhi",
    emergencyContact: "+91 54321 09877",
    conditions: ["Atrial Fibrillation"],
    allergies: [],
    medications: ["Warfarin 5mg", "Metoprolol 50mg"],
    recentVisits: [
      { date: "2026-03-07", hospital: "Max Super Specialty", reason: "Stroke — Emergency", doctor: "Dr. Kapoor" },
      { date: "2026-02-01", hospital: "Fortis Escorts", reason: "AF Follow-up", doctor: "Dr. Joshi" },
    ],
    vitals: { heartRate: 78, bp: "130/85", spo2: 97, temperature: 98.4 },
  },
];
