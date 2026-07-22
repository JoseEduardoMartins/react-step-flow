import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { TutorialProvider } from "../provider/TutorialProvider";
import type { TutorialProviderProps } from "../provider/TutorialProvider";
import { TutorialTarget } from "./TutorialTarget";
import { createStore } from "../core/createStore";
import type { TutorialStore } from "../core/store";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [
    { target: "a", title: "Step A", description: "desc A" },
    { target: "b", title: "Step B", description: "desc B" },
  ],
};

function renderApp(store: TutorialStore, config: Partial<TutorialProviderProps> = {}) {
  const ui = (children: ReactNode) => (
    <TutorialProvider store={store} {...config}>
      <TutorialTarget id="a">
        <button>A</button>
      </TutorialTarget>
      <TutorialTarget id="b">
        <button>B</button>
      </TutorialTarget>
      {children}
    </TutorialProvider>
  );
  return render(ui(null));
}

describe("TutorialPortal", () => {
  it("renders nothing while idle", () => {
    const store = createStore();
    store.register(flow);
    renderApp(store);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the tooltip with the active step content", () => {
    const store = createStore();
    store.register(flow);
    renderApp(store);
    act(() => store.start("f"));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Step A");
    expect(dialog).toHaveTextContent("desc A");
    expect(dialog).toHaveTextContent("1 / 2");
  });

  it("renders a spotlight for a targeted step", () => {
    const store = createStore();
    store.register(flow);
    const { baseElement } = renderApp(store);
    act(() => store.start("f"));
    expect(baseElement.querySelector("[data-rsf-spotlight]")).not.toBeNull();
  });

  it("advances with the next button and finishes on the last step", async () => {
    const user = userEvent.setup();
    const store = createStore();
    const onFinish = vi.fn();
    store.register(flow, { onFinish });
    renderApp(store);
    act(() => store.start("f"));

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Step B");

    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onFinish).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a back button from the second step and navigates back", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.register(flow);
    renderApp(store);
    act(() => store.start("f"));

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Step A");
  });

  it("cancels via the skip button", async () => {
    const user = userEvent.setup();
    const store = createStore();
    const onCancel = vi.fn();
    store.register(flow, { onCancel });
    renderApp(store);
    act(() => store.start("f"));

    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders a plain overlay for a centered step", () => {
    const store = createStore();
    store.register({
      id: "c",
      steps: [
        { target: "", title: "Welcome", description: "hi", placement: "center" },
      ],
    });
    const { baseElement } = renderApp(store);
    act(() => store.start("c"));
    expect(baseElement.querySelector("[data-rsf-overlay]")).not.toBeNull();
    expect(baseElement.querySelector("[data-rsf-spotlight]")).toBeNull();
    expect(screen.getByRole("dialog")).toHaveTextContent("Welcome");
  });

  it("cancels when the overlay is clicked and closeOnOverlayClick is set", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.register({
      id: "c",
      steps: [{ target: "", title: "W", description: "d", placement: "center" }],
    });
    const { baseElement } = renderApp(store, { closeOnOverlayClick: true });
    act(() => store.start("c"));
    const overlay = baseElement.querySelector("[data-rsf-overlay]") as HTMLElement;
    await user.click(overlay);
    expect(store.state.status).toBe("cancelled");
  });

  it("skips a step whose target is missing when targetNotFound is 'skip'", () => {
    const store = createStore();
    store.register({
      id: "m",
      steps: [
        { target: "ghost", title: "Ghost", description: "d" },
        { target: "a", title: "Real", description: "d" },
      ],
    });
    renderApp(store, { targetNotFound: "skip" });
    act(() => store.start("m"));
    expect(store.state.stepIndex).toBe(1);
    expect(screen.getByRole("dialog")).toHaveTextContent("Real");
  });

  it("centers a step whose target is missing when targetNotFound is 'center'", () => {
    const store = createStore();
    const onNotFound = vi.fn();
    store.emitter.on("targetNotFound", onNotFound);
    store.register({
      id: "m",
      steps: [{ target: "ghost", title: "Ghost", description: "d" }],
    });
    const { baseElement } = renderApp(store, { targetNotFound: "center" });
    act(() => store.start("m"));
    expect(onNotFound).toHaveBeenCalled();
    expect(baseElement.querySelector("[data-rsf-overlay]")).not.toBeNull();
    expect(screen.getByRole("dialog")).toHaveTextContent("Ghost");
  });

  it("waits (renders nothing) for a missing target when targetNotFound is 'wait'", () => {
    const store = createStore();
    store.register({
      id: "m",
      steps: [{ target: "ghost", title: "Ghost", description: "d" }],
    });
    renderApp(store, { targetNotFound: "wait" });
    act(() => store.start("m"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
