import { afterEach, describe, expect, it, vi } from "vitest";
import { warn } from "./warn";

describe("warn", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("logs a prefixed message outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warn("hello");
    expect(spy).toHaveBeenCalledWith("[react-step-flow] hello");
  });

  it("is silent in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    warn("hello");
    expect(spy).not.toHaveBeenCalled();
  });
});
