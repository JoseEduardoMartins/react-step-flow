import { describe, expect, it, vi } from "vitest";
import { ElementRegistry } from "./registry";

function el(): HTMLElement {
  return document.createElement("div");
}

describe("ElementRegistry", () => {
  it("registers and retrieves an element by id", () => {
    const registry = new ElementRegistry();
    const node = el();
    registry.register("save", node);
    expect(registry.get("save")).toBe(node);
    expect(registry.has("save")).toBe(true);
    expect(registry.size).toBe(1);
  });

  it("returns null for an unknown id", () => {
    const registry = new ElementRegistry();
    expect(registry.get("missing")).toBeNull();
    expect(registry.has("missing")).toBe(false);
  });

  it("unregisters an element", () => {
    const registry = new ElementRegistry();
    const node = el();
    registry.register("save", node);
    registry.unregister("save");
    expect(registry.get("save")).toBeNull();
    expect(registry.size).toBe(0);
  });

  it("no-ops when unregistering an unknown id", () => {
    const registry = new ElementRegistry();
    expect(() => registry.unregister("nope")).not.toThrow();
  });

  it("provides the reverse element -> id lookup", () => {
    const registry = new ElementRegistry();
    const node = el();
    registry.register("save", node);
    expect(registry.idFor(node)).toBe("save");
  });

  it("clears the reverse mapping on unregister", () => {
    const registry = new ElementRegistry();
    const node = el();
    registry.register("save", node);
    registry.unregister("save");
    expect(registry.idFor(node)).toBeUndefined();
  });

  it("replaces the element when the same id is re-registered", () => {
    const registry = new ElementRegistry();
    const a = el();
    const b = el();
    registry.register("save", a);
    registry.register("save", b);
    expect(registry.get("save")).toBe(b);
    expect(registry.size).toBe(1);
  });

  it("is a no-op when re-registering the identical element", () => {
    const registry = new ElementRegistry();
    const node = el();
    const listener = vi.fn();
    registry.register("save", node);
    registry.subscribe(listener);
    registry.register("save", node);
    expect(listener).not.toHaveBeenCalled();
  });

  it("notifies subscribers on register and unregister", () => {
    const registry = new ElementRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    registry.register("save", el());
    registry.unregister("save");
    expect(listener).toHaveBeenNthCalledWith(1, "save");
    expect(listener).toHaveBeenNthCalledWith(2, "save");
  });

  it("clear() drops all elements and subscribers", () => {
    const registry = new ElementRegistry();
    const listener = vi.fn();
    const node = el();
    registry.register("a", node);
    registry.register("b", el());
    registry.subscribe(listener);
    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.get("a")).toBeNull();
    expect(registry.idFor(node)).toBeUndefined();
    registry.register("c", el());
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const registry = new ElementRegistry();
    const listener = vi.fn();
    const off = registry.subscribe(listener);
    off();
    registry.register("save", el());
    expect(listener).not.toHaveBeenCalled();
  });

  it("keeps the reverse mapping intact when the id was reassigned to another element", () => {
    const registry = new ElementRegistry();
    const a = el();
    const b = el();
    registry.register("x", a);
    registry.register("x", b); // a is no longer the current "x"
    registry.unregister("x"); // removes b and its reverse entry; a's stale entry stays until GC
    expect(registry.idFor(a)).toBe("x");
    expect(registry.idFor(b)).toBeUndefined();
  });
});
