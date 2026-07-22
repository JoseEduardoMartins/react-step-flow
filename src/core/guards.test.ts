import { describe, expect, it, vi } from "vitest";
import { validateFlow } from "./guards";
import type { Tutorial } from "../types";

describe("validateFlow", () => {
  it("accepts a valid flow", () => {
    const flow: Tutorial = {
      id: "f",
      steps: [{ target: "t", title: "x", description: "" }],
    };
    expect(validateFlow(flow)).toBe(true);
  });

  it("rejects a flow without an id", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(validateFlow({ id: "", steps: [] } as Tutorial)).toBe(false);
    warnSpy.mockRestore();
  });

  it("rejects a flow with no steps", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(validateFlow({ id: "f", steps: [] })).toBe(false);
    warnSpy.mockRestore();
  });

  it("rejects a nullish flow", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(validateFlow(undefined as unknown as Tutorial)).toBe(false);
    warnSpy.mockRestore();
  });
});
