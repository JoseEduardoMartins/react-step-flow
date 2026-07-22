import { describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  return render(
    <TutorialProvider store={store} {...config}>
      <TutorialTarget id="a">
        <button>A</button>
      </TutorialTarget>
      <TutorialTarget id="b">
        <button>B</button>
      </TutorialTarget>
    </TutorialProvider>
  );
}

describe("TutorialPortal accessibility", () => {
  it("exposes a labelled modal dialog", () => {
    const store = createStore();
    store.register(flow);
    renderApp(store);
    act(() => store.start("f"));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");
  });

  it("announces the current step via an aria-live region", () => {
    const store = createStore();
    store.register(flow);
    const { baseElement } = renderApp(store);
    act(() => store.start("f"));
    const live = baseElement.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live).toHaveTextContent("Step 1 of 2: Step A");
  });

  it("uses a custom announce template when provided", () => {
    const store = createStore();
    store.register(flow);
    const { baseElement } = renderApp(store, {
      announce: (current, total, step) =>
        `Passo ${current} de ${total}: ${step.title}`,
    });
    act(() => store.start("f"));
    const live = baseElement.querySelector('[aria-live="polite"]');
    expect(live).toHaveTextContent("Passo 1 de 2: Step A");
  });

  it("moves focus into the tooltip when a step starts", () => {
    const store = createStore();
    store.register(flow);
    renderApp(store);
    act(() => store.start("f"));
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("cancels on Escape when closeOnEsc is enabled", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.register(flow);
    renderApp(store);
    act(() => store.start("f"));
    await user.keyboard("{Escape}");
    expect(store.state.status).toBe("cancelled");
  });

  it("ignores Escape when closeOnEsc is disabled", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.register(flow);
    renderApp(store, { closeOnEsc: false });
    act(() => store.start("f"));
    await user.keyboard("{Escape}");
    expect(store.state.status).toBe("running");
  });

  it("ignores Escape when the step cannot be skipped", async () => {
    const user = userEvent.setup();
    const store = createStore();
    store.register({
      id: "g",
      steps: [{ target: "a", title: "A", description: "d", canSkip: false }],
    });
    renderApp(store);
    act(() => store.start("g"));
    await user.keyboard("{Escape}");
    expect(store.state.status).toBe("running");
  });
});
