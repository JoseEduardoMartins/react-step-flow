/**
 * react-step-flow — a modern, headless, type-safe React library for guided
 * tours, walkthroughs and onboarding tutorials.
 */

// Provider
export { TutorialProvider } from "./provider/TutorialProvider";
export type { TutorialProviderProps } from "./provider/TutorialProvider";
export { StoreContext } from "./provider/StoreContext";
export {
  ConfigContext,
  resolveConfig,
} from "./provider/ConfigContext";
export type { TutorialConfig, ResolvedConfig } from "./provider/ConfigContext";

// Hooks
export { useTutorial } from "./hooks/useTutorial";
export type { UseTutorialResult } from "./hooks/useTutorial";
export { useTutorialActions } from "./hooks/useTutorialActions";
export type { UseTutorialActionsResult } from "./hooks/useTutorialActions";
export { useTutorialStep } from "./hooks/useTutorialStep";
export type { UseTutorialStepResult } from "./hooks/useTutorialStep";
export { useTutorialTarget } from "./hooks/useTutorialTarget";
export { useTutorialStore, useStoreSelector } from "./hooks/useStore";

// Hooks (lower-level / DOM)
export { useFloatingStep } from "./hooks/useFloatingStep";
export type { UseFloatingStepParams } from "./hooks/useFloatingStep";
export { useElementRect } from "./hooks/useElementRect";
export { useScrollIntoView } from "./hooks/useScrollIntoView";
export type { UseScrollIntoViewOptions } from "./hooks/useScrollIntoView";
export { useFocusTrap } from "./hooks/useFocusTrap";
export type { UseFocusTrapOptions } from "./hooks/useFocusTrap";
export { useAttributeScan } from "./hooks/useAttributeScan";

// Animations
export { spotlightTransitionStyle } from "./animations/spotlightTransition";
export { getTooltipAnimationStyle } from "./animations/presets";
export type { TooltipAnimation } from "./animations/presets";

// Components
export { TutorialTarget } from "./components/TutorialTarget";
export type { TutorialTargetProps } from "./components/TutorialTarget";
export { TutorialPortal } from "./components/TutorialPortal";
export { TutorialTooltip } from "./components/TutorialTooltip";
export { Overlay } from "./components/Overlay";
export { Spotlight } from "./components/Spotlight";
export type {
  Slots,
  SlotOverrides,
  OverlayProps,
  SpotlightProps,
  TooltipProps,
  TooltipFloating,
  StepLabels,
} from "./components/slots";

// Core (also available from `react-step-flow/core`)
export { TutorialStore } from "./core/store";
export { createStore } from "./core/createStore";
export type { CreateStoreOptions } from "./core/createStore";
export { EventEmitter } from "./core/emitter";
export { ElementRegistry } from "./core/registry";
export {
  createMemoryAdapter,
  createLocalStorageAdapter,
} from "./core/persistence";
export type { PersistenceAdapter } from "./core/persistence";

// Utils
export { mergeRefs } from "./utils/mergeRefs";
export type { PossibleRef } from "./utils/mergeRefs";
export { getRect, expandRect, rectsEqual } from "./utils/rect";
export type { Rect } from "./utils/rect";
export { isElementInViewport } from "./utils/isVisible";
export { getScrollParent } from "./utils/getScrollParent";

// Types
export type * from "./types";

export const VERSION = "0.1.0";
