import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
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

describe("useElementRect — CSS transform tracking", () => {
  // A translate animation changes the bounding box but not the border-box, so
  // ResizeObserver (a no-op in jsdom anyway) and scroll/resize never fire. Drive
  // requestAnimationFrame by hand to prove the rAF poll follows the moving rect
  // and stops once it settles.
  const handlers = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  const flushFrame = () =>
    act(() => {
      const current = Array.from(handlers.values());
      handlers.clear();
      current.forEach((cb) => cb(0));
    });

  beforeEach(() => {
    handlers.clear();
    nextId = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      const id = nextId++;
      handlers.set(id, cb);
      return id;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      handlers.delete(id);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("follows a rect that moves via transform, then stops when it settles", () => {
    const el = document.createElement("div");
    // Starts off-screen (mid slide-in), like a drawer at translateX(100%).
    mockRect(el, { width: 320, height: 600, x: 1000, y: 0 });
    const { result } = renderHook(() => useElementRect(el));
    expect(result.current).toMatchObject({ x: 1000 });

    // Frame 1: element slid halfway in — the poll must pick it up without any
    // ResizeObserver/scroll/resize event.
    mockRect(el, { width: 320, height: 600, x: 500, y: 0 });
    flushFrame();
    expect(result.current).toMatchObject({ x: 500 });

    // Frame 2: settled at its final position.
    mockRect(el, { width: 320, height: 600, x: 0, y: 0 });
    flushFrame();
    expect(result.current).toMatchObject({ x: 0 });

    // Once the rect holds still for STABLE_FRAMES, the poll must stop rescheduling
    // instead of looping forever.
    for (let i = 0; i < 10 && handlers.size > 0; i++) {
      flushFrame();
    }
    expect(handlers.size).toBe(0);
    expect(result.current).toMatchObject({ x: 0 });
  });
});
