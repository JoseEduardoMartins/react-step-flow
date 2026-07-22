import { useEffect, useState } from "react";
import type { CSSProperties, Ref } from "react";
import type { TooltipProps } from "./slots";
import { getTooltipAnimationStyle } from "../animations/presets";

const cardStyle: CSSProperties = {
  maxWidth: 320,
  boxSizing: "border-box",
  padding: "16px 18px",
  borderRadius: 10,
  background: "var(--rsf-tooltip-bg, #ffffff)",
  color: "var(--rsf-tooltip-fg, #1a1a1a)",
  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  fontFamily:
    "var(--rsf-font, system-ui, -apple-system, Segoe UI, Roboto, sans-serif)",
  fontSize: 14,
  lineHeight: 1.5,
};

const titleStyle: CSSProperties = {
  margin: "0 0 6px",
  fontSize: 16,
  fontWeight: 600,
};

const descStyle: CSSProperties = { margin: "0 0 14px" };

const footerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const buttonRow: CSSProperties = { display: "flex", gap: 8 };

const baseButton: CSSProperties = {
  cursor: "pointer",
  border: "1px solid transparent",
  borderRadius: 6,
  padding: "6px 12px",
  fontSize: 13,
  fontWeight: 500,
};

const primaryButton: CSSProperties = {
  ...baseButton,
  background: "var(--rsf-accent, #2563eb)",
  color: "#fff",
};

const secondaryButton: CSSProperties = {
  ...baseButton,
  background: "transparent",
  borderColor: "var(--rsf-border, #d1d5db)",
  color: "var(--rsf-tooltip-fg, #1a1a1a)",
};

const progressStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
};

/**
 * Default, fully-styleable tooltip. Renders title, description, a progress
 * indicator and navigation controls. Replace it entirely via the provider's
 * `components.Tooltip` slot; it receives the same props.
 */
export function TutorialTooltip({
  step,
  index,
  total,
  isFirst,
  isLast,
  labels,
  zIndex,
  animation,
  animationMs,
  next,
  previous,
  finish,
  cancel,
  floating,
}: TooltipProps) {
  const canSkip = step.canSkip ?? true;
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const animationStyle = getTooltipAnimationStyle(animation, entered, animationMs);

  return (
    <div
      ref={floating.setFloating as Ref<HTMLDivElement>}
      className="rsf-tooltip"
      data-rsf-tooltip=""
      data-placement={floating.placement}
      role="dialog"
      aria-modal="true"
      aria-labelledby="rsf-tooltip-title"
      aria-describedby="rsf-tooltip-desc"
      style={{ ...floating.floatingStyles, zIndex, ...cardStyle, ...animationStyle }}
    >
      <h2 id="rsf-tooltip-title" style={titleStyle}>
        {step.title}
      </h2>
      <p id="rsf-tooltip-desc" style={descStyle}>
        {step.description}
      </p>

      <div style={footerStyle}>
        <span className="rsf-progress" style={progressStyle}>
          {index + 1} / {total}
        </span>
        <div style={buttonRow}>
          {canSkip ? (
            <button
              type="button"
              className="rsf-btn rsf-btn-skip"
              style={secondaryButton}
              onClick={cancel}
            >
              {labels.skip}
            </button>
          ) : null}
          {!isFirst ? (
            <button
              type="button"
              className="rsf-btn rsf-btn-prev"
              style={secondaryButton}
              onClick={previous}
            >
              {step.previousLabel ?? labels.previous}
            </button>
          ) : null}
          {isLast ? (
            <button
              type="button"
              className="rsf-btn rsf-btn-finish"
              style={primaryButton}
              onClick={finish}
            >
              {step.finishLabel ?? labels.finish}
            </button>
          ) : (
            <button
              type="button"
              className="rsf-btn rsf-btn-next"
              style={primaryButton}
              onClick={next}
            >
              {step.nextLabel ?? labels.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
