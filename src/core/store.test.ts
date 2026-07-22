import { beforeEach, describe, expect, it, vi } from "vitest";
import { TutorialStore } from "./store";
import { createMemoryAdapter } from "./persistence";
import type { RegisterOptions, Tutorial } from "../types";

const flow: Tutorial = {
  id: "onboarding",
  steps: [
    { id: "s1", target: "menu", title: "Menu", description: "d1" },
    { target: "create", title: "Create", description: "d2" },
    { id: "s3", target: "save", title: "Save", description: "d3" },
  ],
};

function makeStore(): TutorialStore {
  return new TutorialStore();
}

function register(store: TutorialStore, options: RegisterOptions = {}) {
  store.register(flow, options);
}

describe("TutorialStore — initial state", () => {
  it("starts idle", () => {
    const store = makeStore();
    expect(store.state.status).toBe("idle");
    expect(store.state.activeFlowId).toBeNull();
    expect(store.state.stepIndex).toBe(-1);
    expect(store.state.history).toEqual([]);
    expect(store.getSnapshot()).toBe(store.state);
    expect(store.getServerSnapshot()).toBe(store.state);
  });
});

describe("TutorialStore — registration", () => {
  it("registers a flow and exposes it in state.flows", () => {
    const store = makeStore();
    register(store);
    expect(store.state.flows.has("onboarding")).toBe(true);
  });

  it("ignores an invalid flow", () => {
    const store = makeStore();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    store.register({ id: "bad", steps: [] });
    expect(store.state.flows.has("bad")).toBe(false);
  });

  it("unregisters a flow", () => {
    const store = makeStore();
    register(store);
    store.unregister("onboarding");
    expect(store.state.flows.has("onboarding")).toBe(false);
  });

  it("no-ops when unregistering an unknown flow", () => {
    const store = makeStore();
    const before = store.state;
    store.unregister("nope");
    expect(store.state).toBe(before);
  });

  it("resets to idle when the active flow is unregistered", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.unregister("onboarding");
    expect(store.state.status).toBe("idle");
    expect(store.state.activeFlowId).toBeNull();
  });

  it("produces a new flows map reference on registration", () => {
    const store = makeStore();
    const before = store.state.flows;
    register(store);
    expect(store.state.flows).not.toBe(before);
  });
});

describe("TutorialStore — start", () => {
  it("starts a registered flow at step 0", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    expect(store.state.status).toBe("running");
    expect(store.state.activeFlowId).toBe("onboarding");
    expect(store.state.stepIndex).toBe(0);
    expect(store.state.history).toEqual([0]);
  });

  it("can start at a specific step", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding", { stepIndex: 2 });
    expect(store.state.stepIndex).toBe(2);
  });

  it("clamps an out-of-range start index", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding", { stepIndex: 99 });
    expect(store.state.stepIndex).toBe(2);
  });

  it("warns and ignores an unknown flow", () => {
    const store = makeStore();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.start("ghost");
    expect(warnSpy).toHaveBeenCalled();
    expect(store.state.status).toBe("idle");
  });

  it("fires start then stepChange events in order", () => {
    const store = makeStore();
    register(store);
    const calls: string[] = [];
    store.emitter.on("start", () => calls.push("start"));
    store.emitter.on("stepChange", () => calls.push("stepChange"));
    store.start("onboarding");
    expect(calls).toEqual(["start", "stepChange"]);
  });

  it("invokes onStart and onStepChange callbacks", () => {
    const store = makeStore();
    const onStart = vi.fn();
    const onStepChange = vi.fn();
    register(store, { onStart, onStepChange });
    store.start("onboarding");
    expect(onStart).toHaveBeenCalledWith({ flowId: "onboarding", flow });
    expect(onStepChange).toHaveBeenCalledWith(
      expect.objectContaining({ stepIndex: 0, previousStepIndex: -1 })
    );
  });
});

