import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * While active, mark every sibling of `skipRef` inside `container` as `inert`
 * and `aria-hidden`, so a modal (non-interactive) tour step genuinely takes the
 * rest of the page out of reach for pointer, keyboard and assistive technology
 * — complementing the tooltip's `aria-modal`. The previous state is restored on
 * teardown, and elements already inert are left untouched.
 *
 * Intentionally left off by default (opt in via the provider's `inertBackground`
 * prop) and never applied to interactive steps, where the user must be able to
 * reach the highlighted element.
 */
export function useInertBackground(
  skipRef: RefObject<HTMLElement | null>,
  container: HTMLElement | null,
  active: boolean
): void {
  useEffect(() => {
    if (!active || !container) return;
    const skip = skipRef.current;
    const changed: HTMLElement[] = [];
    for (const child of Array.from(container.children)) {
      if (child === skip || !(child instanceof HTMLElement)) continue;
      if (child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      child.setAttribute("aria-hidden", "true");
      changed.push(child);
    }
    return () => {
      for (const child of changed) {
        child.removeAttribute("inert");
        child.removeAttribute("aria-hidden");
      }
    };
  }, [active, container, skipRef]);
}
