import { useContext } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import { StoreContext } from "../provider/StoreContext";
import type { TutorialStore } from "../core/store";
import type { TutorialState } from "../types";

/** Access the current {@link TutorialStore}. Throws outside a provider. */
export function useTutorialStore(): TutorialStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error(
      "react-step-flow: hooks and components must be used within <TutorialProvider>."
    );
  }
  return store;
}

/**
 * Subscribe to a narrow slice of store state. The component re-renders only
 * when the selected value changes (per `isEqual`, default `Object.is`).
 */
export function useStoreSelector<T>(
  selector: (state: TutorialState) => T,
  isEqual?: (a: T, b: T) => boolean
): T {
  const store = useTutorialStore();
  return useSyncExternalStoreWithSelector(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
    selector,
    isEqual
  );
}
