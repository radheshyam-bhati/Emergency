import { AlertTriangle, Ambulance, Building2, CheckCircle, Bed } from "lucide-react";
import { motion } from "framer-motion";

const eventConfig: Record<string, { icon: React.ElementType; color: string }> = {
  emergency: { icon: AlertTriangle, color: "text-emergency" },
  dispatch: { icon: Ambulance, color: "text-info" },
  arrival: { icon: Building2, color: "text-stable" },
  "bed-reserved": { icon: Bed, color: "text-warning" },
  completed: { icon: CheckCircle, color: "text-stable" },
  resolved: { icon: CheckCircle, color: "text-stable" },
  status: { icon: Ambulance, color: "text-info" },
  queued: { icon: AlertTriangle, color: "text-warning" },
};

const ActivityFeed = ({
  events,
}: {
  events: Array<{ id: number | string; type: string; message: string; timestamp: string }>;
}) => {
  return (
    <div className="space-y-1">
      {events.map((event, i) => {
        const config = eventConfig[event.type] ?? eventConfig.dispatch;
        const Icon = config.icon;
        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.2 }}
            className="flex items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/50"
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color}`} />
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-relaxed">{event.message}</p>
              <span className="text-[10px] text-muted-foreground">{event.timestamp}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
