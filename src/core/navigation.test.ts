import { describe, expect, it } from "vitest";
import {
  clampIndex,
  isFirstStep,
  isLastStep,
  resolveStepIndex,
  stepAt,
} from "./navigation";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [
    { id: "a", target: "t1", title: "1", description: "" },
    { target: "t2", title: "2", description: "" },
    { id: "c", target: "t3", title: "3", description: "" },
  ],
};

const empty: Tutorial = { id: "e", steps: [] };

describe("clampIndex", () => {
  it("returns -1 for an empty flow", () => {
    expect(clampIndex(empty, 0)).toBe(-1);
  });
  it("clamps below range to 0", () => {
    expect(clampIndex(flow, -5)).toBe(0);
  });
  it("clamps above range to the last index", () => {
    expect(clampIndex(flow, 99)).toBe(2);
  });
  it("returns an in-range index unchanged", () => {
    expect(clampIndex(flow, 1)).toBe(1);
  });
});

describe("resolveStepIndex", () => {
  it("resolves a valid numeric index", () => {
    expect(resolveStepIndex(flow, 2)).toBe(2);
  });
  it("rejects an out-of-range numeric index", () => {
    expect(resolveStepIndex(flow, 5)).toBe(-1);
    expect(resolveStepIndex(flow, -1)).toBe(-1);
  });
  it("rejects a non-integer index", () => {
    expect(resolveStepIndex(flow, 1.5)).toBe(-1);
  });
  it("resolves a step by id", () => {
    expect(resolveStepIndex(flow, "c")).toBe(2);
  });
  it("returns -1 for an unknown id", () => {
    expect(resolveStepIndex(flow, "zzz")).toBe(-1);
  });
});

describe("isLastStep / isFirstStep", () => {
  it("detects the last step", () => {
    expect(isLastStep(flow, 2)).toBe(true);
    expect(isLastStep(flow, 1)).toBe(false);
  });
  it("detects the first step", () => {
    expect(isFirstStep(0)).toBe(true);
    expect(isFirstStep(1)).toBe(false);
  });
});

describe("stepAt", () => {
  it("returns the step at an index", () => {
    expect(stepAt(flow, 0)?.title).toBe("1");
  });
  it("returns null for an out-of-range index", () => {
    expect(stepAt(flow, 9)).toBeNull();
  });
});
