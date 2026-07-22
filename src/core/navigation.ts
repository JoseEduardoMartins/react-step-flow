import type { Step, Tutorial } from "../types";

/**
 * Pure navigation helpers operating on a flow's step list. Kept free of any
 * store/DOM coupling so they are trivially unit-testable.
 */

/** Clamp an index into the valid range for a flow's steps. */
export function clampIndex(flow: Tutorial, index: number): number {
  if (flow.steps.length === 0) return -1;
  if (index < 0) return 0;
  if (index > flow.steps.length - 1) return flow.steps.length - 1;
  return index;
}

/**
 * Resolve a step reference (numeric index or step `id`) to an index.
 * Returns -1 when the reference cannot be resolved.
 */
export function resolveStepIndex(flow: Tutorial, ref: number | string): number {
  if (typeof ref === "number") {
    return Number.isInteger(ref) && ref >= 0 && ref < flow.steps.length ? ref : -1;
  }
  return flow.steps.findIndex((step) => step.id === ref);
}

/** Whether the given index is the last step of the flow. */
export function isLastStep(flow: Tutorial, index: number): boolean {
  return index >= flow.steps.length - 1;
}

/** Whether the given index is the first step of the flow. */
export function isFirstStep(index: number): boolean {
  return index <= 0;
}

/** Safely read the step at an index. */
export function stepAt(flow: Tutorial, index: number): Step | null {
  return flow.steps[index] ?? null;
}
