import { useLayoutEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import {
  arrow,
  autoUpdate,
  flip,
  limitShift,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react";
import type { Placement } from "../types";

/** Parameters for {@link useFloatingStep}. */
export interface UseFloatingStepParams {
  /** The resolved target element, or null for a centered step. */
  target: HTMLElement | null;
  /** Preferred placement. `"center"` (or a null target) centers on the viewport. */
  placement: Placement;
  /** Distance in px between target and tooltip. */
  offset?: number;
}

/** Fixed, viewport-centered styles for target-less (centered) steps. */
const centeredStyles: CSSProperties = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
};

/**
 * Wraps Floating UI's `useFloating` for a single tutorial step. Anchors the
 * tooltip to the target element and keeps it positioned on scroll/resize via
 * `autoUpdate`; centered (target-less) steps are pinned to the viewport center
 * with plain CSS.
 */
export function useFloatingStep(params: UseFloatingStepParams) {
  const { target, placement, offset: offsetPx = 12 } = params;
  const arrowRef = useRef<HTMLElement | null>(null);
  const isCenter = placement === "center" || target === null;

  const floating = useFloating({
    placement: isCenter ? "bottom" : placement,
    strategy: "fixed",
    middleware: [
      offset(offsetPx),
      flip({ fallbackAxisSideDirection: "start" }),
      shift({ padding: 8, limiter: limitShift() }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Feed Floating UI ONLY a real element (or null) as the reference — never a
  // virtual element. A virtual→element reference change does NOT re-bind
  // `autoUpdate`/recompute in Floating UI, so once a lazily-mounted target
  // resolved the tooltip stayed frozen where it was first computed (viewport
  // center). A null→element change binds correctly; centered steps are pinned
  // by CSS via `centeredStyles` instead of a virtual reference.
  useLayoutEffect(() => {
    floating.refs.setReference(target);
  }, [floating.refs, target]);

  const floatingStyles: CSSProperties = isCenter
    ? centeredStyles
    : floating.floatingStyles;

  const arrowStyles = useMemo<CSSProperties>(() => {
    const data = floating.middlewareData.arrow;
    if (!data) return {};
    const style: CSSProperties = { position: "absolute" };
    if (data.x != null) style.left = data.x;
    if (data.y != null) style.top = data.y;
    return style;
  }, [floating.middlewareData.arrow]);

  return {
    setFloating: floating.refs.setFloating,
    setArrow: (node: HTMLElement | null) => {
      arrowRef.current = node;
    },
    floatingStyles,
    placement: floating.placement,
    arrowStyles,
    isCenter,
    update: floating.update,
  };
}
