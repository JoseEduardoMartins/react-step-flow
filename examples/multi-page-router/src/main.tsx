import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TutorialProvider } from "@jose-eduardo-martins/react-step-flow";
import { App } from "./App";

/**
 * Real-browser entry point. `BrowserRouter` uses the History API, so the tour
 * changes the address bar as it walks across pages. `targetNotFound="wait"`
 * lets the portal pause while each page mounts, then resume on its step.
 */
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <TutorialProvider targetNotFound="wait">
        <App />
      </TutorialProvider>
    </BrowserRouter>
  </StrictMode>
);
