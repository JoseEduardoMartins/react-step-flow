import { useMemo } from "react";
import { useStoreSelector, useTutorialStore } from "./useStore";
import type {
  Progress,
  StartOptions,
  Step,
  Tutorial,
  TutorialStatus,
} from "../types";

/** Return shape of {@link useTutorial}. */
export interface UseTutorialResult {
  /** Start a registered flow. */
  start: (flowId: string, options?: StartOptions) => void;
  /** Advance to the next step (or finish on the last step). */
  next: () => void;
  /** Go back to the previous step. */
  previous: () => void;
  /** Finish the active flow (marks it completed). */
  finish: () => void;
  /** Cancel the active flow (does not persist completion). */
  cancel: () => void;
  /** Jump to a step by index or id. */
  goTo: (ref: number | string) => void;
  /** Clear persistence and restart a flow from the beginning. */
  restart: (flowId: string, options?: StartOptions) => void;
  /** The active step, or null when idle. */
  currentStep: Step | null;
  /** Whether a flow is currently running. */
  isRunning: boolean;
  /** Progress of the active flow, or null when idle. */
  progress: Progress | null;
  /** The active flow, or null when idle. */
  flow: Tutorial | null;
  /** Raw engine status. */
  status: TutorialStatus;
  /** Index of the active step, or -1 when idle. */
  stepIndex: number;
}

/**
 * Primary React hook. Exposes stable action references plus a minimal set of
 * reactive state slices. Actions come straight off the store instance so they
 * never change identity; only the selected state slices trigger re-renders.
 */
export function useTutorial(): UseTutorialResult {
  const store = useTutorialStore();

  const status = useStoreSelector((s) => s.status);
  const stepIndex = useStoreSelector((s) => s.stepIndex);
  const flow = useStoreSelector((s) =>
    s.activeFlowId ? (s.flows.get(s.activeFlowId)?.tutorial ?? null) : null
  );

  const isRunning = status === "running";
  const currentStep =
    flow && stepIndex >= 0 ? (flow.steps[stepIndex] ?? null) : null;

  const progress = useMemo<Progress | null>(() => {
    if (!flow) return null;
    const total = flow.steps.length;
    const current = stepIndex + 1;
    return { current, total, ratio: total > 0 ? current / total : 0 };
  }, [flow, stepIndex]);

  return useMemo<UseTutorialResult>(
    () => ({
      start: store.start,
      next: store.next,
      previous: store.previous,
      finish: store.finish,
      cancel: store.cancel,
      goTo: store.goTo,
      restart: store.restart,
      currentStep,
      isRunning,
      progress,
      flow,
      status,
      stepIndex,
    }),
    [store, currentStep, isRunning, progress, flow, status, stepIndex]
  );
}
