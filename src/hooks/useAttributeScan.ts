import { useEffect } from "react";
import type { TutorialStore } from "../core/store";
import { isBrowser } from "../utils/ssr";

const ATTR = "data-tutorial-id";

/**
 * Opt-in scan mode: register any element carrying `data-tutorial-id` as a
 * tutorial target, and keep the registry in sync via a MutationObserver. This
 * lets arbitrary (even third-party) elements become targets without a wrapper,
 * at the cost of an observer. Prefer `<TutorialTarget>` / `useTutorialTarget`
 * when you control the element.
 */
export function useAttributeScan(store: TutorialStore, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isBrowser) return;

    const toggle = (id: string, el: HTMLElement, register: boolean) => {
      if (register) store.registry.register(id, el);
      else store.registry.unregister(id);
    };

    const apply = (node: Node, register: boolean) => {
      if (!(node instanceof HTMLElement)) return;
      const own = node.getAttribute(ATTR);
      if (own) toggle(own, node, register);
      node.querySelectorAll<HTMLElement>(`[${ATTR}]`).forEach((el) => {
        const id = el.getAttribute(ATTR);
        if (id) toggle(id, el, register);
      });
    };

    apply(document.body, true);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((n) => apply(n, true));
        mutation.removedNodes.forEach((n) => apply(n, false));
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [store, enabled]);
}
