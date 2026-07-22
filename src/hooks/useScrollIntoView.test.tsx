import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollIntoView } from "./useScrollIntoView";

function elWithRect(rect: Partial<DOMRect>): HTMLElement {
  const el = document.createElement("div");
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
  el.scrollIntoView = vi.fn();
  return el;
}

describe("useScrollIntoView", () => {
  it("scrolls an off-screen element into view", () => {
    const el = elWithRect({ top: 5000, bottom: 5100 });
    renderHook(() => useScrollIntoView(el, { behavior: "auto" }));
    expect(el.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "center",
      inline: "center",
    });
  });

  it("does not scroll an already-visible element", () => {
    const el = elWithRect({ top: 100, bottom: 200, left: 100, right: 200 });
    renderHook(() => useScrollIntoView(el));
    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const el = elWithRect({ top: 5000, bottom: 5100 });
    renderHook(() => useScrollIntoView(el, { enabled: false }));
    expect(el.scrollIntoView).not.toHaveBeenCalled();
  });

  it("does nothing when there is no element", () => {
    expect(() => renderHook(() => useScrollIntoView(null))).not.toThrow();
  });
});
