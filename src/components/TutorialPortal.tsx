import { useContext, useEffect, useReducer, useRef } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ConfigContext } from "../provider/ConfigContext";
import { useStoreSelector, useTutorialStore } from "../hooks/useStore";
import { useElementRect } from "../hooks/useElementRect";
import { useFloatingStep } from "../hooks/useFloatingStep";
import { useScrollIntoView } from "../hooks/useScrollIntoView";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { useInertBackground } from "../hooks/useInertBackground";
import { expandRect } from "../utils/rect";
import { isBrowser } from "../utils/ssr";
import type { Placement, Step, TutorialState } from "../types";

const selectStep = (s: TutorialState): Step | null => {
  if (s.status !== "running" || !s.activeFlowId) return null;
  return s.flows.get(s.activeFlowId)?.tutorial.steps[s.stepIndex] ?? null;
};

const selectTotal = (s: TutorialState): number =>
  s.activeFlowId ? (s.flows.get(s.activeFlowId)?.tutorial.steps.length ?? 0) : 0;

/**
 * The single global portal, mounted by {@link TutorialProvider}. Renders the
 * overlay/spotlight and the tooltip while a flow is running. All DOM geometry,
 * scroll and positioning live here so the pure core stays DOM-free.
 */
export function TutorialPortal() {
  const store = useTutorialStore();
  const config = useContext(ConfigContext);

  const step = useStoreSelector(selectStep);
  const stepIndex = useStoreSelector((s) => s.stepIndex);
  const total = useStoreSelector(selectTotal);
  const isRunning = useStoreSelector((s) => s.status === "running");

  const targetId =
    step && step.target && step.placement !== "center" ? step.target : null;

  // Resolve the target synchronously during render so a step change never reads
  // as "missing" for a frame. A registry subscription only forces a re-render
  // when a lazily-mounted target for the current id appears/disappears.
  const [, forceRerender] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!isRunning || !targetId) return;
    return store.registry.subscribe((id) => {
      if (id === targetId) forceRerender();
    });
  }, [store, isRunning, targetId]);

  const targetEl = isRunning && targetId ? store.registry.get(targetId) : null;
  const missing = isRunning && targetId != null && targetEl === null;

  // Report + react to a missing target.
  useEffect(() => {
    if (!missing) return;
    store.reportTargetNotFound();
    if (config.targetNotFound === "skip") store.next();
  }, [missing, store, config.targetNotFound, stepIndex]);

  const centered =
    isRunning && (targetId === null || (missing && config.targetNotFound === "center"));
  const waiting =
    missing && (config.targetNotFound === "wait" || config.targetNotFound === "skip");

  const rect = useElementRect(centered ? null : targetEl);
  const placement: Placement = centered ? "center" : (step?.placement ?? "bottom");

  // Scroll the target into view when it changes (skipped for centered steps).
  useScrollIntoView(centered ? null : targetEl, {
    behavior: config.scrollBehavior,
    enabled: !centered,
  });

  const floating = useFloatingStep({
    target: centered ? null : targetEl,
    placement,
    offset: config.offset,
  });

  const container = config.portalContainer ?? (isBrowser ? document.body : null);
  const interactable = step?.interactable ?? false;

  // Focus management: trap focus in the tooltip, route Escape to cancel.
  const tooltipContainerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const escapable = config.closeOnEsc && (step?.canSkip ?? true);
  const trapActive = isRunning && !!step && !waiting;
  useFocusTrap(tooltipContainerRef, {
    active: trapActive,
    onEscape: escapable ? () => store.cancel() : undefined,
    focusKey: stepIndex,
    // Interactive steps must let focus reach the highlighted element.
    containFocus: !interactable,
  });

  // Strict modal semantics: take the rest of the page out of reach while a
  // non-interactive step is active (opt-in via `inertBackground`).
  useInertBackground(
    wrapperRef,
    container,
    trapActive && !interactable && config.inertBackground
  );

  if (!isRunning || !step || waiting) return null;
  if (!container) return null;

  const { Overlay, Spotlight, Tooltip } = config.slots;
  const paddedRect = !centered && rect ? expandRect(rect, config.spotlightPadding) : null;

  const handleOverlayClick = config.closeOnOverlayClick
    ? () => store.cancel()
    : undefined;

  const wrapperStyle: CSSProperties = { display: "contents" };
  const srOnly: CSSProperties = {
    position: "absolute",
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0,
  };

  return createPortal(
    <div ref={wrapperRef} data-rsf-theme={config.theme} style={wrapperStyle}>
      <div aria-live="polite" role="status" style={srOnly}>
        {config.announce(stepIndex + 1, total, step)}
      </div>
      {paddedRect ? (
        <Spotlight
          rect={paddedRect}
          radius={config.spotlightRadius}
          color={config.overlayColor}
          opacity={config.overlayOpacity}
          zIndex={config.zIndex}
          interactable={step.interactable ?? false}
          transitionMs={config.spotlightTransition}
          onOverlayClick={handleOverlayClick}
        />
      ) : (
        <Overlay
          color={config.overlayColor}
          opacity={config.overlayOpacity}
          zIndex={config.zIndex}
          onClick={handleOverlayClick}
        />
      )}
      <div ref={tooltipContainerRef} style={wrapperStyle}>
        <Tooltip
          step={step}
          index={stepIndex}
          total={total}
          isFirst={stepIndex === 0}
          isLast={stepIndex === total - 1}
          progress={{
            current: stepIndex + 1,
            total,
            ratio: total > 0 ? (stepIndex + 1) / total : 0,
          }}
          labels={config.labels}
          zIndex={config.zIndex + 1}
          animation={config.tooltipAnimation}
          animationMs={config.animationDuration}
          next={store.next}
          previous={store.previous}
          finish={store.finish}
          cancel={store.cancel}
          goTo={store.goTo}
          floating={{
            setFloating: floating.setFloating,
            floatingStyles: floating.floatingStyles,
            placement: floating.placement,
            setArrow: floating.setArrow,
            arrowStyles: floating.arrowStyles,
          }}
        />
      </div>
    </div>,
    container
  );
}
