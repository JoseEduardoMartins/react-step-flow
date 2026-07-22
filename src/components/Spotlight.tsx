import { useId } from "react";
import type { CSSProperties } from "react";
import type { SpotlightProps } from "./slots";
import { spotlightTransitionStyle } from "../animations/spotlightTransition";

/**
 * Default spotlight: a full-screen darkened layer with a rounded-rectangle
 * cut-out around the target, drawn with an SVG mask (white = visible dark,
 * black = transparent hole). Falls back to a plain dark layer when `rect` is
 * null. The `rect` is expected to already include any padding.
 */
export function Spotlight({
  rect,
  radius,
  color,
  opacity,
  zIndex,
  interactable,
  transitionMs = 0,
  onOverlayClick,
}: SpotlightProps) {
  const maskId = useId();
  const holeStyle = spotlightTransitionStyle(transitionMs);

  const svgStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex,
    // When interactable, let clicks pass through the whole layer (including the
    // hole) to the page beneath; otherwise the layer catches outside clicks.
    pointerEvents: interactable ? "none" : "auto",
  };

  return (
    <svg
      className="rsf-spotlight"
      data-rsf-spotlight=""
      style={svgStyle}
      onClick={interactable ? undefined : onOverlayClick}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect x={0} y={0} width="100%" height="100%" fill="white" />
          {rect ? (
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={radius}
              ry={radius}
              fill="black"
              style={holeStyle}
            />
          ) : null}
        </mask>
      </defs>
      <rect
        x={0}
        y={0}
        width="100%"
        height="100%"
        fill={color}
        fillOpacity={opacity}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
