import { useLayoutEffect, useState } from "react";
import { getRect, rectsEqual, type Rect } from "../utils/rect";

/**
 * Track an element's viewport rect live. Re-measures on resize, scroll (any
 * ancestor, via capture) and element size changes (ResizeObserver), coalescing
 * bursts into a single measurement per animation frame. Returns null when there
 * is no element.
 */
export function useElementRect(element: HTMLElement | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(() =>
    element ? getRect(element) : null
  );

  useLayoutEffect(() => {
    if (!element) {
      setRect(null);
      return;
    }

    let frame = 0;
    const measure = () => {
      const next = getRect(element);
      setRect((prev) => (rectsEqual(prev, next) ? prev : next));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    measure();

    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [element]);

  return rect;
}
