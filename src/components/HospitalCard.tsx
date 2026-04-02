import { Hospital } from "@/data/mockData";
import { Building2, Users, Wind, Bed } from "lucide-react";

const statusColors: Record<string, string> = {
  operational: "bg-stable",
  "high-load": "bg-warning",
  critical: "bg-emergency",
  offline: "bg-muted-foreground",
};

const statusLabels: Record<string, string> = {
  operational: "Operational",
  "high-load": "High Load",
  critical: "Critical",
  offline: "Offline",
};

const ResourceBar = ({ label, available, total, icon: Icon }: { label: string; available: number; total: number; icon: React.ElementType }) => {
  const pct = (available / total) * 100;
  const barColor = pct < 15 ? "bg-emergency" : pct < 40 ? "bg-warning" : "bg-stable";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className="font-mono font-medium">
          {available}/{total}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const HospitalCard = ({ hospital }: { hospital: Hospital }) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-emergency/20">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary/20 text-secondary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{hospital.name}</h3>
            <p className="text-xs text-muted-foreground">{hospital.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${statusColors[hospital.status]}`} />
          <span className="text-xs text-muted-foreground">{statusLabels[hospital.status]}</span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <ResourceBar label="ICU Beds" available={hospital.icuBeds.available} total={hospital.icuBeds.total} icon={Bed} />
        <ResourceBar label="Emergency" available={hospital.emergencyBeds.available} total={hospital.emergencyBeds.total} icon={Bed} />
        <ResourceBar label="Ventilators" available={hospital.ventilators.available} total={hospital.ventilators.total} icon={Wind} />
        <ResourceBar label="Doctors" available={hospital.doctors.available} total={hospital.doctors.total} icon={Users} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        {hospital.specializations.slice(0, 3).map((s) => (
          <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};

export default HospitalCard;
