import type { CSSProperties } from "react";
import type { OverlayProps } from "./slots";

/**
 * Default overlay: a plain darkened backdrop. Used for centered (target-less)
 * steps; targeted steps use the {@link Spotlight} which darkens with a cut-out.
 */
export function Overlay({ color, opacity, zIndex, onClick }: OverlayProps) {
  const style: CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: color,
    opacity,
    zIndex,
    cursor: onClick ? "pointer" : "default",
  };
  return (
    <div
      className="rsf-overlay"
      data-rsf-overlay=""
      style={style}
      onClick={onClick}
      aria-hidden="true"
    />
  );
}