describe("TutorialStore — next / previous", () => {
  beforeEach(() => {});

  it("advances to the next step", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.next();
    expect(store.state.stepIndex).toBe(1);
    expect(store.state.history).toEqual([0, 1]);
  });

  it("finishes when next() is called on the last step", () => {
    const store = makeStore();
    const onFinish = vi.fn();
    register(store, { onFinish });
    store.start("onboarding", { stepIndex: 2 });
    store.next();
    expect(store.state.status).toBe("completed");
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it("goes back via previous() using history", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.next();
    store.next();
    store.previous();
    expect(store.state.stepIndex).toBe(1);
    expect(store.state.history).toEqual([0, 1]);
  });

  it("no-ops previous() at the first step", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.previous();
    expect(store.state.stepIndex).toBe(0);
  });

  it("no-ops next()/previous() when not running", () => {
    const store = makeStore();
    register(store);
    store.next();
    store.previous();
    expect(store.state.status).toBe("idle");
  });

  it("emits stepChange with correct previousStepIndex on next", () => {
    const store = makeStore();
    register(store);
    const spy = vi.fn();
    store.start("onboarding");
    store.emitter.on("stepChange", spy);
    store.next();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ stepIndex: 1, previousStepIndex: 0 })
    );
  });
});

describe("TutorialStore — goTo", () => {
  it("jumps to a step by index", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.goTo(2);
    expect(store.state.stepIndex).toBe(2);
    expect(store.state.history).toEqual([0, 2]);
  });

  it("jumps to a step by id", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.goTo("s3");
    expect(store.state.stepIndex).toBe(2);
  });

  it("no-ops when jumping to the current step", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    const before = store.state;
    store.goTo(0);
    expect(store.state).toBe(before);
  });

  it("warns on an unresolvable step", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.goTo("missing");
    expect(warnSpy).toHaveBeenCalled();
    expect(store.state.stepIndex).toBe(0);
  });

  it("no-ops goTo when not running", () => {
    const store = makeStore();
    register(store);
    store.goTo(1);
    expect(store.state.status).toBe("idle");
  });
});

