import { afterEach, describe, expect, it } from "vitest";

import { getScrollParent } from "./getScrollParent";

describe("getScrollParent", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns null for a null element", () => {
    expect(getScrollParent(null)).toBeNull();
  });

  it("returns the nearest scrollable ancestor", () => {
    const scroller = document.createElement("div");
    scroller.style.overflow = "auto";
    const child = document.createElement("div");
    scroller.appendChild(child);
    document.body.appendChild(scroller);
    expect(getScrollParent(child)).toBe(scroller);
  });

  it("returns null when no ancestor scrolls", () => {
    const parent = document.createElement("div");
    const child = document.createElement("div");
    parent.appendChild(child);
    document.body.appendChild(parent);
    expect(getScrollParent(child)).toBeNull();
  });
});
