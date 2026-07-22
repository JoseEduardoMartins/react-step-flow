import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useElementRect } from "./useElementRect";
import type { Rect } from "../utils/rect";

function mockRect(el: HTMLElement, rect: Partial<Rect>) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...rect,
    toJSON: () => ({}),
  } as DOMRect);
}

describe("useElementRect", () => {
  it("returns null when there is no element", () => {
    const { result } = renderHook(() => useElementRect(null));
    expect(result.current).toBeNull();
  });

  it("measures the element's rect", () => {
    const el = document.createElement("div");
    mockRect(el, { width: 100, height: 50, x: 5, y: 10 });
    const { result } = renderHook(() => useElementRect(el));
    expect(result.current).toMatchObject({ width: 100, height: 50, x: 5, y: 10 });
  });

  it("clears the rect when the element becomes null", () => {
    const el = document.createElement("div");
    mockRect(el, { width: 10, height: 10 });
    const { result, rerender } = renderHook(
      ({ node }: { node: HTMLElement | null }) => useElementRect(node),
      { initialProps: { node: el as HTMLElement | null } }
    );
    expect(result.current).not.toBeNull();
    rerender({ node: null });
    expect(result.current).toBeNull();
  });
});
