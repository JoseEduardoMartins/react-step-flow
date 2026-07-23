import { useMemo } from "react";
import { useTutorialStore } from "./useStore";
import type { RegisterOptions, StartOptions, Step, Tutorial } from "../types";

/** Return shape of {@link useTutorialActions}. */
export interface UseTutorialActionsResult {
  register: <M = unknown>(flow: Tutorial<M>, options?: RegisterOptions<M>) => void;
  unregister: (flowId: string) => void;
  start: (flowId: string, options?: StartOptions) => void;
  next: () => void;
  previous: () => void;
  finish: () => void;
  cancel: () => void;
  goTo: (ref: number | string) => void;
  restart: (flowId: string, options?: StartOptions) => void;
  addStep: (flowId: string, step: Step, index?: number) => void;
  removeStep: (flowId: string, ref: number | string) => void;
  updateStep: (flowId: string, ref: number | string, patch: Partial<Step>) => void;
  setSteps: (flowId: string, steps: Step[]) => void;
  resetPersistence: (flowId: string) => void;
  hasCompleted: (flowId: string) => boolean;
}

/**
 * Action-only hook that subscribes to NO state. Ideal for "Start tour" buttons
 * and other controls that trigger the tutorial but must never re-render as it
 * progresses. All returned functions have stable identity.
 */
export function useTutorialActions(): UseTutorialActionsResult {
  const store = useTutorialStore();
  return useMemo<UseTutorialActionsResult>(
    () => ({
      register: store.register,
      unregister: store.unregister,
      start: store.start,
      next: store.next,
      previous: store.previous,
      finish: store.finish,
      cancel: store.cancel,
      goTo: store.goTo,
      restart: store.restart,
      addStep: store.addStep,
      removeStep: store.removeStep,
      updateStep: store.updateStep,
      setSteps: store.setSteps,
      resetPersistence: store.resetPersistence,
      hasCompleted: store.hasCompleted,
    }),
    [store]
  );
}
