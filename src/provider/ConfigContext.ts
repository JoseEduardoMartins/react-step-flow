import { createContext } from "react";
import type { StepLabels, Slots, SlotOverrides } from "../components/slots";
import { Overlay } from "../components/Overlay";
import { Spotlight } from "../components/Spotlight";
import { TutorialTooltip } from "../components/TutorialTooltip";
import type { TargetNotFoundMode } from "../types";
import type { TooltipAnimation } from "../animations/presets";

/** Fully-resolved runtime configuration consumed by the portal and slots. */
export interface ResolvedConfig {
  zIndex: number;
  offset: number;
  spotlightPadding: number;
  spotlightRadius: number;
  overlayColor: string;
  overlayOpacity: number;
  scrollBehavior: ScrollBehavior;
  closeOnEsc: boolean;
  closeOnOverlayClick: boolean;
  labels: StepLabels;
  targetNotFound: TargetNotFoundMode;
  theme: string;
  portalContainer: HTMLElement | null;
  slots: Slots;
  /** Duration (ms) of the spotlight cut-out glide between steps. */
  spotlightTransition: number;
  /** Tooltip entrance animation. */
  tooltipAnimation: TooltipAnimation;
  /** Tooltip entrance animation duration (ms). */
  animationDuration: number;
}

/** User-facing configuration accepted by the provider (all optional). */
export interface TutorialConfig {
  zIndex?: number;
  offset?: number;
  spotlightPadding?: number;
  spotlightRadius?: number;
  overlayColor?: string;
  overlayOpacity?: number;
  scrollBehavior?: ScrollBehavior;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  labels?: Partial<StepLabels>;
  targetNotFound?: TargetNotFoundMode;
  theme?: string;
  portalContainer?: HTMLElement | null;
  components?: SlotOverrides;
  spotlightTransition?: number;
  tooltipAnimation?: TooltipAnimation;
  animationDuration?: number;
  /** Disable all animations (spotlight glide + tooltip entrance). */
  disableAnimations?: boolean;
}

const DEFAULT_LABELS: StepLabels = {
  next: "Next",
  previous: "Back",
  finish: "Done",
  skip: "Skip",
};

const DEFAULT_SLOTS: Slots = {
  Overlay,
  Spotlight,
  Tooltip: TutorialTooltip,
};

/** Merge user config over the built-in defaults. */
export function resolveConfig(config: TutorialConfig = {}): ResolvedConfig {
  const animationsOff = config.disableAnimations === true;
  return {
    zIndex: config.zIndex ?? 10000,
    offset: config.offset ?? 12,
    spotlightPadding: config.spotlightPadding ?? 8,
    spotlightRadius: config.spotlightRadius ?? 6,
    overlayColor: config.overlayColor ?? "#000000",
    overlayOpacity: config.overlayOpacity ?? 0.5,
    scrollBehavior: config.scrollBehavior ?? "smooth",
    closeOnEsc: config.closeOnEsc ?? true,
    closeOnOverlayClick: config.closeOnOverlayClick ?? false,
    labels: { ...DEFAULT_LABELS, ...config.labels },
    targetNotFound: config.targetNotFound ?? "center",
    theme: config.theme ?? "light",
    portalContainer: config.portalContainer ?? null,
    slots: { ...DEFAULT_SLOTS, ...config.components },
    spotlightTransition: animationsOff ? 0 : (config.spotlightTransition ?? 300),
    tooltipAnimation: animationsOff ? "none" : (config.tooltipAnimation ?? "fade"),
    animationDuration: animationsOff ? 0 : (config.animationDuration ?? 200),
  };
}

/** Stable per-provider config. Never changes during a run => no global re-renders. */
export const ConfigContext = createContext<ResolvedConfig>(resolveConfig());
