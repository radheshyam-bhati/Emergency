import type { Emergency } from "@/types/domain";
import { AlertTriangle, Clock, Ambulance, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { formatEta, formatRelativeTime } from "@/lib/time";
import { getFallbackMessage } from "@/lib/dispatch";

const severityStyles: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-emergency/10", text: "text-emergency", dot: "bg-emergency" },
  serious: { bg: "bg-critical/10", text: "text-critical", dot: "bg-critical" },
  moderate: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
  minor: { bg: "bg-stable/10", text: "text-stable", dot: "bg-stable" },
};

const statusLabels: Record<string, string> = {
  pending: "Awaiting Dispatch",
  queued: "Queued for Allocation",
  assigned: "Ambulance Assigned",
  "in-transit": "In Transit",
  arrived: "Arrived at Hospital",
  completed: "Completed",
  cancelled: "Cancelled",
};

const EmergencyCard = ({ emergency, index }: { emergency: Emergency; index: number }) => {
  const sev = severityStyles[emergency.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={`rounded-xl border border-border bg-card p-4 ${emergency.severity === "critical" ? "border-emergency/30" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {emergency.severity === "critical" && (
            <AlertTriangle className="h-4 w-4 text-emergency pulse-emergency" />
          )}
          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${sev.bg} ${sev.text}`}>
            {emergency.severity}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {formatRelativeTime(emergency.createdAt)}
        </span>
      </div>

      <div className="mt-3">
        <h4 className="font-semibold">{emergency.patientName}</h4>
        <p className="text-sm text-muted-foreground">{emergency.condition}</p>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          {emergency.pickupAddress}
        </div>
        {emergency.assignedAmbulance && emergency.assignedHospital && (
          <div className="flex items-center gap-1.5">
            <Ambulance className="h-3 w-3" />
            {emergency.assignedAmbulance.vehicleNumber} → {emergency.assignedHospital.name}
          </div>
        )}
        {emergency.queueReason && (
          <div className="rounded-md bg-warning/10 px-2 py-1 text-[10px] font-medium text-warning">
            {getFallbackMessage(
              emergency.dispatch?.fallbackStrategy ?? "waitlist",
              emergency.queueReason,
              emergency.dispatch?.retryCount ?? 0,
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-info">{statusLabels[emergency.status]}</span>
        {emergency.dispatch?.etaMinutes && (
          <span className="rounded-md bg-emergency/10 px-2 py-0.5 text-[10px] font-bold text-emergency">
            ETA {formatEta(emergency.dispatch.etaMinutes)}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default EmergencyCard;
