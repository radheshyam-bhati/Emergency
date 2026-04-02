import DashboardLayout from "@/components/DashboardLayout";
import { mockPatients, Patient } from "@/data/patientData";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, Thermometer, Activity, Droplets, User, Phone, MapPin,
  AlertTriangle, Pill, FileText, Clock, Building2, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const VitalCard = ({ label, value, unit, icon: Icon, alert }: {
  label: string; value: string | number; unit: string; icon: React.ElementType; alert?: boolean;
}) => (
  <div className={`rounded-xl border p-3 sm:p-4 ${alert ? "border-emergency/30 bg-emergency/5" : "border-border bg-card"}`}>
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground sm:text-xs">{label}</span>
      <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${alert ? "text-emergency" : "text-muted-foreground"}`} />
    </div>
    <div className="mt-1 font-mono text-xl font-bold sm:mt-2 sm:text-2xl">{value}</div>
    <span className="text-[10px] text-muted-foreground">{unit}</span>
  </div>
);

const PatientDetail = ({ patient }: { patient: Patient }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-4 sm:space-y-6"
  >
    {/* Header */}
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary sm:h-14 sm:w-14">
          <User className="h-5 w-5 sm:h-7 sm:w-7" />
        </div>
        <div>
          <h2 className="text-lg font-bold sm:text-xl">{patient.name}</h2>
          <p className="text-xs text-muted-foreground sm:text-sm">{patient.age}y · {patient.gender} · {patient.bloodGroup}</p>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{patient.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{patient.address}</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg bg-emergency/10 px-3 py-1.5 text-xs font-semibold text-emergency">
        Emergency: {patient.emergencyContact}
      </div>
    </div>

    {/* Vitals */}
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Activity className="h-4 w-4 text-emergency" /> Current Vitals
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        <VitalCard label="Heart Rate" value={patient.vitals.heartRate} unit="bpm" icon={Heart} alert={patient.vitals.heartRate > 100} />
        <VitalCard label="Blood Pressure" value={patient.vitals.bp} unit="mmHg" icon={Activity} alert={parseInt(patient.vitals.bp) > 140} />
        <VitalCard label="SpO2" value={patient.vitals.spo2} unit="%" icon={Droplets} alert={patient.vitals.spo2 < 93} />
        <VitalCard label="Temperature" value={patient.vitals.temperature} unit="°F" icon={Thermometer} alert={patient.vitals.temperature > 100} />
      </div>
    </div>

    <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Conditions */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4 text-info" /> Medical Conditions
        </h3>
        {patient.conditions.length > 0 ? (
          <div className="space-y-2">
            {patient.conditions.map((c) => (
              <div key={c} className="rounded-lg bg-muted px-3 py-2 text-xs font-medium">{c}</div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No known conditions</p>
        )}
      </div>

      {/* Allergies */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" /> Allergies
        </h3>
        {patient.allergies.length > 0 ? (
          <div className="space-y-2">
            {patient.allergies.map((a) => (
              <div key={a} className="rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning">{a}</div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No known allergies</p>
        )}
      </div>

      {/* Medications */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Pill className="h-4 w-4 text-stable" /> Current Medications
        </h3>
        {patient.medications.length > 0 ? (
          <div className="space-y-2">
            {patient.medications.map((m) => (
              <div key={m} className="rounded-lg bg-stable/10 px-3 py-2 text-xs font-medium">{m}</div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No medications</p>
        )}
      </div>
    </div>

    {/* Visit History */}
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <Clock className="h-4 w-4 text-info" /> Visit History
      </h3>
      <div className="space-y-3">
        {patient.recentVisits.map((v, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="flex items-center gap-3">
              <Building2 className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
              <div>
                <p className="text-sm font-medium">{v.reason}</p>
                <p className="text-xs text-muted-foreground">{v.hospital} — {v.doctor}</p>
              </div>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{v.date}</span>
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

const PatientProfile = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient>(mockPatients[0]);

  const filtered = mockPatients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Patient Health Records</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{mockPatients.length} active patient records</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[280px_1fr]">
        {/* Patient List */}
        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:space-y-2 lg:overflow-x-visible lg:pb-0">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className={`shrink-0 rounded-xl border p-3 text-left transition-colors lg:w-full ${
                  selected.id === p.id
                    ? "border-emergency/30 bg-emergency/5"
                    : "border-border bg-card hover:border-emergency/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-secondary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold whitespace-nowrap">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground whitespace-nowrap">{p.age}y · {p.bloodGroup} · {p.gender}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Detail */}
        <PatientDetail patient={selected} />
      </div>
    </DashboardLayout>
  );
};

export default PatientProfile;
