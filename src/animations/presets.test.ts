import { describe, expect, it } from "vitest";
import { getTooltipAnimationStyle } from "./presets";

describe("getTooltipAnimationStyle", () => {
  it("returns an empty object for 'none'", () => {
    expect(getTooltipAnimationStyle("none", true, 200)).toEqual({});
  });

  it("returns an empty object for zero duration", () => {
    expect(getTooltipAnimationStyle("fade", true, 0)).toEqual({});
  });

  it("returns the 'from' frame before entering", () => {
    const style = getTooltipAnimationStyle("fade", false, 200);
    expect(style.opacity).toBe(0);
    expect(style.transition).toContain("opacity 200ms");
  });

  it("returns the 'to' frame after entering", () => {
    const style = getTooltipAnimationStyle("scale", true, 200);
    expect(style.opacity).toBe(1);
    expect(style.transform).toBe("scale(1)");
  });

  it("supports the slide preset", () => {
    const from = getTooltipAnimationStyle("slide", false, 150);
    const to = getTooltipAnimationStyle("slide", true, 150);
    expect(from.transform).toBe("translateY(6px)");
    expect(to.transform).toBe("translateY(0)");
  });
});
