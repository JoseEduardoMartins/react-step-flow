import type {
  EventCtx,
  RegisterOptions,
  RegisteredFlow,
  Step,
  StartOptions,
  StepChangeCtx,
  Tutorial,
  TutorialState,
} from "../types";
import { warn } from "../utils/warn";
import { EventEmitter } from "./emitter";
import { validateFlow } from "./guards";
import { clampIndex, isLastStep, resolveStepIndex, stepAt } from "./navigation";
import {
  createMemoryAdapter,
  type PersistenceAdapter,
} from "./persistence";
import { ElementRegistry } from "./registry";

/** Configuration accepted when constructing a {@link TutorialStore}. */
export interface StoreConfig {
  /** Persistence backend. Defaults to an in-memory adapter. */
  persistence?: PersistenceAdapter;
  /** Namespace prefixed to persistence keys. Defaults to `"rsf"`. */
  namespace?: string;
}

interface PersistedRecord {
  completedAt: number;
  version?: string;
}

const IDLE_STATE: Omit<TutorialState, "flows"> = {
  status: "idle",
  activeFlowId: null,
  stepIndex: -1,
  history: [],
};

/**
 * The framework-agnostic engine. Owns all tutorial state and logic and exposes
 * a `useSyncExternalStore`-compatible contract. It imports no React.
 *
 * The state snapshot is immutable and identity-stable: every mutation produces
 * a new top-level object, and `getSnapshot` returns the cached object as-is so
 * React's `Object.is` comparison stays correct (returning a freshly-computed
 * value from `getSnapshot` would loop forever).
 */
export class TutorialStore {
  readonly emitter = new EventEmitter();
  readonly registry = new ElementRegistry();

  private _state: TutorialState;
  private readonly listeners = new Set<() => void>();
  private readonly flows = new Map<string, RegisteredFlow>();
  private readonly persistence: PersistenceAdapter;
  private readonly namespace: string;

  constructor(config: StoreConfig = {}) {
    this.persistence = config.persistence ?? createMemoryAdapter();
    this.namespace = config.namespace ?? "rsf";
    this._state = { ...IDLE_STATE, flows: this.snapshotFlows() };
  }

