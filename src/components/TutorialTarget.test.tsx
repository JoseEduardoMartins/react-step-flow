import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { createRef } from "react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { createStore } from "../core/createStore";
import { TutorialTarget } from "./TutorialTarget";

describe("TutorialTarget", () => {
  it("registers the child element on mount and unregisters on unmount", () => {
    const store = createStore();
    const { unmount } = render(
      <TutorialProvider store={store}>
        <TutorialTarget id="save">
          <button>Save</button>
        </TutorialTarget>
      </TutorialProvider>
    );
    expect(store.registry.get("save")).toBeInstanceOf(HTMLButtonElement);
    unmount();
    expect(store.registry.get("save")).toBeNull();
  });

  it("preserves the child's own ref (asChild)", () => {
    const store = createStore();
    const ref = createRef<HTMLButtonElement>();
    render(
      <TutorialProvider store={store}>
        <TutorialTarget id="save">
          <button ref={ref}>Save</button>
        </TutorialTarget>
      </TutorialProvider>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(store.registry.get("save")).toBe(ref.current);
  });

  it("wraps non-element children in a display:contents span when asChild is false", () => {
    const store = createStore();
    const { container } = render(
      <TutorialProvider store={store}>
        <TutorialTarget id="txt" asChild={false}>
          plain text
        </TutorialTarget>
      </TutorialProvider>
    );
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.style.display).toBe("contents");
    expect(store.registry.get("txt")).toBe(span);
  });

  it("falls back to a wrapper span for non-element children even with asChild true", () => {
    const store = createStore();
    const { container } = render(
      <TutorialProvider store={store}>
        <TutorialTarget id="txt">just text</TutorialTarget>
      </TutorialProvider>
    );
    expect(container.querySelector("span")).not.toBeNull();
    expect(store.registry.get("txt")).toBeInstanceOf(HTMLSpanElement);
  });

  it("re-registers under a new id when the id prop changes", () => {
    const store = createStore();
    const { rerender } = render(
      <TutorialProvider store={store}>
        <TutorialTarget id="a">
          <button>x</button>
        </TutorialTarget>
      </TutorialProvider>
    );
    expect(store.registry.has("a")).toBe(true);
    rerender(
      <TutorialProvider store={store}>
        <TutorialTarget id="b">
          <button>x</button>
        </TutorialTarget>
      </TutorialProvider>
    );
    expect(store.registry.has("a")).toBe(false);
    expect(store.registry.has("b")).toBe(true);
  });
});
