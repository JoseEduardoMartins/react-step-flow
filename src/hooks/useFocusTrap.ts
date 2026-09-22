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
  /**
   * A second element whose focusables join the trap (e.g. the highlighted
   * element of an interactive step, such as a non-modal drawer that lives in its
   * own portal). Focus then cycles across the tooltip and this element in
   * document order and still never escapes to the page behind. Initial focus
   * stays on the tooltip. Ignored when `containFocus` is false.
   */
  extraContainer?: HTMLElement | null;
}

function focusableWithin(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hidden && el.getAttribute("aria-hidden") !== "true"
  );
}

/**
 * Focusables of the tooltip container plus an optional extra container, in
 * document order and de-duplicated. Document order (not container order) keeps
 * Tab reading naturally regardless of which portal mounted first.
 */
function collectFocusables(
  container: HTMLElement | null,
  extra: HTMLElement | null | undefined
): HTMLElement[] {
  const items = focusableWithin(container);
  if (!extra) return items;
  const seen = new Set<HTMLElement>(items);
  for (const el of focusableWithin(extra)) {
    if (!seen.has(el)) {
      seen.add(el);
      items.push(el);
    }
  }
  items.sort((a, b) => {
    const pos = a.compareDocumentPosition(b);
    if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
  return items;
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
    extraContainer,
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
      const extra = containFocus ? extraContainer : null;
      const items = collectFocusables(containerRef.current, extra);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const activeEl = document.activeElement as HTMLElement | null;

      // With an extra container the focusables span two disconnected subtrees,
      // so the browser's natural Tab between them would land on the page
      // behind. Fully drive every Tab through the ordered list instead of only
      // wrapping at the boundaries.
      if (extra) {
        const idx = activeEl ? items.indexOf(activeEl) : -1;
        event.preventDefault();
        if (idx === -1) {
          (event.shiftKey ? last : first).focus();
          return;
        }
        const nextIdx = event.shiftKey
          ? (idx - 1 + items.length) % items.length
          : (idx + 1) % items.length;
        items[nextIdx]!.focus();
        return;
      }

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
  }, [active, onEscape, restoreFocus, containerRef, containFocus, extraContainer]);

  // Move focus into the container on activation and whenever focusKey changes.
  useEffect(() => {
    if (!active) return;
    const items = focusableWithin(containerRef.current);
    items[0]?.focus();
  }, [active, focusKey, containerRef]);
}