  // ---------------------------------------------------------------------------
  // useSyncExternalStore contract (bound arrow fns => stable identity)
  // ---------------------------------------------------------------------------

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): TutorialState => this._state;

  getServerSnapshot = (): TutorialState => this._state;

  /** The current immutable state snapshot (mirrors the public `tutorial.state`). */
  get state(): TutorialState {
    return this._state;
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  register = (flow: Tutorial, options: RegisterOptions = {}): void => {
    if (!validateFlow(flow)) return;
    this.flows.set(flow.id, { tutorial: flow, options });
    this.setState({ flows: this.snapshotFlows() });
  };

  unregister = (flowId: string): void => {
    if (!this.flows.delete(flowId)) return;
    const patch: Partial<TutorialState> = { flows: this.snapshotFlows() };
    if (this.state.activeFlowId === flowId) {
      Object.assign(patch, IDLE_STATE);
    }
    this.setState(patch);
  };

  // ---------------------------------------------------------------------------
  // Navigation / lifecycle
  // ---------------------------------------------------------------------------

  start = (flowId: string, options: StartOptions = {}): void => {
    const record = this.flows.get(flowId);
    if (!record) {
      warn(`start("${flowId}") ignored: no flow registered with that id.`);
      return;
    }
    if (
      !options.force &&
      record.options.persist &&
      this.hasCompleted(flowId)
    ) {
      return;
    }

    const startIndex = clampIndex(record.tutorial, options.stepIndex ?? 0);
    if (startIndex < 0) {
      warn(`start("${flowId}") ignored: flow has no steps.`);
      return;
    }

    this.setState({
      status: "running",
      activeFlowId: flowId,
      stepIndex: startIndex,
      history: [startIndex],
    });

    this.fireStart(record);
    this.fireStepChange(record, startIndex, -1);
  };

  next = (): void => {
    const record = this.activeRecord();
    if (!record) return;
    if (isLastStep(record.tutorial, this.state.stepIndex)) {
      this.finish();
      return;
    }
    this.goToInternal(record, this.state.stepIndex + 1);
  };

  previous = (): void => {
    const record = this.activeRecord();
    if (!record) return;
    if (this.state.history.length <= 1) {
      return;
    }
    const history = this.state.history.slice(0, -1);
    const target = history[history.length - 1] as number;
    const previousStepIndex = this.state.stepIndex;
    this.setState({ stepIndex: target, history });
    this.fireStepChange(record, target, previousStepIndex);
  };

  goTo = (ref: number | string): void => {
    const record = this.activeRecord();
    if (!record) return;
    const target = resolveStepIndex(record.tutorial, ref);
    if (target < 0) {
      warn(`goTo(${JSON.stringify(ref)}) ignored: step not found.`);
      return;
    }
    if (target === this.state.stepIndex) return;
    this.goToInternal(record, target);
  };

  finish = (): void => {
    const record = this.activeRecord();
    if (!record) return;
    const ctx = this.ctxFor(record);
    if (record.options.persist) {
      this.markCompleted(record.tutorial.id, record.options.version);
    }
    this.setState({ ...IDLE_STATE, status: "completed" });
    this.emitter.emit("finish", ctx);
    this.invoke(record.options.onFinish, ctx);
  };

  cancel = (): void => {
    const record = this.activeRecord();
    if (!record) return;
    const ctx = this.ctxFor(record);
    this.setState({ ...IDLE_STATE, status: "cancelled" });
    this.emitter.emit("cancel", ctx);
    this.invoke(record.options.onCancel, ctx);
  };

  restart = (flowId: string, options: StartOptions = {}): void => {
    this.resetPersistence(flowId);
    if (this.state.activeFlowId) this.cancel();
    this.start(flowId, { ...options, force: true });
  };

  // ---------------------------------------------------------------------------
  // Dynamic flow editing (safe to call at runtime, including on a running flow)
  // ---------------------------------------------------------------------------

  /** Insert a step at `index` (defaults to the end). */
  addStep = (flowId: string, step: Step, index?: number): void => {
    this.mutateSteps(flowId, (steps) => {
      const next = [...steps];
      const at = index ?? next.length;
      next.splice(Math.max(0, Math.min(at, next.length)), 0, step);
      return next;
    });
  };

  /** Remove a step by index or id. */
  removeStep = (flowId: string, ref: number | string): void => {
    this.mutateSteps(flowId, (steps, flow) => {
      const idx = resolveStepIndex(flow, ref);
      if (idx < 0) return steps;
      const next = [...steps];
      next.splice(idx, 1);
      return next;
    });
  };

  /** Shallow-merge a patch into a step identified by index or id. */
  updateStep = (
    flowId: string,
    ref: number | string,
    patch: Partial<Step>
  ): void => {
    this.mutateSteps(flowId, (steps, flow) => {
      const idx = resolveStepIndex(flow, ref);
      if (idx < 0) return steps;
      const next = [...steps];
      next[idx] = { ...next[idx]!, ...patch };
      return next;
    });
  };

  /** Replace the entire step list of a flow. */
  setSteps = (flowId: string, steps: Step[]): void => {
    this.mutateSteps(flowId, () => [...steps]);
  };

  // ---------------------------------------------------------------------------
  // Reporting (called by the React portal, keeps DOM out of the core)
  // ---------------------------------------------------------------------------

  reportTargetNotFound = (): void => {
    const record = this.activeRecord();
    if (!record) return;
    const step = stepAt(record.tutorial, this.state.stepIndex);
    if (!step) return;
    this.emitter.emit("targetNotFound", {
      ...this.ctxFor(record),
      step,
      stepIndex: this.state.stepIndex,
    });
  };

  // ---------------------------------------------------------------------------
  // Persistence helpers
  // ---------------------------------------------------------------------------

  hasCompleted = (flowId: string): boolean => {
    const record = this.flows.get(flowId);
    const key = this.persistKey(flowId, record?.options.persistKey);
    const raw = this.persistence.get(key);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw) as PersistedRecord;
      const currentVersion = record?.options.version;
      if (currentVersion !== undefined && parsed.version !== currentVersion) {
        return false;
      }
      return typeof parsed.completedAt === "number";
    } catch {
      return false;
    }
  };

  resetPersistence = (flowId: string): void => {
    const record = this.flows.get(flowId);
    this.persistence.remove(this.persistKey(flowId, record?.options.persistKey));
  };

  private markCompleted(flowId: string, version?: string): void {
    const record = this.flows.get(flowId);
    const payload: PersistedRecord = { completedAt: Date.now() };
    if (version !== undefined) payload.version = version;
    this.persistence.set(
      this.persistKey(flowId, record?.options.persistKey),
      JSON.stringify(payload)
    );
  }

  private persistKey(flowId: string, override?: string): string {
    return `${this.namespace}:${override ?? flowId}`;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private goToInternal(record: RegisteredFlow, target: number): void {
    const previousStepIndex = this.state.stepIndex;
    this.setState({
      stepIndex: target,
      history: [...this.state.history, target],
    });
    this.fireStepChange(record, target, previousStepIndex);
  }

  /**
   * Apply a pure transform to a flow's step list. Rebuilds the flow snapshot
   * and, when the flow is currently running, keeps the active pointer valid:
   * clamps `stepIndex`, cancels if the flow becomes empty, and re-emits
   * `stepChange` when the active step's identity changes.
   */
  private mutateSteps(
    flowId: string,
    updater: (steps: Step[], flow: Tutorial) => Step[]
  ): void {
    const record = this.flows.get(flowId);
    if (!record) {
      warn(`step edit on "${flowId}" ignored: no such flow.`);
      return;
    }
    const nextSteps = updater(record.tutorial.steps, record.tutorial);
    if (nextSteps === record.tutorial.steps) return;

    const nextTutorial: Tutorial = { ...record.tutorial, steps: nextSteps };
    const nextRecord: RegisteredFlow = { ...record, tutorial: nextTutorial };
    this.flows.set(flowId, nextRecord);

    const isActive =
      this.state.activeFlowId === flowId && this.state.status === "running";

    if (!isActive) {
      this.setState({ flows: this.snapshotFlows() });
      return;
    }

    if (nextSteps.length === 0) {
      const ctx = this.ctxFor(nextRecord);
      this.setState({ ...IDLE_STATE, status: "cancelled", flows: this.snapshotFlows() });
      this.emitter.emit("cancel", ctx);
      this.invoke(nextRecord.options.onCancel, ctx);
      return;
    }

    const previousStep = stepAt(record.tutorial, this.state.stepIndex);
    const clamped = clampIndex(nextTutorial, this.state.stepIndex);
    const nextStep = stepAt(nextTutorial, clamped);
    const previousStepIndex = this.state.stepIndex;

    this.setState({ flows: this.snapshotFlows(), stepIndex: clamped });

    if (clamped !== previousStepIndex || nextStep !== previousStep) {
      this.fireStepChange(nextRecord, clamped, previousStepIndex);
    }
  }

  private activeRecord(): RegisteredFlow | null {
    if (this.state.status !== "running" || !this.state.activeFlowId) {
      return null;
    }
    return this.flows.get(this.state.activeFlowId) ?? null;
  }

  private fireStart(record: RegisteredFlow): void {
    const ctx = this.ctxFor(record);
    this.emitter.emit("start", ctx);
    this.invoke(record.options.onStart, ctx);
  }

  private fireStepChange(
    record: RegisteredFlow,
    stepIndex: number,
    previousStepIndex: number
  ): void {
    const step = stepAt(record.tutorial, stepIndex);
    if (!step) return;
    const ctx: StepChangeCtx = {
      ...this.ctxFor(record),
      step,
      stepIndex,
      previousStepIndex,
    };
    this.emitter.emit("stepChange", ctx);
    this.invoke(record.options.onStepChange, ctx);
  }

  private ctxFor(record: RegisteredFlow): EventCtx {
    return { flowId: record.tutorial.id, flow: record.tutorial };
  }

  private invoke<T>(cb: ((arg: T) => void) | undefined, arg: T): void {
    if (!cb) return;
    try {
      cb(arg);
    } catch (error) {
      warn(`flow callback threw: ${String(error)}`);
    }
  }

  private snapshotFlows(): ReadonlyMap<string, RegisteredFlow> {
    return new Map(this.flows);
  }

  private setState(patch: Partial<TutorialState>): void {
    this._state = { ...this._state, ...patch };
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}

/** Re-exported for consumers who type against the current step. */
export type { Step };
