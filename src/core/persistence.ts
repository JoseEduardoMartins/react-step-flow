import { isBrowser } from "../utils/ssr";
import { warn } from "../utils/warn";

/**
 * Storage backend for persisting flow-completion state. Deliberately a tiny
 * string get/set/remove interface so it is trivial to swap (localStorage,
 * in-memory for tests/SSR, or a custom remote adapter).
 */
export interface PersistenceAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** In-memory adapter used for tests and SSR. */
export function createMemoryAdapter(): PersistenceAdapter {
  const map = new Map<string, string>();
  return {
    get: (key) => map.get(key) ?? null,
    set: (key, value) => {
      map.set(key, value);
    },
    remove: (key) => {
      map.delete(key);
    },
  };
}

/**
 * localStorage-backed adapter. Every access is guarded so private-mode /
 * quota / SSR failures degrade gracefully to a no-op rather than throwing.
 */
export function createLocalStorageAdapter(): PersistenceAdapter {
  return {
    get: (key) => {
      if (!isBrowser) return null;
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        warn(`localStorage read failed: ${String(error)}`);
        return null;
      }
    },
    set: (key, value) => {
      if (!isBrowser) return;
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        warn(`localStorage write failed: ${String(error)}`);
      }
    },
    remove: (key) => {
      if (!isBrowser) return;
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        warn(`localStorage remove failed: ${String(error)}`);
      }
    },
  };
}
