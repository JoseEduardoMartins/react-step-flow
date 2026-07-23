/**
 * Public type surface for react-step-flow.
 *
 * These types are framework-agnostic and shared between the pure core and the
 * React layer. They are re-exported from the package root and from `/core`.
 */

/** Where the tooltip is placed relative to the target element. */
export type Placement = "top" | "bottom" | "left" | "right" | "center";

/**
 * A single step within a tutorial flow.
 *
 * `M` types the optional {@link Step.metadata} payload. It defaults to
 * `unknown`, so plain `Step` is unchanged; supply it (e.g. `Step<{ route: string }>`)
 * for end-to-end typing of your own per-step data.
 */
export interface Step<M = unknown> {
  /** Optional stable id, usable with {@link goTo}. Falls back to the array index. */
  id?: string;
  /**
   * The id of a registered element to highlight. Use an empty string (or a
   * step with `placement: "center"`) for a centered, target-less step.
   */
  target: string;
  title: string;
  description: string;
  /** Preferred placement of the tooltip. Defaults to `"bottom"`. */
  placement?: Placement;
  /** Label for the "next" action button. */
  nextLabel?: string;
  /** Label for the "previous" action button. */
  previousLabel?: string;
  /** Label for the "finish" action button (shown on the last step). */
  finishLabel?: string;
  /** Whether the step may be skipped/closed (e.g. via ESC or an X button). */
  canSkip?: boolean;
  /** Whether the highlighted element remains interactive. Defaults to `false`. */
  interactable?: boolean;
  /** Arbitrary user data carried on the step. */
  metadata?: M;
}

/** A named tutorial flow: an ordered list of steps. `M` types each step's metadata. */
export interface Tutorial<M = unknown> {
  id: string;
  steps: Step<M>[];
}

/** Lifecycle status of the tutorial engine. */
export type TutorialStatus = "idle" | "running" | "paused" | "completed" | "cancelled";

/** Context passed to flow-level lifecycle callbacks and global events. */
export interface EventCtx<M = unknown> {
  flowId: string;
  flow: Tutorial<M>;
}

/** Context passed on step changes. */
export interface StepChangeCtx<M = unknown> extends EventCtx<M> {
  step: Step<M>;
  stepIndex: number;
  previousStepIndex: number;
}

/** Payload emitted when a step's target element cannot be found. */
export interface TargetNotFoundCtx<M = unknown> extends EventCtx<M> {
  step: Step<M>;
  stepIndex: number;
}

/** Per-flow lifecycle callbacks, supplied at registration time. */
export interface FlowCallbacks<M = unknown> {
  onStart?: (ctx: EventCtx<M>) => void;
  onFinish?: (ctx: EventCtx<M>) => void;
  onStepChange?: (ctx: StepChangeCtx<M>) => void;
  onCancel?: (ctx: EventCtx<M>) => void;
}

/** Options accepted by {@link register}. */
export interface RegisterOptions<M = unknown> extends FlowCallbacks<M> {
  /** Persist completion so a completed flow is not shown again. */
  persist?: boolean;
  /** Override the persistence key (defaults to the flow id). */
  persistKey?: string;
  /** Bumping this string re-shows a previously completed flow. */
  version?: string;
}

/** Internal record kept for each registered flow. */
export interface RegisteredFlow {
  tutorial: Tutorial;
  options: RegisterOptions;
}

/** Immutable snapshot of engine state, consumed by React via useSyncExternalStore. */
export interface TutorialState {
  status: TutorialStatus;
  activeFlowId: string | null;
  /** Index of the active step, or -1 when idle. */
  stepIndex: number;
  /** Stack of visited step indices, used for back navigation. */
  history: number[];
  /** All registered flows keyed by id. */
  flows: ReadonlyMap<string, RegisteredFlow>;
}

/** Progress information derived from the active flow. */
export interface Progress {
  /** 1-based index of the current step. */
  current: number;
  /** Total number of steps. */
  total: number;
  /** Completion ratio in the range (0, 1]. */
  ratio: number;
}

/** Options accepted by {@link start}. */
export interface StartOptions {
  /** Step index to begin at. Defaults to 0. */
  stepIndex?: number;
  /** Start even if the flow is persisted as completed. */
  force?: boolean;
}

/** How the engine reacts when a step's target element is missing. */
export type TargetNotFoundMode = "skip" | "center" | "wait";

/** Names of emitted lifecycle events. */
export type TutorialEventName =
  "start" | "finish" | "cancel" | "stepChange" | "targetNotFound";

/** Maps each event name to its payload type. */
export interface EventMap {
  start: EventCtx;
  finish: EventCtx;
  cancel: EventCtx;
  stepChange: StepChangeCtx;
  targetNotFound: TargetNotFoundCtx;
}
