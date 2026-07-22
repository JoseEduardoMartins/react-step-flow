import { describe, expect, it, vi } from "vitest";
import { isElementInViewport } from "./isVisible";

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
  return el;
}

describe("isElementInViewport", () => {
  it("is true for an element inside the viewport", () => {
    const el = elWithRect({ top: 100, left: 100, right: 200, bottom: 200 });
    expect(isElementInViewport(el)).toBe(true);
  });

  it("is false for an element above the viewport", () => {
    const el = elWithRect({ top: -300, bottom: -200, left: 10, right: 20 });
    expect(isElementInViewport(el)).toBe(false);
  });

  it("is false for an element below the viewport", () => {
    const el = elWithRect({ top: 5000, bottom: 5100, left: 10, right: 20 });
    expect(isElementInViewport(el)).toBe(false);
  });

  it("respects the margin", () => {
    const el = elWithRect({ top: -50, bottom: -10, left: 10, right: 20 });
    expect(isElementInViewport(el, 0)).toBe(false);
    expect(isElementInViewport(el, 100)).toBe(true);
  });
});
