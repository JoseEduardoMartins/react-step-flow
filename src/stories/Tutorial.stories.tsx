import { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TutorialProvider } from "../provider/TutorialProvider";
import { useTutorialActions } from "../hooks/useTutorialActions";
import { useTutorial } from "../hooks/useTutorial";
import { DemoApp, demoPrimaryButton, demoButton } from "./DemoApp";
import type { TooltipProps } from "../components/slots";
import type { RegisterOptions, Tutorial } from "../types";

const onboarding: Tutorial = {
  id: "onboarding",
  steps: [
    { target: "menu-users", title: "Users", description: "Manage your users here." },
    { target: "create-user", title: "Create a user", description: "Click to add a new user." },
    { target: "export", title: "Export", description: "Download your data as CSV." },
    { target: "help", title: "Need help?", description: "Open the help center any time." },
  ],
};

const billingTour: Tutorial = {
  id: "billing",
  steps: [
    { target: "menu-billing", title: "Billing", description: "Review invoices and plans." },
    { target: "menu-settings", title: "Settings", description: "Update your preferences." },
  ],
};

/** Registers flows on mount and renders a start button per flow. */
function TourControls({
  flows,
}: {
  flows: Array<{ flow: Tutorial; options?: RegisterOptions; label?: string }>;
}) {
  const actions = useTutorialActions();
  useEffect(() => {
    flows.forEach(({ flow, options }) => actions.register(flow, options));
  }, [actions, flows]);

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
      {flows.map(({ flow, label }) => (
        <button
          key={flow.id}
          style={demoPrimaryButton}
          onClick={() => actions.start(flow.id, { force: true })}
        >
          {label ?? `Start: ${flow.id}`}
        </button>
      ))}
    </div>
  );
}

const meta: Meta = {
  title: "Tutorial",
};
export default meta;

type Story = StoryObj;

/** A simple linear onboarding across four elements. */
export const OnboardingSimples: Story = {
  render: () => (
    <TutorialProvider>
      <DemoApp>
        <TourControls flows={[{ flow: onboarding, label: "Start onboarding" }]} />
      </DemoApp>
    </TutorialProvider>
  ),
};

/** Two independent flows registered at once. */
export const MultiplosFluxos: Story = {
  render: () => (
    <TutorialProvider>
      <DemoApp>
        <TourControls
          flows={[
            { flow: onboarding, label: "Onboarding" },
            { flow: billingTour, label: "Billing tour" },
          ]}
        />
      </DemoApp>
    </TutorialProvider>
  ),
};

