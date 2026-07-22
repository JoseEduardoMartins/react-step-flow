import { useStoreSelector } from "./useStore";
import type { Step } from "../types";

/** Return shape of {@link useTutorialStep}. */
export interface UseTutorialStepResult {
  /** The active step, or null when idle. */
  step: Step | null;
  /** Index of the active step, or -1 when idle. */
  index: number;
  /** Total number of steps in the active flow. */
  total: number;
  /** Whether the given `targetId` is the active step's target. */
  isActive: boolean;
}

/**
 * Read the active step and, optionally, whether a specific target id is the one
 * currently highlighted. When `targetId` is provided a `<TutorialTarget>` can
 * use this to re-render only when its own active-ness flips.
 */
export function useTutorialStep(targetId?: string): UseTutorialStepResult {
  const step = useStoreSelector((s) => {
    if (s.status !== "running" || !s.activeFlowId) return null;
    const flow = s.flows.get(s.activeFlowId)?.tutorial;
    return flow?.steps[s.stepIndex] ?? null;
  });

  const index = useStoreSelector((s) => s.stepIndex);

  const total = useStoreSelector((s) =>
    s.activeFlowId ? (s.flows.get(s.activeFlowId)?.tutorial.steps.length ?? 0) : 0
  );

  const isActive = useStoreSelector((s) => {
    if (!targetId || s.status !== "running" || !s.activeFlowId) return false;
    const flow = s.flows.get(s.activeFlowId)?.tutorial;
    return flow?.steps[s.stepIndex]?.target === targetId;
  });

  return { step, index, total, isActive };
}
