import { AlertTriangle, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFallbackMessage } from "@/lib/dispatch";
import type { DispatchFallbackStrategy, QueueReason } from "@/types/domain";

interface FallbackStrategyBannerProps {
  fallbackStrategy: DispatchFallbackStrategy;
  queueReason: QueueReason;
  retryCount?: number;
  className?: string;
}

const FallbackStrategyBanner = ({
  fallbackStrategy,
  queueReason,
  retryCount = 0,
  className,
}: FallbackStrategyBannerProps) => {
  const isEscalated = fallbackStrategy === "manual-escalation";
  const Icon = isEscalated ? ShieldAlert : AlertTriangle;

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        isEscalated
          ? "border-emergency/30 bg-emergency/10 text-emergency"
          : "border-warning/30 bg-warning/10 text-warning",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider">
            {isEscalated ? "Manual Escalation Required" : "Fallback Strategy Active"}
          </p>
          <p className="text-sm leading-relaxed">{getFallbackMessage(fallbackStrategy, queueReason, retryCount)}</p>
        </div>
      </div>
    </div>
  );
};

export default FallbackStrategyBanner;
