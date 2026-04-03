import type { DispatchFallbackStrategy, QueueReason, RankingSnapshot } from "@/types/domain";

export const getFallbackMessage = (
  fallbackStrategy: DispatchFallbackStrategy,
  queueReason: QueueReason,
  retryCount = 0,
) => {
  if (fallbackStrategy === "manual-escalation") {
    return `Automatic reassignment paused after ${retryCount} retries. Operator escalation is required.`;
  }

  if (queueReason === "NO_AMBULANCE") {
    return "No ALS ambulance available right now. Rechecking every 5 seconds.";
  }

  if (queueReason === "NO_CAPABLE_HOSPITAL") {
    return "No capable hospital is currently clear. Rechecking capacity every 5 seconds.";
  }

  return "Dispatch is progressing on the server-managed lifecycle.";
};

export const getCompactReplaySlots = (decision: RankingSnapshot) => {
  const replayLookup = new Map(decision.replay.map((step) => [step.code, step]));

  return [
    {
      id: "created",
      label: "Emergency Created",
      step: replayLookup.get("emergency_created") ?? replayLookup.get("dispatch_recheck") ?? null,
    },
    {
      id: "ambulances",
      label: "Ambulances Screened",
      step: replayLookup.get("ambulances_screened") ?? null,
    },
    {
      id: "hospitals",
      label: "Hospitals Ranked",
      step: replayLookup.get("hospitals_ranked") ?? null,
    },
    {
      id: "rejections",
      label: "Rejections Recorded",
      step: replayLookup.get("rejections_recorded") ?? null,
    },
    {
      id: "dispatch",
      label: "Dispatch Decision",
      step:
        replayLookup.get("dispatch_selected") ??
        replayLookup.get("waitlist_strategy") ??
        replayLookup.get("manual_escalation") ??
        null,
    },
    {
      id: "lifecycle",
      label: "Lifecycle Progress",
      step:
        replayLookup.get("lifecycle_completed") ??
        replayLookup.get("lifecycle_arrived") ??
        replayLookup.get("lifecycle_to_hospital") ??
        null,
    },
  ];
};
