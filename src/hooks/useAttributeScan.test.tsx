import { afterEach, describe, expect, it } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { createStore } from "../core/createStore";

describe("useAttributeScan", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers elements already carrying data-tutorial-id", () => {
    const store = createStore();
    render(
      <TutorialProvider store={store} scanAttributes>
        <button data-tutorial-id="scan-a">A</button>
      </TutorialProvider>
    );
    expect(store.registry.get("scan-a")).toBeInstanceOf(HTMLButtonElement);
  });

  it("does not scan when scanAttributes is off", () => {
    const store = createStore();
    render(
      <TutorialProvider store={store}>
        <button data-tutorial-id="scan-b">B</button>
      </TutorialProvider>
    );
    expect(store.registry.get("scan-b")).toBeNull();
  });

  it("registers dynamically added nodes via the observer", async () => {
    const store = createStore();
    render(
      <TutorialProvider store={store} scanAttributes>
        <div id="host" />
      </TutorialProvider>
    );
    const host = document.getElementById("host")!;
    const btn = document.createElement("button");
    btn.setAttribute("data-tutorial-id", "scan-c");
    host.appendChild(btn);

    await waitFor(() => {
      expect(store.registry.get("scan-c")).toBe(btn);
    });
  });

  it("unregisters nodes removed from the DOM", async () => {
    const store = createStore();
    render(
      <TutorialProvider store={store} scanAttributes>
        <div id="host2">
          <button data-tutorial-id="scan-d">D</button>
        </div>
      </TutorialProvider>
    );
    expect(store.registry.get("scan-d")).not.toBeNull();
    const btn = document.querySelector('[data-tutorial-id="scan-d"]')!;
    btn.remove();
    await waitFor(() => {
      expect(store.registry.get("scan-d")).toBeNull();
    });
  });

  it("scans a custom root subtree instead of document.body", () => {
    const host = document.createElement("div");
    const inner = document.createElement("button");
    inner.setAttribute("data-tutorial-id", "scan-root-x");
    host.appendChild(inner);
    document.body.appendChild(host);

    const store = createStore();
    render(
      <TutorialProvider store={store} scanAttributes scanRoot={host}>
        <div />
      </TutorialProvider>
    );
    expect(store.registry.get("scan-root-x")).toBe(inner);
    host.remove();
  });

  it("scans into a shadow root", async () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("button");
    inner.setAttribute("data-tutorial-id", "scan-shadow-y");
    shadow.appendChild(inner);

    const store = createStore();
    render(
      <TutorialProvider store={store} scanAttributes scanRoot={shadow}>
        <div />
      </TutorialProvider>
    );
    expect(store.registry.get("scan-shadow-y")).toBe(inner);

    // Observer also picks up nodes added to the shadow root later.
    const late = document.createElement("button");
    late.setAttribute("data-tutorial-id", "scan-shadow-z");
    shadow.appendChild(late);
    await waitFor(() => {
      expect(store.registry.get("scan-shadow-z")).toBe(late);
    });
    host.remove();
  });
});
