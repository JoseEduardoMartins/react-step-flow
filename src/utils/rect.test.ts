import { describe, expect, it, vi } from "vitest";
import { expandRect, getRect, rectsEqual, type Rect } from "./rect";

const base: Rect = {
  x: 10,
  y: 20,
  width: 100,
  height: 40,
  top: 20,
  left: 10,
  right: 110,
  bottom: 60,
};

describe("getRect", () => {
  it("maps getBoundingClientRect into a plain rect", () => {
    const el = document.createElement("div");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      ...base,
      toJSON: () => base,
    } as DOMRect);
    expect(getRect(el)).toEqual(base);
  });
});

describe("expandRect", () => {
  it("grows the rect on every side by padding", () => {
    expect(expandRect(base, 5)).toEqual({
      x: 5,
      y: 15,
      width: 110,
      height: 50,
      top: 15,
      left: 5,
      right: 115,
      bottom: 65,
    });
  });
});

describe("rectsEqual", () => {
  it("is true for the same reference", () => {
    expect(rectsEqual(base, base)).toBe(true);
  });
  it("is true for structurally equal rects", () => {
    expect(rectsEqual(base, { ...base })).toBe(true);
  });
  it("is false when one is null", () => {
    expect(rectsEqual(base, null)).toBe(false);
    expect(rectsEqual(null, base)).toBe(false);
  });
  it("is true for two nulls", () => {
    expect(rectsEqual(null, null)).toBe(true);
  });
  it("is false when geometry differs", () => {
    expect(rectsEqual(base, { ...base, width: 999 })).toBe(false);
  });
});
