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

  it("gives each tooltip instance unique aria ids (no collision across providers)", () => {
    const a = createStore();
    const b = createStore();
    a.register(flow);
    b.register(flow);
    render(
      <>
        <TutorialProvider store={a}>
          <TutorialTarget id="a">
            <button>A</button>
          </TutorialTarget>
        </TutorialProvider>
        <TutorialProvider store={b}>
          <TutorialTarget id="a">
            <button>A2</button>
          </TutorialTarget>
        </TutorialProvider>
      </>
    );
    act(() => {
      a.start("f");
      b.start("f");
    });
    const [d1, d2] = screen.getAllByRole("dialog");
    const label1 = d1!.getAttribute("aria-labelledby");
    const label2 = d2!.getAttribute("aria-labelledby");
    expect(label1).toBeTruthy();
    expect(label2).toBeTruthy();
    expect(label1).not.toBe(label2);
    // Each label points at an element that actually exists.
    expect(document.getElementById(label1!)).not.toBeNull();
    expect(document.getElementById(label2!)).not.toBeNull();
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
      announce: (current, total, step) => `Passo ${current} de ${total}: ${step.title}`,
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

  it("leaves the background reachable by default (no inert)", () => {
    const store = createStore();
    store.register(flow);
    const { container } = renderApp(store);
    act(() => store.start("f"));
    expect(container.hasAttribute("inert")).toBe(false);
  });

  it("inerts sibling content for a non-interactive step when inertBackground is on", () => {
    const store = createStore();
    store.register(flow);
    const { container } = renderApp(store, { inertBackground: true });
    act(() => store.start("f"));
    expect(container.hasAttribute("inert")).toBe(true);
    expect(container.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not inert the background for an interactive step", () => {
    const store = createStore();
    store.register({
      id: "i",
      steps: [{ target: "a", title: "A", description: "d", interactable: true }],
    });
    const { container } = renderApp(store, { inertBackground: true });
    act(() => store.start("i"));
    expect(container.hasAttribute("inert")).toBe(false);
  });

  it("restores background reachability when the tour ends", () => {
    const store = createStore();
    store.register(flow);
    const { container } = renderApp(store, { inertBackground: true });
    act(() => store.start("f"));
    expect(container.hasAttribute("inert")).toBe(true);
    act(() => store.cancel());
    expect(container.hasAttribute("inert")).toBe(false);
  });
});
