/**
 * Find the nearest scrollable ancestor of an element, or null if the element
 * only scrolls with the document. Used as a fallback for offset-aware scrolling.
 */
export function getScrollParent(element: HTMLElement | null): HTMLElement | null {
  if (!element || typeof window === "undefined") return null;
  let node: HTMLElement | null = element.parentElement;
  while (node) {
    const style = window.getComputedStyle(node);
    const overflow = style.overflow + style.overflowY + style.overflowX;
    if (/(auto|scroll|overlay)/.test(overflow)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}
