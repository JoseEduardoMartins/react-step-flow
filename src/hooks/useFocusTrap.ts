import { useEffect } from "react";
import type { RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/** Options for {@link useFocusTrap}. */
export interface UseFocusTrapOptions {
  /** Whether the trap is active. */
  active: boolean;
  /** Called when Escape is pressed (e.g. to cancel the tour). */
  onEscape?: () => void;
  /** Restore focus to the previously-focused element on teardown. Default true. */
  restoreFocus?: boolean;
  /** Changing this re-moves focus to the first focusable (e.g. on step change). */
  focusKey?: string | number;
  /**
   * Whether Tab/Shift+Tab are confined to the container. Default true. Set false
   * for interactive steps so keyboard focus can reach the highlighted element
   * outside the tooltip; Escape and initial focus still apply.
   */
  containFocus?: boolean;
}

function focusableWithin(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hidden && el.getAttribute("aria-hidden") !== "true"
  );
}

/**
 * Trap keyboard focus within a container while active: contains Tab/Shift+Tab,
 * routes Escape to `onEscape`, moves focus inside on activation and on each
 * `focusKey` change, and restores focus to the trigger on teardown.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  {
    active,
    onEscape,
    restoreFocus = true,
    focusKey,
    containFocus = true,
  }: UseFocusTrapOptions
): void {
  // Set up the key handler and focus restoration for the lifetime of the trap.
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }
      if (!containFocus || event.key !== "Tab") return;
      const items = focusableWithin(containerRef.current);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const activeEl = document.activeElement;
      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      if (restoreFocus && previouslyFocused?.focus) {
        previouslyFocused.focus();
      }
    };
  }, [active, onEscape, restoreFocus, containerRef, containFocus]);

  // Move focus into the container on activation and whenever focusKey changes.
  useEffect(() => {
    if (!active) return;
    const items = focusableWithin(containerRef.current);
    items[0]?.focus();
  }, [active, focusKey, containerRef]);
}
