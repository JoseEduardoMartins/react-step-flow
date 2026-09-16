import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFloatingStep } from "./useFloatingStep";

// Capture the config handed to Floating UI's `useFloating` so we can assert how
// `whileElementsMounted` is wired. `vi.hoisted` keeps the shared state available
// inside the hoisted `vi.mock` factory.
const { autoUpdateSpy, getConfig, setConfig } = vi.hoisted(() => {
  let config: { whileElementsMounted?: unknown; placement?: string } | null = null;
  return {
    autoUpdateSpy: vi.fn(() => () => {}),
    getConfig: () => config,
    setConfig: (c: typeof config) => {
      config = c;
    },
  };
});

vi.mock("@floating-ui/react", () => ({
  useFloating: (cfg: { placement: string }) => {
    setConfig(cfg);
    return {
      refs: { setReference: () => {}, setFloating: () => {} },
      floatingStyles: {},
      placement: cfg.placement,
      middlewareData: {},
      update: () => {},
    };
  },
  autoUpdate: autoUpdateSpy,
  offset: () => ({}),
  flip: () => ({}),
  shift: () => ({}),
  limitShift: () => ({}),
  arrow: () => ({}),
}));

describe("useFloatingStep", () => {
  it("wires autoUpdate with animationFrame so the tooltip follows animated anchors", () => {
    const el = document.createElement("div");
    renderHook(() => useFloatingStep({ target: el, placement: "left" }));

    const cfg = getConfig();
    expect(cfg?.whileElementsMounted).toBeTypeOf("function");

    // Invoking the wrapper must delegate to autoUpdate with `animationFrame: true`
    // — the whole point of the fix. Without it, CSS transforms are not tracked.
    const reference = {} as never;
    const floatingEl = {} as never;
    const update = vi.fn();
    (cfg!.whileElementsMounted as (r: unknown, f: unknown, u: unknown) => void)(
      reference,
      floatingEl,
      update
    );

    expect(autoUpdateSpy).toHaveBeenCalledWith(reference, floatingEl, update, {
      animationFrame: true,
    });
  });
});