/** A fully custom tooltip supplied through the Tooltip slot. */
function FancyTooltip({
  step,
  index,
  total,
  isLast,
  next,
  finish,
  cancel,
  floating,
  zIndex,
}: TooltipProps) {
  return (
    <div
      ref={floating.setFloating as React.Ref<HTMLDivElement>}
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      style={{
        ...floating.floatingStyles,
        zIndex,
        width: 300,
        padding: 20,
        borderRadius: 16,
        color: "#fff",
        background: "linear-gradient(135deg,#7c3aed,#2563eb)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Step {index + 1} of {total}
      </div>
      <h3 style={{ margin: "6px 0" }}>{step.title}</h3>
      <p style={{ margin: "0 0 16px", lineHeight: 1.5 }}>{step.description}</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={cancel} style={{ ...demoButton, background: "transparent", color: "#fff" }}>
          Close
        </button>
        <button onClick={isLast ? finish : next} style={demoButton}>
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}

export const TooltipCustomizado: Story = {
  render: () => (
    <TutorialProvider components={{ Tooltip: FancyTooltip }} overlayOpacity={0.6}>
      <DemoApp>
        <TourControls flows={[{ flow: onboarding, label: "Start custom tour" }]} />
      </DemoApp>
    </TutorialProvider>
  ),
};

/** Dark theme via CSS variables + a darker overlay. */
export const TemaEscuro: Story = {
  render: () => (
    <>
      <style>{`
        [data-rsf-theme="dark"] .rsf-tooltip {
          --rsf-tooltip-bg: #1f2937;
          --rsf-tooltip-fg: #f9fafb;
          --rsf-border: #374151;
          --rsf-accent: #6366f1;
        }
      `}</style>
      <TutorialProvider theme="dark" overlayOpacity={0.7}>
        <DemoApp>
          <TourControls flows={[{ flow: onboarding, label: "Start dark tour" }]} />
        </DemoApp>
      </TutorialProvider>
    </>
  ),
};

/** Larger spotlight padding and radius to emphasize the cut-out. */
export const Spotlight: Story = {
  render: () => (
    <TutorialProvider spotlightPadding={16} spotlightRadius={14} overlayOpacity={0.65}>
      <DemoApp>
        <TourControls flows={[{ flow: onboarding, label: "Start spotlight tour" }]} />
      </DemoApp>
    </TutorialProvider>
  ),
};

/** Centered, target-less step that adapts to any viewport size. */
export const Responsividade: Story = {
  render: () => (
    <TutorialProvider>
      <DemoApp>
        <TourControls
          flows={[
            {
              flow: {
                id: "welcome",
                steps: [
                  {
                    target: "",
                    placement: "center",
                    title: "Welcome!",
                    description:
                      "This centered step stays put on phones, tablets and desktops. Resize the window to see.",
                  },
                  { target: "create-user", title: "Create", description: "Then we point at things." },
                ],
              },
              label: "Start responsive tour",
            },
          ]}
        />
      </DemoApp>
    </TutorialProvider>
  ),
};

/** Persisted onboarding: once finished it will not auto-show again. */
function PersistenceControls() {
  const actions = useTutorialActions();
  const [done, setDone] = useState(actions.hasCompleted("persisted"));
  useEffect(() => {
    actions.register(
      { id: "persisted", steps: onboarding.steps },
      { persist: true, version: "1" }
    );
    setDone(actions.hasCompleted("persisted"));
  }, [actions]);

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center" }}>
      <button style={demoPrimaryButton} onClick={() => actions.start("persisted")}>
        Start (skips if completed)
      </button>
      <button
        style={demoButton}
        onClick={() => {
          actions.resetPersistence("persisted");
          setDone(false);
        }}
      >
        Reset persistence
      </button>
      <span>{done ? "Completed before ✅" : "Not completed yet"}</span>
    </div>
  );
}

export const Persistencia: Story = {
  render: () => (
    <TutorialProvider persistence namespace="rsf-story">
      <DemoApp>
        <PersistenceControls />
      </DemoApp>
    </TutorialProvider>
  ),
};

/** Add and remove steps of a running flow at runtime. */
function DynamicControls() {
  const actions = useTutorialActions();
  const { isRunning, progress } = useTutorial();
  useEffect(() => {
    actions.register({
      id: "dynamic",
      steps: [{ target: "menu-users", title: "Start here", description: "We can grow this tour." }],
    });
  }, [actions]);

  return (
    <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
      <button style={demoPrimaryButton} onClick={() => actions.start("dynamic", { force: true })}>
        Start dynamic tour
      </button>
      <button
        style={demoButton}
        onClick={() =>
          actions.addStep("dynamic", {
            target: "export",
            title: "New step",
            description: "Added at runtime.",
          })
        }
      >
        Add step
      </button>
      <button style={demoButton} onClick={() => actions.removeStep("dynamic", 0)}>
        Remove first step
      </button>
      {isRunning && progress ? (
        <span>
          Step {progress.current} / {progress.total}
        </span>
      ) : null}
    </div>
  );
}

export const FluxoDinamico: Story = {
  render: () => (
    <TutorialProvider>
      <DemoApp>
        <DynamicControls />
      </DemoApp>
    </TutorialProvider>
  ),
};
