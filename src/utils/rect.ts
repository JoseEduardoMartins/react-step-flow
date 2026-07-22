/** A plain, serializable rectangle in viewport coordinates. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
}

/** Read an element's bounding box as a plain {@link Rect}. */
export function getRect(element: HTMLElement): Rect {
  const r = element.getBoundingClientRect();
  return {
    x: r.x,
    y: r.y,
    width: r.width,
    height: r.height,
    top: r.top,
    left: r.left,
    right: r.right,
    bottom: r.bottom,
  };
}

/** Grow a rect outward by `padding` on every side. */
export function expandRect(rect: Rect, padding: number): Rect {
  return {
    x: rect.x - padding,
    y: rect.y - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
    top: rect.top - padding,
    left: rect.left - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
  };
}

/** Structural equality on the geometry that matters for rendering. */
export function rectsEqual(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height
  );
}
