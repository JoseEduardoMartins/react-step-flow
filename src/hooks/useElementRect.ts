import { useLayoutEffect, useState } from "react";
import { getRect, rectsEqual, type Rect } from "../utils/rect";

/**
 * How many consecutive frames the rect must stay unchanged before the rAF poll
 * stops. A short settle window is enough to ride out an enter/exit transition
 * without leaving a permanent animation-frame loop running.
 */
const STABLE_FRAMES = 4;

/**
 * Track an element's viewport rect live. Re-measures on resize, scroll (any
 * ancestor, via capture) and element size changes (ResizeObserver), coalescing
 * bursts into a single measurement per animation frame. Returns null when there
 * is no element.
 *
 * Those observers miss CSS `transform` animations: a translate does not change
 * the border-box, so ResizeObserver stays silent and no scroll/resize fires —
 * the rect would be captured once at the animation's first frame (e.g. a drawer
 * still off-screen) and never corrected. To cover that, a short rAF poll runs on
 * mount and whenever an observed change fires, re-measuring each frame while the
 * rect keeps moving and stopping once it holds still for {@link STABLE_FRAMES}.
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
    let poll = 0;
    let stableFrames = 0;
    let lastPolled: Rect | null = null;

    const measure = () => {
      const next = getRect(element);
      setRect((prev) => (rectsEqual(prev, next) ? prev : next));
    };

    // Follow a moving rect (e.g. a CSS transform) frame by frame, stopping once
    // it settles so the loop doesn't run forever. Re-armed by `schedule` below.
    const tick = () => {
      const next = getRect(element);
      if (lastPolled && rectsEqual(lastPolled, next)) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
        setRect((prev) => (rectsEqual(prev, next) ? prev : next));
      }
      lastPolled = next;
      poll = stableFrames < STABLE_FRAMES ? requestAnimationFrame(tick) : 0;
    };

    const startPolling = () => {
      cancelAnimationFrame(poll);
      stableFrames = 0;
      lastPolled = null;
      poll = requestAnimationFrame(tick);
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
      // An observed change may be the first frame of an animation — start (or
      // restart) the poll so the whole transition is tracked, not just its end.
      startPolling();
    };

    measure();
    // Catch an enter animation that begins on mount (the element mounts already
    // mid-transition, before any observer could fire).
    startPolling();

    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(poll);
      observer.disconnect();
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
    };
  }, [element]);

  return rect;
}
