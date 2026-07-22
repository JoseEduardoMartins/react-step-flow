import type { CSSProperties, ComponentType, ReactNode, Ref } from "react";
import type { Placement, Progress, Step } from "../types";
import type { Rect } from "../utils/rect";
import type { TooltipAnimation } from "../animations/presets";

/** Resolved button/skip labels for the current step. */
export interface StepLabels {
  next: string;
  previous: string;
  finish: string;
  skip: string;
}

/** Props supplied to the Overlay slot (the darkened backdrop). */
export interface OverlayProps {
  color: string;
  opacity: number;
  zIndex: number;
  /** Invoked when the backdrop is clicked (only when close-on-overlay-click is on). */
  onClick?: () => void;
}

/** Props supplied to the Spotlight slot (the cut-out around the target). */
export interface SpotlightProps {
  /** Target rectangle in viewport coords, already padded. Null for centered steps. */
  rect: Rect | null;
  radius: number;
  color: string;
  opacity: number;
  zIndex: number;
  /** Whether the highlighted element should remain clickable. */
  interactable: boolean;
  /** Duration (ms) of the cut-out glide between steps. 0 disables it. */
  transitionMs?: number;
  onOverlayClick?: () => void;
}

/** Positioning props the portal hands to the Tooltip slot. */
export interface TooltipFloating {
  setFloating: Ref<HTMLElement>;
  floatingStyles: CSSProperties;
  placement: Placement | string;
  setArrow: Ref<HTMLElement>;
  arrowStyles: CSSProperties;
}

/** Props supplied to the Tooltip slot. */
export interface TooltipProps {
  step: Step;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  progress: Progress;
  labels: StepLabels;
  zIndex: number;
  /** Entrance animation for the tooltip. */
  animation: TooltipAnimation;
  /** Entrance animation duration (ms). */
  animationMs: number;
  next: () => void;
  previous: () => void;
  finish: () => void;
  cancel: () => void;
  goTo: (ref: number | string) => void;
  floating: TooltipFloating;
}

/** The set of swappable presentation components. */
export interface Slots {
  Overlay: ComponentType<OverlayProps>;
  Spotlight: ComponentType<SpotlightProps>;
  Tooltip: ComponentType<TooltipProps>;
}

/** User-provided partial overrides for the slots. */
export type SlotOverrides = Partial<Slots>;

/** Render children only in the browser (portal container safety). */
export type MaybeChildren = ReactNode;
