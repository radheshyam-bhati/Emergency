import DashboardLayout from "@/components/DashboardLayout";
import HospitalCard from "@/components/HospitalCard";
import LiveMap from "@/components/LiveMap";
import { useSimulation } from "@/hooks/useSimulation";
import { Building2, Search, Bed, Wind, Users } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const HospitalDashboard = () => {
  const { hospitals } = useSimulation();
  const [search, setSearch] = useState("");

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const totalICU = hospitals.reduce((s, h) => s + h.icuBeds.available, 0);
  const totalEmergency = hospitals.reduce((s, h) => s + h.emergencyBeds.available, 0);
  const totalVentilators = hospitals.reduce((s, h) => s + h.ventilators.available, 0);
  const totalDoctors = hospitals.reduce((s, h) => s + h.doctors.available, 0);

  const mapHospitals = useMemo(() => hospitals.map((h) => ({
    id: h.id, name: h.name, lat: h.lat, lng: h.lng, status: h.status,
  })), [hospitals]);

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-bold sm:text-2xl">Hospital Network</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{hospitals.length} hospitals connected — New Delhi Region</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-4">
        {[
          { label: "ICU Available", value: totalICU, icon: Bed, color: "text-emergency", bg: "bg-emergency/10" },
          { label: "Emergency Beds", value: totalEmergency, icon: Bed, color: "text-warning", bg: "bg-warning/10" },
          { label: "Ventilators", value: totalVentilators, icon: Wind, color: "text-info", bg: "bg-info/10" },
          { label: "Doctors On Duty", value: totalDoctors, icon: Users, color: "text-stable", bg: "bg-stable/10" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-border bg-card p-3 sm:p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
              <div className={`flex h-6 w-6 items-center justify-center rounded-lg sm:h-7 sm:w-7 ${item.bg}`}>
                <item.icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${item.color}`} />
              </div>
            </div>
            <div className={`font-mono text-xl font-bold sm:text-2xl ${item.color}`}>{item.value}</div>
          </motion.div>
        ))}
      </div>

      <LiveMap hospitals={mapHospitals} className="mb-4 h-48 sm:mb-6 sm:h-56" showLegend />

      <div className="relative mb-4 sm:mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search hospitals or specializations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((h) => (
          <HospitalCard key={h.id} hospital={h} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Building2 className="mb-3 h-8 w-8" />
          <p className="text-sm">No hospitals match your search.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default HospitalDashboard;
