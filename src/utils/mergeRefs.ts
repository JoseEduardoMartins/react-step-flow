import type { Ref, RefCallback } from "react";

/** A ref that may be a callback, a ref object, or absent. */
export type PossibleRef<T> = Ref<T> | undefined;

/**
 * Merge several refs into a single ref callback. Compatible with React 19's
 * cleanup-returning ref callbacks: the returned callback collects a cleanup for
 * every ref (a function ref's own returned cleanup, or a null-reset otherwise)
 * and runs them all when React tears the node down.
 */
export function mergeRefs<T>(...refs: PossibleRef<T>[]): RefCallback<T> {
  return (node: T | null) => {
    const cleanups: Array<() => void> = [];
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === "function") {
        const result = ref(node);
        cleanups.push(typeof result === "function" ? result : () => ref(null));
      } else {
        (ref as { current: T | null }).current = node;
        cleanups.push(() => {
          (ref as { current: T | null }).current = null;
        });
      }
    }
    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  };
}
