import { describe, expect, it } from "vitest";
import { resolveConfig } from "./ConfigContext";
import { Overlay } from "../components/Overlay";

describe("resolveConfig", () => {
  it("provides sensible defaults", () => {
    const c = resolveConfig();
    expect(c.zIndex).toBe(10000);
    expect(c.offset).toBe(12);
    expect(c.spotlightPadding).toBe(8);
    expect(c.overlayOpacity).toBe(0.5);
    expect(c.closeOnEsc).toBe(true);
    expect(c.closeOnOverlayClick).toBe(false);
    expect(c.labels).toEqual({
      next: "Next",
      previous: "Back",
      finish: "Done",
      skip: "Skip",
    });
    expect(c.targetNotFound).toBe("center");
    expect(c.slots.Overlay).toBe(Overlay);
  });

  it("merges overrides over defaults", () => {
    const c = resolveConfig({
      zIndex: 42,
      overlayColor: "#123456",
      labels: { next: "Siguiente" },
      closeOnOverlayClick: true,
    });
    expect(c.zIndex).toBe(42);
    expect(c.overlayColor).toBe("#123456");
    expect(c.labels.next).toBe("Siguiente");
    expect(c.labels.previous).toBe("Back");
    expect(c.closeOnOverlayClick).toBe(true);
  });

  it("allows swapping a slot component", () => {
    const Custom = () => null;
    const c = resolveConfig({ components: { Tooltip: Custom } });
    expect(c.slots.Tooltip).toBe(Custom);
    expect(c.slots.Overlay).toBe(Overlay);
  });
});
