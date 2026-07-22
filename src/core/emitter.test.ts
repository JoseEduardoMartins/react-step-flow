import { describe, expect, it, vi } from "vitest";
import { EventEmitter } from "./emitter";
import type { EventCtx } from "../types";

const ctx: EventCtx = { flowId: "f", flow: { id: "f", steps: [] } };

describe("EventEmitter", () => {
  it("invokes registered listeners with the payload", () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on("start", listener);
    emitter.emit("start", ctx);
    expect(listener).toHaveBeenCalledWith(ctx);
  });

  it("supports multiple listeners for the same event", () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("finish", a);
    emitter.on("finish", b);
    emitter.emit("finish", ctx);
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it("returns an unsubscribe function from on()", () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    const off = emitter.on("cancel", listener);
    off();
    emitter.emit("cancel", ctx);
    expect(listener).not.toHaveBeenCalled();
  });

  it("removes a listener via off()", () => {
    const emitter = new EventEmitter();
    const listener = vi.fn();
    emitter.on("cancel", listener);
    emitter.off("cancel", listener);
    emitter.emit("cancel", ctx);
    expect(listener).not.toHaveBeenCalled();
  });

  it("does nothing when emitting an event with no listeners", () => {
    const emitter = new EventEmitter();
    expect(() => emitter.emit("start", ctx)).not.toThrow();
  });

  it("isolates a throwing listener from the others", () => {
    const emitter = new EventEmitter();
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    emitter.on("start", bad);
    emitter.on("start", good);
    expect(() => emitter.emit("start", ctx)).not.toThrow();
    expect(good).toHaveBeenCalledOnce();
  });

  it("allows a listener to unsubscribe during emission", () => {
    const emitter = new EventEmitter();
    const off = emitter.on("start", () => off());
    const other = vi.fn();
    emitter.on("start", other);
    emitter.emit("start", ctx);
    emitter.emit("start", ctx);
    expect(other).toHaveBeenCalledTimes(2);
  });

  it("clears listeners for a single event", () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    const b = vi.fn();
    emitter.on("start", a);
    emitter.on("finish", b);
    emitter.clear("start");
    emitter.emit("start", ctx);
    emitter.emit("finish", ctx);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it("clears all listeners", () => {
    const emitter = new EventEmitter();
    const a = vi.fn();
    emitter.on("start", a);
    emitter.clear();
    emitter.emit("start", ctx);
    expect(a).not.toHaveBeenCalled();
  });
});
