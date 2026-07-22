import { createLocalStorageAdapter, type PersistenceAdapter } from "./persistence";
import { StoreConfig, TutorialStore } from "./store";

/** Options accepted by {@link createStore}. */
export interface CreateStoreOptions extends Omit<StoreConfig, "persistence"> {
  /**
   * Persistence backend. Pass `true` to use `localStorage`, `false`/omit for the
   * default in-memory adapter, or a custom {@link PersistenceAdapter}.
   */
  persistence?: boolean | PersistenceAdapter;
}

/**
 * Factory for a {@link TutorialStore}. This is the single entry point the React
 * provider and non-React consumers use to obtain an engine instance.
 */
export function createStore(options: CreateStoreOptions = {}): TutorialStore {
  const { persistence, ...rest } = options;
  let adapter: PersistenceAdapter | undefined;
  if (persistence === true) {
    adapter = createLocalStorageAdapter();
  } else if (typeof persistence === "object") {
    adapter = persistence;
  }

  return new TutorialStore({
    ...rest,
    ...(adapter ? { persistence: adapter } : {}),
  });
}
