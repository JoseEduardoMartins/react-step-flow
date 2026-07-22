import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { createStore } from "../core/createStore";
import { useTutorialStep } from "./useTutorialStep";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [
    { target: "a", title: "A", description: "" },
    { target: "b", title: "B", description: "" },
  ],
};

describe("useTutorialStep", () => {
  it("returns idle values before starting", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderHook(() => useTutorialStep(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TutorialProvider store={store}>{children}</TutorialProvider>
      ),
    });
    expect(result.current.step).toBeNull();
    expect(result.current.index).toBe(-1);
    expect(result.current.total).toBe(0);
    expect(result.current.isActive).toBe(false);
  });

  it("tracks the active step and total", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderHook(() => useTutorialStep(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TutorialProvider store={store}>{children}</TutorialProvider>
      ),
    });
    act(() => store.start("f"));
    expect(result.current.step?.target).toBe("a");
    expect(result.current.total).toBe(2);
    expect(result.current.index).toBe(0);
  });

  it("reports isActive for the matching target only", () => {
    const store = createStore();
    store.register(flow);
    const { result } = renderHook(() => useTutorialStep("b"), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TutorialProvider store={store}>{children}</TutorialProvider>
      ),
    });
    act(() => store.start("f"));
    expect(result.current.isActive).toBe(false);
    act(() => store.next());
    expect(result.current.isActive).toBe(true);
  });
});
