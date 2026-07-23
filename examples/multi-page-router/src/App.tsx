import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { TutorialTarget, useTutorial, useTutorialActions } from "react-step-flow";
import type { Tutorial } from "react-step-flow";

/**
 * Multi-page guided tour on top of React Router. The only coupling between the
 * tour and the router is two things:
 *
 *   1. Each step names the route it lives on in `metadata.route`.
 *   2. A per-flow `onStepChange` navigates whenever the active step's route
 *      differs from the current location.
 *
 * Combined with `targetNotFound="wait"` (set on the provider in main.tsx), the
 * portal pauses while the destination page mounts and resumes automatically as
 * soon as the step's target registers.
 */

interface StepRoute {
  route: string;
}

const multiPageTour: Tutorial<StepRoute> = {
  id: "multi-page",
  steps: [
    {
      target: "nav-users",
      title: "Users area",
      description: "This is where you manage your team. Let's take a look around.",
      metadata: { route: "/users" },
    },
    {
      target: "users-create",
      title: "Invite a teammate",
      description: "Create and invite users from here.",
      metadata: { route: "/users" },
    },
    {
      target: "billing-plan",
      title: "Your plan",
      description:
        "We just jumped to another page — React Router navigated here and the tour resumed once this card mounted.",
      metadata: { route: "/billing" },
    },
    {
      target: "billing-invoice",
      title: "Invoices",
      description: "Download past invoices as PDF whenever you need them.",
      metadata: { route: "/billing" },
    },
    {
      target: "settings-save",
      title: "Save your changes",
      description: "One more page. Don't forget to save after editing your preferences.",
      metadata: { route: "/settings" },
    },
    {
      target: "",
      placement: "center",
      title: "That's the tour!",
      description: "You just walked across three routes without leaving the flow.",
      metadata: { route: "/settings" },
    },
  ],
};

/**
 * Registers the flow once and keeps the browser route in sync with the active
 * step. `navigate`/`pathname` are read through refs so the registered callback
 * never goes stale while its identity stays stable (no re-registration).
 */
function useRouterTour() {
  const actions = useTutorialActions();
  const navigate = useNavigate();
  const location = useLocation();

  const navigateRef = useRef(navigate);
  const pathRef = useRef(location.pathname);
  navigateRef.current = navigate;
  pathRef.current = location.pathname;

  useEffect(() => {
    actions.register(multiPageTour, {
      onStepChange({ step }) {
        // `step.metadata` is typed as StepRoute thanks to Tutorial<StepRoute>.
        const route = step.metadata?.route;
        if (route && route !== pathRef.current) {
          navigateRef.current(route);
        }
      },
    });
    return () => actions.unregister(multiPageTour.id);
  }, [actions]);
}

// ---------------------------------------------------------------------------
// Presentational shell + pages
// ---------------------------------------------------------------------------

const shell: CSSProperties = {
  display: "flex",
  minHeight: "100vh",
  margin: 0,
  fontFamily: "system-ui, sans-serif",
  color: "#111",
  background: "#f6f7f9",
};

const sidebar: CSSProperties = {
  width: 200,
  background: "#fff",
  borderRight: "1px solid #e5e7eb",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const main: CSSProperties = { flex: 1, padding: 24 };

const card: CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 20,
  maxWidth: 480,
};

const primaryButton: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #2563eb",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
};

const button: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
};

const navLink = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  padding: "8px 10px",
  borderRadius: 6,
  textDecoration: "none",
  color: isActive ? "#fff" : "#111",
  background: isActive ? "#2563eb" : "#f3f4f6",
  display: "block",
});

function UsersPage() {
  return (
    <div style={card}>
      <h2 style={{ marginTop: 0 }}>Users</h2>
      <p style={{ lineHeight: 1.6 }}>Manage the people in your workspace.</p>
      <TutorialTarget id="users-create">
        <button style={primaryButton}>Invite user</button>
      </TutorialTarget>
    </div>
  );
}

function BillingPage() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      <TutorialTarget id="billing-plan">
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Pro plan</h2>
          <p style={{ lineHeight: 1.6 }}>$29 / month · renews monthly.</p>
        </div>
      </TutorialTarget>
      <TutorialTarget id="billing-invoice">
        <div style={card}>
          <h2 style={{ marginTop: 0 }}>Invoices</h2>
          <button style={button}>Download latest</button>
        </div>
      </TutorialTarget>
    </div>
  );
}

function SettingsPage() {
  return (
    <div style={card}>
      <h2 style={{ marginTop: 0 }}>Settings</h2>
      <p style={{ lineHeight: 1.6 }}>Tune your workspace preferences.</p>
      <TutorialTarget id="settings-save">
        <button style={primaryButton}>Save changes</button>
      </TutorialTarget>
    </div>
  );
}

/** Start button + a live readout of the current route and step. */
function TourControls() {
  const actions = useTutorialActions();
  const { isRunning, progress } = useTutorial();
  const location = useLocation();

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        marginTop: 24,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <button
        style={primaryButton}
        onClick={() => actions.start(multiPageTour.id, { force: true })}
      >
        Start multi-page tour
      </button>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        Route: <code>{location.pathname}</code>
        {isRunning && progress ? ` · step ${progress.current}/${progress.total}` : ""}
      </span>
    </div>
  );
}

export function App() {
  useRouterTour();
  return (
    <div style={shell}>
      <aside style={sidebar}>
        <strong style={{ marginBottom: 8 }}>Acme</strong>
        <TutorialTarget id="nav-users">
          <NavLink to="/users" style={navLink}>
            Users
          </NavLink>
        </TutorialTarget>
        <TutorialTarget id="nav-billing">
          <NavLink to="/billing" style={navLink}>
            Billing
          </NavLink>
        </TutorialTarget>
        <TutorialTarget id="nav-settings">
          <NavLink to="/settings" style={navLink}>
            Settings
          </NavLink>
        </TutorialTarget>
      </aside>
      <main style={main}>
        <Routes>
          <Route path="/users" element={<UsersPage />} />
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/users" replace />} />
        </Routes>
        <TourControls />
      </main>
    </div>
  );
}
