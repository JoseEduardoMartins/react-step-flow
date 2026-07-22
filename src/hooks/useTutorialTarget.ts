import { useCallback } from "react";
import type { RefCallback } from "react";
import { useTutorialStore } from "./useStore";

/**
 * Headless registration hook. Returns a ref callback that registers the node
 * under `id` on mount and unregisters it on unmount (via React 19's
 * cleanup-returning ref callback).
 *
 * @example
 * ```tsx
 * <button ref={useTutorialTarget("create-user")}>New user</button>
 * ```
 */
export function useTutorialTarget<T extends HTMLElement = HTMLElement>(
  id: string
): RefCallback<T> {
  const store = useTutorialStore();
  return useCallback(
    (node: T | null) => {
      if (!node) return;
      store.registry.register(id, node);
      return () => store.registry.unregister(id);
    },
    [store, id]
  );
}
