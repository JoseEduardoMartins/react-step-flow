import { describe, expect, it, vi } from "vitest";
import { TutorialStore } from "./store";
import type { Tutorial } from "../types";

function baseFlow(): Tutorial {
  return {
    id: "f",
    steps: [
      { id: "s1", target: "a", title: "A", description: "" },
      { id: "s2", target: "b", title: "B", description: "" },
      { id: "s3", target: "c", title: "C", description: "" },
    ],
  };
}

function makeStore(): TutorialStore {
  const store = new TutorialStore();
  store.register(baseFlow());
  return store;
}

describe("TutorialStore — dynamic step editing", () => {
  it("adds a step at the end by default", () => {
    const store = makeStore();
    store.addStep("f", { target: "d", title: "D", description: "" });
    expect(store.state.flows.get("f")!.tutorial.steps).toHaveLength(4);
    expect(store.state.flows.get("f")!.tutorial.steps[3]!.title).toBe("D");
  });

  it("adds a step at a specific index", () => {
    const store = makeStore();
    store.addStep("f", { target: "x", title: "X", description: "" }, 1);
    expect(store.state.flows.get("f")!.tutorial.steps[1]!.title).toBe("X");
  });

  it("removes a step by id", () => {
    const store = makeStore();
    store.removeStep("f", "s2");
    const titles = store.state.flows.get("f")!.tutorial.steps.map((s) => s.title);
    expect(titles).toEqual(["A", "C"]);
  });

  it("removes a step by index", () => {
    const store = makeStore();
    store.removeStep("f", 0);
    expect(store.state.flows.get("f")!.tutorial.steps[0]!.title).toBe("B");
  });

  it("no-ops removing an unknown step", () => {
    const store = makeStore();
    const before = store.state;
    store.removeStep("f", "nope");
    expect(store.state).toBe(before);
  });

  it("updates a step by merging a patch", () => {
    const store = makeStore();
    store.updateStep("f", "s1", { title: "A!", description: "new" });
    const step = store.state.flows.get("f")!.tutorial.steps[0]!;
    expect(step.title).toBe("A!");
    expect(step.target).toBe("a");
  });

  it("no-ops updating an unknown step", () => {
    const store = makeStore();
    const before = store.state;
    store.updateStep("f", 99, { title: "x" });
    expect(store.state).toBe(before);
  });

  it("replaces all steps with setSteps", () => {
    const store = makeStore();
    store.setSteps("f", [{ target: "z", title: "Z", description: "" }]);
    expect(store.state.flows.get("f")!.tutorial.steps).toHaveLength(1);
  });

  it("warns and no-ops when editing an unknown flow", () => {
    const store = makeStore();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.addStep("ghost", { target: "x", title: "x", description: "" });
    expect(warnSpy).toHaveBeenCalled();
  });

  it("clamps the active step index when steps are removed", () => {
    const store = makeStore();
    store.start("f", { stepIndex: 2 });
    store.removeStep("f", "s3");
    expect(store.state.stepIndex).toBe(1);
  });

  it("emits stepChange when the active step identity changes", () => {
    const store = makeStore();
    store.start("f", { stepIndex: 1 });
    const spy = vi.fn();
    store.emitter.on("stepChange", spy);
    store.removeStep("f", "s1"); // shifts current step to a different object
    expect(spy).toHaveBeenCalled();
  });

  it("does not emit stepChange when editing a later, non-active step", () => {
    const store = makeStore();
    store.start("f", { stepIndex: 0 });
    const spy = vi.fn();
    store.emitter.on("stepChange", spy);
    store.updateStep("f", "s3", { title: "changed" });
    expect(spy).not.toHaveBeenCalled();
  });

  it("cancels the flow when all steps of the active flow are removed", () => {
    const store = makeStore();
    const onCancel = vi.fn();
    store.register(baseFlow(), { onCancel });
    store.start("f");
    store.emitter.on("cancel", onCancel);
    store.setSteps("f", []);
    expect(store.state.status).toBe("cancelled");
    expect(onCancel).toHaveBeenCalled();
  });

  it("editing a non-active flow only updates the snapshot", () => {
    const store = makeStore();
    store.register({
      id: "other",
      steps: [{ target: "o", title: "O", description: "" }],
    });
    store.start("f");
    const spy = vi.fn();
    store.emitter.on("stepChange", spy);
    store.addStep("other", { target: "p", title: "P", description: "" });
    expect(spy).not.toHaveBeenCalled();
    expect(store.state.flows.get("other")!.tutorial.steps).toHaveLength(2);
  });

  it("start() warns and stays idle when a flow has been emptied", () => {
    const store = makeStore();
    store.setSteps("f", []);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.start("f");
    expect(warnSpy).toHaveBeenCalled();
    expect(store.state.status).toBe("idle");
  });
});
