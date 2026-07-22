import { useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { createStore } from "../core/createStore";
import type { TutorialStore } from "../core/store";
import type { PersistenceAdapter } from "../core/persistence";
import { TutorialPortal } from "../components/TutorialPortal";
import { useAttributeScan } from "../hooks/useAttributeScan";
import { StoreContext } from "./StoreContext";
import { ConfigContext, resolveConfig, type TutorialConfig } from "./ConfigContext";

/** Props for {@link TutorialProvider}. */
export interface TutorialProviderProps extends TutorialConfig {
  children: ReactNode;
  /** Provide a pre-built store (e.g. shared across a micro-frontend). */
  store?: TutorialStore;
  /** Persistence backend: `true` for localStorage, or a custom adapter. */
  persistence?: boolean | PersistenceAdapter;
  /** Namespace prefixed to persistence keys. Defaults to `"rsf"`. */
  namespace?: string;
  /**
   * Opt into scanning the DOM for `data-tutorial-id` attributes and registering
   * those elements automatically (via a MutationObserver).
   */
  scanAttributes?: boolean;
}

/**
 * Root provider. Creates (or accepts) a single {@link TutorialStore} instance
 * held for the lifetime of the tree, exposes a stable resolved config, and
 * mounts the global {@link TutorialPortal}.
 */
export function TutorialProvider({
  children,
  store,
  persistence,
  namespace,
  scanAttributes = false,
  ...config
}: TutorialProviderProps) {
  const ref = useRef<TutorialStore | null>(null);
  if (!ref.current) {
    ref.current = store ?? createStore({ persistence, namespace });
  }
  useAttributeScan(ref.current, scanAttributes);

  // Resolve config once per meaningful change. Component slot identities and
  // primitives are stable across renders in the common case.
  const resolved = useMemo(
    () => resolveConfig(config),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      config.zIndex,
      config.offset,
      config.spotlightPadding,
      config.spotlightRadius,
      config.overlayColor,
      config.overlayOpacity,
      config.scrollBehavior,
      config.closeOnEsc,
      config.closeOnOverlayClick,
      config.targetNotFound,
      config.theme,
      config.portalContainer,
      config.components,
      config.labels,
    ]
  );

  return (
    <StoreContext.Provider value={ref.current}>
      <ConfigContext.Provider value={resolved}>
        {children}
        <TutorialPortal />
      </ConfigContext.Provider>
    </StoreContext.Provider>
  );
}
