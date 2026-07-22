import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { createStore } from "../core/createStore";
import type { TutorialStore } from "../core/store";
import { useTutorial } from "./useTutorial";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [
    { target: "a", title: "A", description: "da" },
    { target: "b", title: "B", description: "db" },
    { target: "c", title: "C", description: "dc" },
  ],
};

function renderTutorial(store: TutorialStore) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TutorialProvider store={store}>{children}</TutorialProvider>
  );
  return renderHook(() => useTutorial(), { wrapper });
}

describe("useTutorial", () => {
  it("throws when used outside a provider", () => {
    expect(() => renderHook(() => useTutorial())).toThrow(/TutorialProvider/);
  });

  it("reports idle state before starting", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderTutorial(store);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.progress).toBeNull();
    expect(result.current.flow).toBeNull();
    expect(result.current.stepIndex).toBe(-1);
  });

  it("starts a flow and exposes step + progress reactively", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderTutorial(store);

    act(() => result.current.start("f"));

    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentStep?.title).toBe("A");
    expect(result.current.flow?.id).toBe("f");
    expect(result.current.stepIndex).toBe(0);
    expect(result.current.progress).toEqual({ current: 1, total: 3, ratio: 1 / 3 });
  });

  it("advances and rewinds through steps", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderTutorial(store);

    act(() => result.current.start("f"));
    act(() => result.current.next());
    expect(result.current.currentStep?.title).toBe("B");
    expect(result.current.progress?.current).toBe(2);

    act(() => result.current.goTo(2));
    expect(result.current.currentStep?.title).toBe("C");

    act(() => result.current.previous());
    expect(result.current.currentStep?.title).toBe("B");
  });

  it("finishes the flow", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderTutorial(store);

    act(() => result.current.start("f"));
    act(() => result.current.finish());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.status).toBe("completed");
    expect(result.current.currentStep).toBeNull();
  });

  it("cancels the flow", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderTutorial(store);

    act(() => result.current.start("f"));
    act(() => result.current.cancel());

    expect(result.current.status).toBe("cancelled");
    expect(result.current.isRunning).toBe(false);
  });

  it("keeps action identities stable across renders", () => {
    const store = createStore();
    store.register(flow);
    const { result, rerender } = renderTutorial(store);
    const first = result.current.start;
    act(() => result.current.start("f"));
    rerender();
    expect(result.current.start).toBe(first);
  });

  it("restart re-runs a completed persisted flow", () => {
    const store = createStore();
    store.register(flow, { persist: true });
    const { result } = renderTutorial(store);

    act(() => result.current.start("f"));
    act(() => result.current.finish());
    act(() => result.current.restart("f"));

    expect(result.current.isRunning).toBe(true);
    expect(result.current.stepIndex).toBe(0);
  });
});