describe("TutorialStore — finish / cancel", () => {
  it("finish resets pointers and marks completed", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    store.finish();
    expect(store.state.status).toBe("completed");
    expect(store.state.activeFlowId).toBeNull();
    expect(store.state.stepIndex).toBe(-1);
  });

  it("cancel resets pointers and fires cancel", () => {
    const store = makeStore();
    const onCancel = vi.fn();
    register(store, { onCancel });
    store.start("onboarding");
    store.cancel();
    expect(store.state.status).toBe("cancelled");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("no-ops finish/cancel when not running", () => {
    const store = makeStore();
    register(store);
    store.finish();
    store.cancel();
    expect(store.state.status).toBe("idle");
  });
});

describe("TutorialStore — persistence", () => {
  it("does not persist on cancel", () => {
    const store = new TutorialStore({ persistence: createMemoryAdapter() });
    register(store, { persist: true });
    store.start("onboarding");
    store.cancel();
    expect(store.hasCompleted("onboarding")).toBe(false);
  });

  it("persists completion on finish and blocks a re-start", () => {
    const store = new TutorialStore({ persistence: createMemoryAdapter() });
    register(store, { persist: true });
    store.start("onboarding");
    store.finish();
    expect(store.hasCompleted("onboarding")).toBe(true);
    store.start("onboarding");
    expect(store.state.status).toBe("completed");
    expect(store.state.activeFlowId).toBeNull();
  });

  it("force-starts a persisted-complete flow", () => {
    const store = new TutorialStore({ persistence: createMemoryAdapter() });
    register(store, { persist: true });
    store.start("onboarding");
    store.finish();
    store.start("onboarding", { force: true });
    expect(store.state.status).toBe("running");
  });

  it("does not gate flows that are not marked persist", () => {
    const store = new TutorialStore({ persistence: createMemoryAdapter() });
    register(store);
    store.start("onboarding");
    store.finish();
    store.start("onboarding");
    expect(store.state.status).toBe("running");
  });

  it("re-shows a completed flow when the version changes", () => {
    const adapter = createMemoryAdapter();
    const a = new TutorialStore({ persistence: adapter });
    a.register(flow, { persist: true, version: "1" });
    a.start("onboarding");
    a.finish();

    const b = new TutorialStore({ persistence: adapter });
    b.register(flow, { persist: true, version: "2" });
    expect(b.hasCompleted("onboarding")).toBe(false);
  });

  it("honors a custom persistKey", () => {
    const adapter = createMemoryAdapter();
    const store = new TutorialStore({ persistence: adapter });
    register(store, { persist: true, persistKey: "custom" });
    store.start("onboarding");
    store.finish();
    expect(adapter.get("rsf:custom")).not.toBeNull();
  });

  it("respects a custom namespace", () => {
    const adapter = createMemoryAdapter();
    const store = new TutorialStore({ persistence: adapter, namespace: "app" });
    register(store, { persist: true });
    store.start("onboarding");
    store.finish();
    expect(adapter.get("app:onboarding")).not.toBeNull();
  });

  it("hasCompleted returns false for malformed stored data", () => {
    const adapter = createMemoryAdapter();
    adapter.set("rsf:onboarding", "not-json");
    const store = new TutorialStore({ persistence: adapter });
    register(store, { persist: true });
    expect(store.hasCompleted("onboarding")).toBe(false);
  });

  it("resetPersistence clears the stored flag", () => {
    const adapter = createMemoryAdapter();
    const store = new TutorialStore({ persistence: adapter });
    register(store, { persist: true });
    store.start("onboarding");
    store.finish();
    store.resetPersistence("onboarding");
    expect(store.hasCompleted("onboarding")).toBe(false);
  });

  it("restart clears persistence and starts fresh", () => {
    const adapter = createMemoryAdapter();
    const store = new TutorialStore({ persistence: adapter });
    register(store, { persist: true });
    store.start("onboarding");
    store.finish();
    store.restart("onboarding");
    expect(store.state.status).toBe("running");
    expect(store.state.stepIndex).toBe(0);
  });
});

describe("TutorialStore — subscribe & snapshots", () => {
  it("notifies subscribers on state change", () => {
    const store = makeStore();
    const listener = vi.fn();
    store.subscribe(listener);
    register(store);
    store.start("onboarding");
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("stops notifying after unsubscribe", () => {
    const store = makeStore();
    const listener = vi.fn();
    const off = store.subscribe(listener);
    off();
    register(store);
    expect(listener).not.toHaveBeenCalled();
  });

  it("returns a stable snapshot reference between mutations", () => {
    const store = makeStore();
    const a = store.getSnapshot();
    const b = store.getSnapshot();
    expect(a).toBe(b);
    register(store);
    expect(store.getSnapshot()).not.toBe(a);
  });
});

describe("TutorialStore — reportTargetNotFound", () => {
  it("emits targetNotFound for the active step", () => {
    const store = makeStore();
    register(store);
    store.start("onboarding");
    const spy = vi.fn();
    store.emitter.on("targetNotFound", spy);
    store.reportTargetNotFound();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ flowId: "onboarding", stepIndex: 0 })
    );
  });

  it("no-ops when not running", () => {
    const store = makeStore();
    const spy = vi.fn();
    store.emitter.on("targetNotFound", spy);
    store.reportTargetNotFound();
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("TutorialStore — callback isolation", () => {
  it("does not let a throwing callback break the transition", () => {
    const store = makeStore();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    register(store, {
      onStart: () => {
        throw new Error("boom");
      },
    });
    expect(() => store.start("onboarding")).not.toThrow();
    expect(store.state.status).toBe("running");
  });
});
