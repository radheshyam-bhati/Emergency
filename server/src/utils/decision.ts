import type {
  QueueReason,
  RankingSnapshot,
  ReplayStep,
  ReplayStepStatus,
} from "./mappers.js";

export const createReplayStep = (
  code: string,
  title: string,
  detail: string,
  status: ReplayStepStatus,
  timestamp: string,
): ReplayStep => ({
  code,
  title,
  detail,
  status,
  timestamp,
});

export const appendReplayStep = (
  snapshot: RankingSnapshot,
  step: ReplayStep,
) => ({
  ...snapshot,
  replay: [...snapshot.replay, step],
});

export const getQueueReasonMessage = (queueReason: QueueReason) => {
  if (queueReason === "NO_AMBULANCE") {
    return "No ambulance is currently eligible. The case is queued for automatic reassignment.";
  }

  if (queueReason === "NO_CAPABLE_HOSPITAL") {
    return "No hospital currently meets the capability threshold. The case is queued for automatic reassignment.";
  }

  return "Dispatch is progressing normally.";
};

export const toLegacyDispatchSteps = (replay: ReplayStep[]) =>
  replay.map((step) => ({
    step: step.code,
    status: step.status,
    detail: step.detail,
  }));
