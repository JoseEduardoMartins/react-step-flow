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

  it("rejects a flow with a malformed step", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const flow = {
      id: "f",
      steps: [{ target: 123, title: "x", description: "" }],
    } as unknown as Tutorial;
    expect(validateFlow(flow)).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("malformed"));
    warnSpy.mockRestore();
  });

  it("accepts a centered step with an empty target", () => {
    const flow: Tutorial = {
      id: "f",
      steps: [{ target: "", title: "Welcome", description: "" }],
    };
    expect(validateFlow(flow)).toBe(true);
  });

  it("warns but accepts a flow with duplicate step ids", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const flow: Tutorial = {
      id: "f",
      steps: [
        { id: "dup", target: "a", title: "A", description: "" },
        { id: "dup", target: "b", title: "B", description: "" },
      ],
    };
    expect(validateFlow(flow)).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('duplicate step id "dup"')
    );
    warnSpy.mockRestore();
  });
});
