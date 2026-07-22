import type { CSSProperties, ReactNode } from "react";
import { TutorialTarget } from "../components/TutorialTarget";

const shell: CSSProperties = {
  display: "flex",
  minHeight: "100vh",
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

const menuItem: CSSProperties = {
  padding: "8px 10px",
  borderRadius: 6,
  background: "#f3f4f6",
  cursor: "pointer",
};

const main: CSSProperties = { flex: 1, padding: 24 };

const toolbar: CSSProperties = { display: "flex", gap: 12, marginBottom: 24 };

const button: CSSProperties = {
  padding: "8px 14px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
};

const primary: CSSProperties = {
  ...button,
  background: "#2563eb",
  color: "#fff",
  border: "1px solid #2563eb",
};

/** Small demo application whose UI elements are registered as tutorial targets. */
export function DemoApp({ children }: { children?: ReactNode }) {
  return (
    <div style={shell}>
      <aside style={sidebar}>
        <strong style={{ marginBottom: 8 }}>Acme</strong>
        <TutorialTarget id="menu-users">
          <div style={menuItem}>Users</div>
        </TutorialTarget>
        <TutorialTarget id="menu-billing">
          <div style={menuItem}>Billing</div>
        </TutorialTarget>
        <TutorialTarget id="menu-settings">
          <div style={menuItem}>Settings</div>
        </TutorialTarget>
      </aside>
      <main style={main}>
        <div style={toolbar}>
          <TutorialTarget id="create-user">
            <button style={primary}>New user</button>
          </TutorialTarget>
          <TutorialTarget id="export">
            <button style={button}>Export</button>
          </TutorialTarget>
          <TutorialTarget id="help">
            <button style={button}>Help</button>
          </TutorialTarget>
        </div>
        <p style={{ maxWidth: 520, lineHeight: 1.6 }}>
          This is a demo application. Use the controls above to start a guided
          tour that highlights the registered elements one step at a time.
        </p>
        {children}
      </main>
    </div>
  );
}

export { button as demoButton, primary as demoPrimaryButton };
