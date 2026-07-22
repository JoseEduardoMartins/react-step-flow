import { describe, expect, it } from "vitest";
import { spotlightTransitionStyle } from "./spotlightTransition";

describe("spotlightTransitionStyle", () => {
  it("returns an empty object for non-positive durations", () => {
    expect(spotlightTransitionStyle(0)).toEqual({});
    expect(spotlightTransitionStyle(-10)).toEqual({});
  });

  it("builds a transition covering the geometry properties", () => {
    const style = spotlightTransitionStyle(250);
    expect(style.transition).toContain("x 250ms");
    expect(style.transition).toContain("y 250ms");
    expect(style.transition).toContain("width 250ms");
    expect(style.transition).toContain("height 250ms");
  });
});
