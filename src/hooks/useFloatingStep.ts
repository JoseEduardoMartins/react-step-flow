import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import {
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
  type VirtualElement,
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

/** A virtual reference anchored at the center of the viewport. */
function centerVirtualElement(): VirtualElement {
  return {
    getBoundingClientRect() {
      const w = typeof window !== "undefined" ? window.innerWidth : 0;
      const h = typeof window !== "undefined" ? window.innerHeight : 0;
      const x = w / 2;
      const y = h / 2;
      return { x, y, width: 0, height: 0, top: y, left: x, right: x, bottom: y };
    },
  };
}

/**
 * Wraps Floating UI's `useFloating` for a single tutorial step. Anchors the
 * tooltip to the target element (or a viewport-centered virtual element for
 * centered steps) and keeps it positioned on scroll/resize via `autoUpdate`.
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
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { refs } = floating;
  useEffect(() => {
    refs.setReference(isCenter ? centerVirtualElement() : target);
  }, [refs, target, isCenter]);

  const arrowStyles = useMemo<CSSProperties>(() => {
    const data = floating.middlewareData.arrow;
    if (!data) return {};
    const style: CSSProperties = { position: "absolute" };
    if (data.x != null) style.left = data.x;
    if (data.y != null) style.top = data.y;
    return style;
  }, [floating.middlewareData.arrow]);

  return {
    setFloating: refs.setFloating,
    setArrow: (node: HTMLElement | null) => {
      arrowRef.current = node;
    },
    floatingStyles: floating.floatingStyles,
    placement: floating.placement,
    arrowStyles,
    isCenter,
    update: floating.update,
  };
}
