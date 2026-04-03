import { Brain, CheckCircle2, Clock3, Route, ShieldAlert } from "lucide-react";
import { formatRelativeTime } from "@/lib/time";
import { getCompactReplaySlots } from "@/lib/dispatch";
import { cn } from "@/lib/utils";
import type { RankingSnapshot } from "@/types/domain";

interface DecisionReplayPanelProps {
  decision: RankingSnapshot;
  compact?: boolean;
  title?: string;
  className?: string;
}

const statusTone: Record<string, string> = {
  success: "border-stable/30 bg-stable/10 text-stable",
  warning: "border-warning/30 bg-warning/10 text-warning",
  pending: "border-info/30 bg-info/10 text-info",
};

const DecisionReplayPanel = ({
  decision,
  compact = false,
  title = "System Flow / Decision Replay",
  className,
}: DecisionReplayPanelProps) => {
  if (compact) {
    const slots = getCompactReplaySlots(decision);

    return (
      <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
        <div className="mb-4 flex items-center gap-2">
          <Route className="h-4 w-4 text-info" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <div key={slot.id} className="rounded-lg border border-border bg-background px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{slot.label}</p>
              <p className="mt-2 text-sm font-medium">{slot.step?.title ?? "Awaiting event"}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {slot.step?.detail ?? "This step will update automatically as the dispatch changes."}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5", className)}>
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-info" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>

      {decision.factors && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Score", value: decision.score ?? 0 },
            { label: "Pickup ETA", value: `${decision.factors.pickupEtaMinutes}m` },
            { label: "Transport ETA", value: `${decision.factors.transportEtaMinutes}m` },
            { label: "Severity Boost", value: decision.factors.severityBoost },
            { label: "Penalty Load", value: decision.factors.penalties },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-background px-3 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-2 font-mono text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <div className="mb-2 flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-info" />
              <h4 className="text-sm font-semibold">Replay Timeline</h4>
            </div>
            <div className="space-y-2">
              {decision.replay.map((step) => (
                <div key={`${step.code}-${step.timestamp}`} className="rounded-lg border border-border px-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        statusTone[step.status] ?? statusTone.pending,
                      )}
                    >
                      {step.status}
                    </span>
                    <p className="text-sm font-medium">{step.title}</p>
                    <span className="text-[10px] text-muted-foreground">{formatRelativeTime(step.timestamp)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <div className="mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-stable" />
              <h4 className="text-sm font-semibold">Selected Decision Factors</h4>
            </div>
            {decision.factors ? (
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Distance score: <span className="font-mono text-foreground">{decision.factors.distanceScore}</span></p>
                <p>ICU score: <span className="font-mono text-foreground">{decision.factors.icuScore}</span></p>
                <p>ER score: <span className="font-mono text-foreground">{decision.factors.erScore}</span></p>
                <p>Doctor score: <span className="font-mono text-foreground">{decision.factors.doctorScore}</span></p>
                <p>Specialization score: <span className="font-mono text-foreground">{decision.factors.specializationScore}</span></p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No hospital cleared the threshold during this evaluation.</p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background px-4 py-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-warning" />
              <h4 className="text-sm font-semibold">Rejected Options</h4>
            </div>
            <div className="space-y-2">
              {decision.rejectedOptions.length > 0 ? (
                decision.rejectedOptions.map((option) => (
                  <div key={`${option.kind}-${option.id}`} className="rounded-lg border border-border px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium">
                        {option.kind === "ambulance" ? "Ambulance" : "Hospital"}: {option.name}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{option.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No rejections were recorded for this decision.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecisionReplayPanel;
