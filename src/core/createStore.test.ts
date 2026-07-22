import { afterEach, describe, expect, it, vi } from "vitest";
import { createStore } from "./createStore";
import { createMemoryAdapter } from "./persistence";
import { TutorialStore } from "./store";
import type { Tutorial } from "../types";

const flow: Tutorial = {
  id: "f",
  steps: [{ target: "t", title: "x", description: "" }],
};

describe("createStore", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns a TutorialStore with default in-memory persistence", () => {
    const store = createStore();
    expect(store).toBeInstanceOf(TutorialStore);
    store.register(flow, { persist: true });
    store.start("f");
    store.finish();
    expect(window.localStorage.length).toBe(0);
  });

  it("uses localStorage when persistence is true", () => {
    const store = createStore({ persistence: true, namespace: "app" });
    store.register(flow, { persist: true });
    store.start("f");
    store.finish();
    expect(window.localStorage.getItem("app:f")).not.toBeNull();
  });

  it("accepts a custom adapter", () => {
    const adapter = createMemoryAdapter();
    const store = createStore({ persistence: adapter });
    store.register(flow, { persist: true });
    store.start("f");
    store.finish();
    expect(adapter.get("rsf:f")).not.toBeNull();
  });

  it("treats persistence:false as in-memory", () => {
    const store = createStore({ persistence: false });
    store.register(flow, { persist: true });
    store.start("f");
    store.finish();
    expect(window.localStorage.length).toBe(0);
  });
});
