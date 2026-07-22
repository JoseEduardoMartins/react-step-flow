import type { CSSProperties } from "react";

/**
 * Build the CSS transition applied to the spotlight hole so it glides between
 * steps. SVG geometry properties (x/y/width/height) are CSS-animatable in
 * modern browsers; where unsupported the geometry attributes still position the
 * hole correctly (no animation). Returns an empty object when duration is 0.
 */
export function spotlightTransitionStyle(durationMs: number): CSSProperties {
  if (durationMs <= 0) return {};
  const easing = "cubic-bezier(0.4, 0, 0.2, 1)";
  const props = ["x", "y", "width", "height"];
  return {
    transition: props.map((p) => `${p} ${durationMs}ms ${easing}`).join(", "),
  };
}
