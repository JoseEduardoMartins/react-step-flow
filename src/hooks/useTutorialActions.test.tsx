import { describe, expect, it, vi } from "vitest";
import { act, render, renderHook } from "@testing-library/react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { createStore } from "../core/createStore";
import { useTutorialActions } from "./useTutorialActions";
import { useTutorial } from "./useTutorial";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [{ target: "a", title: "A", description: "" }],
};

describe("useTutorialActions", () => {
  it("exposes register/start and drives the engine", () => {
    const store = createStore();
    const { result } = renderHook(() => useTutorialActions(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <TutorialProvider store={store}>{children}</TutorialProvider>
      ),
    });
    act(() => result.current.register(flow));
    act(() => result.current.start("f"));
    expect(store.state.status).toBe("running");
  });

  it("does not re-render as the tutorial progresses", () => {
    const store = createStore();
    store.register({
      id: "f",
      steps: [
        { target: "a", title: "A", description: "" },
        { target: "b", title: "B", description: "" },
      ],
    });

    const actionRenders = vi.fn();
    const stateRenders = vi.fn();

    function ActionButton() {
      actionRenders();
      const { next } = useTutorialActions();
      const ref = useRef(next);
      ref.current = next;
      return null;
    }

    function StateReader() {
      stateRenders();
      useTutorial();
      return null;
    }

    render(
      <TutorialProvider store={store}>
        <ActionButton />
        <StateReader />
      </TutorialProvider>
    );

    const actionBaseline = actionRenders.mock.calls.length;
    const stateBaseline = stateRenders.mock.calls.length;

    act(() => store.start("f"));
    act(() => store.next());

    // The action-only component never re-renders; the state reader does.
    expect(actionRenders.mock.calls.length).toBe(actionBaseline);
    expect(stateRenders.mock.calls.length).toBeGreaterThan(stateBaseline);
  });
});
