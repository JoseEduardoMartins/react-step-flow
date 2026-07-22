import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { mergeRefs } from "./mergeRefs";

describe("mergeRefs", () => {
  it("assigns the node to ref objects", () => {
    const ref = createRef<HTMLDivElement>();
    const node = document.createElement("div");
    mergeRefs(ref)(node);
    expect(ref.current).toBe(node);
  });

  it("calls function refs with the node", () => {
    const fn = vi.fn();
    const node = document.createElement("div");
    mergeRefs<HTMLDivElement>(fn)(node);
    expect(fn).toHaveBeenCalledWith(node);
  });

  it("ignores null/undefined refs", () => {
    const node = document.createElement("div");
    expect(() => mergeRefs<HTMLDivElement>(null, undefined)(node)).not.toThrow();
  });

  it("runs cleanups: nulls ref objects and re-invokes plain function refs with null", () => {
    const ref = createRef<HTMLDivElement>();
    const fn = vi.fn();
    const node = document.createElement("div");
    const cleanup = mergeRefs<HTMLDivElement>(ref, fn)(node);
    expect(ref.current).toBe(node);
    cleanup?.();
    expect(ref.current).toBeNull();
    expect(fn).toHaveBeenLastCalledWith(null);
  });

  it("uses a function ref's own returned cleanup when provided", () => {
    const ownCleanup = vi.fn();
    const fn = vi.fn(() => ownCleanup);
    const node = document.createElement("div");
    const cleanup = mergeRefs<HTMLDivElement>(fn)(node);
    cleanup?.();
    expect(ownCleanup).toHaveBeenCalledOnce();
  });
});
