import { describe, expect, it } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { TutorialProvider } from "./TutorialProvider";
import { useTutorialStore } from "../hooks/useStore";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [{ target: "a", title: "A", description: "" }],
};

describe("TutorialProvider", () => {
  it("creates an internal store when none is provided", () => {
    const { result } = renderHook(() => useTutorialStore(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TutorialProvider>{children}</TutorialProvider>
      ),
    });
    expect(result.current).toBeDefined();
    act(() => result.current.register(flow));
    expect(result.current.state.flows.has("f")).toBe(true);
  });

  it("keeps the same store instance across re-renders", () => {
    const seen: unknown[] = [];
    function Probe() {
      seen.push(useTutorialStore());
      return null;
    }
    const { rerender } = render(
      <TutorialProvider>
        <Probe />
      </TutorialProvider>
    );
    rerender(
      <TutorialProvider>
        <Probe />
      </TutorialProvider>
    );
    expect(seen[0]).toBe(seen[1]);
  });

  it("wires localStorage persistence when persistence is true", () => {
    const { result } = renderHook(() => useTutorialStore(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TutorialProvider persistence namespace="app">
          {children}
        </TutorialProvider>
      ),
    });
    act(() => result.current.register(flow, { persist: true }));
    act(() => result.current.start("f"));
    act(() => result.current.finish());
    expect(window.localStorage.getItem("app:f")).not.toBeNull();
    window.localStorage.clear();
  });
});
