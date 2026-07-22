import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLocalStorageAdapter,
  createMemoryAdapter,
} from "./persistence";

describe("createMemoryAdapter", () => {
  it("stores, reads and removes values", () => {
    const adapter = createMemoryAdapter();
    expect(adapter.get("k")).toBeNull();
    adapter.set("k", "v");
    expect(adapter.get("k")).toBe("v");
    adapter.remove("k");
    expect(adapter.get("k")).toBeNull();
  });
});

describe("createLocalStorageAdapter", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("delegates to window.localStorage", () => {
    const adapter = createLocalStorageAdapter();
    adapter.set("k", "v");
    expect(window.localStorage.getItem("k")).toBe("v");
    expect(adapter.get("k")).toBe("v");
    adapter.remove("k");
    expect(adapter.get("k")).toBeNull();
  });

  it("degrades gracefully when reads throw", () => {
    const adapter = createLocalStorageAdapter();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(adapter.get("k")).toBeNull();
  });

  it("degrades gracefully when writes throw", () => {
    const adapter = createLocalStorageAdapter();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => adapter.set("k", "v")).not.toThrow();
  });

  it("degrades gracefully when removes throw", () => {
    const adapter = createLocalStorageAdapter();
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => adapter.remove("k")).not.toThrow();
  });
});

describe("createLocalStorageAdapter — SSR (no window)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("becomes a no-op when there is no window", async () => {
    vi.resetModules();
    vi.stubGlobal("window", undefined);
    const mod = await import("./persistence");
    const adapter = mod.createLocalStorageAdapter();
    expect(adapter.get("k")).toBeNull();
    expect(() => adapter.set("k", "v")).not.toThrow();
    expect(() => adapter.remove("k")).not.toThrow();
  });
});
