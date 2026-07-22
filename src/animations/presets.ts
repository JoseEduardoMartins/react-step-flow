import type { CSSProperties } from "react";

/** Built-in tooltip entrance animations. */
export type TooltipAnimation = "fade" | "scale" | "slide" | "none";

interface AnimationFrames {
  from: CSSProperties;
  to: CSSProperties;
}

const FRAMES: Record<TooltipAnimation, AnimationFrames> = {
  none: { from: {}, to: {} },
  fade: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  scale: {
    from: { opacity: 0, transform: "scale(0.96)" },
    to: { opacity: 1, transform: "scale(1)" },
  },
  slide: {
    from: { opacity: 0, transform: "translateY(6px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
};

/**
 * Compute the inline style for a tooltip entrance animation given whether it
 * has mounted yet. Consumers/tooltips flip `entered` from false to true on
 * mount to trigger the CSS transition.
 */
export function getTooltipAnimationStyle(
  animation: TooltipAnimation,
  entered: boolean,
  durationMs: number
): CSSProperties {
  if (animation === "none" || durationMs <= 0) return {};
  const frames = FRAMES[animation];
  return {
    transition: `opacity ${durationMs}ms ease, transform ${durationMs}ms ease`,
    ...(entered ? frames.to : frames.from),
  };
}
