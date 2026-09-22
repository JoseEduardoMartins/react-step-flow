import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { Meta, StoryObj } from "@storybook/react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { useTutorialActions } from "../hooks/useTutorialActions";
import type { Tutorial } from "../types";
import { demoButton, demoPrimaryButton } from "./DemoApp";

/**
 * Repro of the TAL-3952 filter-step focus leak: an `interactable` step points at
 * a non-modal "drawer" that lives in its own portal (like the DS ResponsivePanel
 * Sheet), while unrelated page content sits before and after it. Tab must cycle
 * across the tooltip + drawer only, never reaching the page behind.
 */
const filterTour: Tutorial = {
  id: "interactable-focus",
  steps: [
    {
      target: "drawer",
      title: "Filtros",
      description: "Use os filtros. O Tab deve circular só aqui e no balão.",
      placement: "left",
      spotlightTarget: "drawer",
      interactable: true,
    },
  ],
};

/** A fixed, non-modal drawer portaled to the body — mirrors the real Sheet. */
function Drawer() {
  return createPortal(
    <div
      data-tutorial-id="drawer"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 340,
        background: "#fff",
        borderLeft: "1px solid #e5e7eb",
        boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 50,
      }}
    >
      <h3 style={{ margin: 0 }}>Gaveta de filtros</h3>
      <input aria-label="Competência" placeholder="Competência" />
      <input aria-label="Filial" placeholder="Filial" />
      <select aria-label="Tipo">
        <option>Tipo A</option>
        <option>Tipo B</option>
      </select>
      <button style={demoButton}>Aplicar</button>
    </div>,
    document.body
  );
}

function Controls() {
  const actions = useTutorialActions();
  useEffect(() => {
    actions.register(filterTour);
  }, [actions]);
  return (
    <button
      style={demoPrimaryButton}
      onClick={() => actions.start(filterTour.id, { force: true })}
    >
      Start filter tour
    </button>
  );
}

const meta: Meta = { title: "InteractableFocus" };
export default meta;
type Story = StoryObj;

export const GavetaInterativa: Story = {
  render: () => (
    <TutorialProvider scanAttributes inertBackground targetNotFound="wait" offset={16}>
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 12 }}>
        <h1>Página de fundo</h1>
        <button style={demoButton}>fundo-topo</button>
        <input aria-label="campo de fundo" placeholder="campo de fundo" />
        <Controls />
        <button style={demoButton}>fundo-base</button>
        <a href="#foo">link de fundo</a>
      </div>
      <Drawer />
    </TutorialProvider>
  ),
};
