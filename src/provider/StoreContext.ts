import { createContext } from "react";
import type { TutorialStore } from "../core/store";

/**
 * Carries the single {@link TutorialStore} instance. The value is the store
 * instance itself (stable identity), never state — so consuming the context
 * alone triggers no re-renders. Re-rendering is driven purely by the
 * useSyncExternalStore subscriptions inside the hooks.
 */
export const StoreContext = createContext<TutorialStore | null>(null);
