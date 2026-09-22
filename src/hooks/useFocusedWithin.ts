import { useEffect, useState } from "react";

/**
 * Track the element inside `host` that currently holds focus, or `null` when
 * focus is on `host` itself, outside it, or the trap is inactive.
 *
 * Used for interactive steps so the spotlight can follow the focused control as
 * Tab walks through the highlighted element (e.g. the fields of a drawer),
 * falling back to the whole element when focus rests on the tooltip.
 *
 * Listens to `focusin` only (not `focusout`): focus always lands on some element
 * inside the trap, so the follow target updates atomically without flickering to
 * `null` between two fields.
 */
export function useFocusedWithin(
  host: HTMLElement | null,
  active: boolean
): HTMLElement | null {
  const [focused, setFocused] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!active || !host) {
      setFocused(null);
      return;
    }

    const update = () => {
      const el = document.activeElement as HTMLElement | null;
      setFocused(el && el !== host && host.contains(el) ? el : null);
    };

    update();
    document.addEventListener("focusin", update, true);
    return () => document.removeEventListener("focusin", update, true);
  }, [host, active]);

  return focused;
}
