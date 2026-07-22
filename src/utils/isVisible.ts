/**
 * Whether an element is (at least partially) within the viewport, optionally
 * expanded by `margin` px on each side. Used to decide whether a step's target
 * needs to be scrolled into view.
 */
export function isElementInViewport(element: HTMLElement, margin = 0): boolean {
  const r = element.getBoundingClientRect();
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  return (
    r.bottom >= -margin &&
    r.right >= -margin &&
    r.top <= vh + margin &&
    r.left <= vw + margin
  );
}
