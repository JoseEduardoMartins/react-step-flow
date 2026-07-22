import { useEffect } from "react";
import { isElementInViewport } from "../utils/isVisible";

/** Options for {@link useScrollIntoView}. */
export interface UseScrollIntoViewOptions {
  behavior?: ScrollBehavior;
  /** Skip scrolling entirely (e.g. centered steps). */
  enabled?: boolean;
  /** Viewport margin (px) below which the element is considered off-screen. */
  margin?: number;
}

/**
 * Scroll a step's target element into view when it changes, but only if it is
 * not already visible. Uses `scrollIntoView` which handles nested scroll
 * containers in modern browsers.
 */
export function useScrollIntoView(
  element: HTMLElement | null,
  { behavior = "smooth", enabled = true, margin = 0 }: UseScrollIntoViewOptions = {}
): void {
  useEffect(() => {
    if (!element || !enabled) return;
    if (isElementInViewport(element, margin)) return;
    element.scrollIntoView({ behavior, block: "center", inline: "center" });
  }, [element, enabled, behavior, margin]);
}
