import { useEffect } from "react";
import type { TutorialStore } from "../core/store";
import { isBrowser } from "../utils/ssr";

const ATTR = "data-tutorial-id";

/** A root the scan can observe: the document, an element, or a shadow root. */
export type ScanRoot = Document | ShadowRoot | HTMLElement;

/**
 * Opt-in scan mode: register any element carrying `data-tutorial-id` as a
 * tutorial target, and keep the registry in sync via a MutationObserver. This
 * lets arbitrary (even third-party) elements become targets without a wrapper,
 * at the cost of an observer. Prefer `<TutorialTarget>` / `useTutorialTarget`
 * when you control the element.
 *
 * Pass `root` to scan a subtree or a shadow root instead of `document.body`
 * (e.g. a micro-frontend mounted inside a shadow DOM, which the default
 * document-level scan cannot see into).
 */
export function useAttributeScan(
  store: TutorialStore,
  enabled: boolean,
  root?: ScanRoot | null
): void {
  useEffect(() => {
    if (!enabled || !isBrowser) return;
    const scanRoot: ScanRoot = root ?? document.body;

    const toggle = (id: string, el: HTMLElement, register: boolean) => {
      if (register) store.registry.register(id, el);
      else store.registry.unregister(id);
    };

    const scanContainer = (container: ParentNode, register: boolean) => {
      container.querySelectorAll<HTMLElement>(`[${ATTR}]`).forEach((el) => {
        const id = el.getAttribute(ATTR);
        if (id) toggle(id, el, register);
      });
    };

    const apply = (node: Node, register: boolean) => {
      if (!(node instanceof HTMLElement)) return;
      const own = node.getAttribute(ATTR);
      if (own) toggle(own, node, register);
      scanContainer(node, register);
    };

    // Initial sweep: the root's own attribute (if it is an element) + descendants.
    if (scanRoot instanceof HTMLElement) {
      const own = scanRoot.getAttribute(ATTR);
      if (own) toggle(own, scanRoot, true);
    }
    scanContainer(scanRoot, true);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((n) => apply(n, true));
        mutation.removedNodes.forEach((n) => apply(n, false));
      }
    });
    observer.observe(scanRoot, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [store, enabled, root]);
}
