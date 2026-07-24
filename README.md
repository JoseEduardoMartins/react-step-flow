# react-step-flow

A modern, **headless**, strongly-typed React library for building guided tours,
walkthroughs and onboarding tutorials — in the spirit of React Joyride,
Shepherd.js and Driver.js, but with a clean headless-first architecture, a pure
framework-agnostic core, and first-class TypeScript ergonomics.

- **Headless first** — all logic lives in a pure, React-free core; the UI is
  100% yours to style or replace.
- **Composable** — independent hooks and components you can mix freely.
- **Type-safe** — every public API is fully typed with great autocomplete.
- **Performant** — built on `useSyncExternalStore` with narrow selectors, so
  starting a tour never re-renders your whole app.
- **Extensible** — swappable slots, theming tokens, persistence and fully
  dynamic flows.
- **Accessible** — focus trapping, `Escape` to close, keyboard navigation,
  ARIA roles and screen-reader announcements out of the box.

---

## Table of contents

- [Installation](#installation)
- [Getting started](#getting-started)
- [Core concepts](#core-concepts)
- [Examples](#examples)
- [API reference](#api-reference)
  - [Components](#components)
  - [Hooks](#hooks)
  - [Imperative store API](#imperative-store-api)
- [Customization & theming](#customization--theming)
- [Events & callbacks](#events--callbacks)
- [Persistence](#persistence)
- [Dynamic flows](#dynamic-flows)
- [Multi-page tours (routing)](#multi-page-tours-routing)
- [Accessibility](#accessibility)
- [Architecture](#architecture)
- [FAQ](#faq)

---

## Installation

```bash
npm install @jose-eduardo-martins/react-step-flow
```

Peer dependencies: **React 19+** and **react-dom 19+**.

---

## Getting started

Wrap your app in a `TutorialProvider`, mark the elements you want to highlight
with `TutorialTarget` (or the `useTutorialTarget` ref hook), register a flow, and
start it.

```tsx
import {
  TutorialProvider,
  TutorialTarget,
  useTutorial,
} from "@jose-eduardo-martins/react-step-flow";

const onboarding = {
  id: "first-access",
  steps: [
    { target: "menu-users", title: "Users", description: "Manage your users here." },
    { target: "create-user", title: "Create a user", description: "Click to add a user." },
  ],
};

function Toolbar() {
  const { start } = useTutorial();
  return (
    <>
      <TutorialTarget id="menu-users">
        <a href="/users">Users</a>
      </TutorialTarget>
      <TutorialTarget id="create-user">
        <button>New user</button>
      </TutorialTarget>
      <button onClick={() => start("first-access")}>Take the tour</button>
    </>
  );
}

export default function App() {
  return (
    <TutorialProvider>
      <Toolbar />
    </TutorialProvider>
  );
}
```

Register the flow once (e.g. on mount) with the action hook:

```tsx
import { useTutorialActions } from "@jose-eduardo-martins/react-step-flow";
import { useEffect } from "react";

function RegisterFlows() {
  const { register } = useTutorialActions();
  useEffect(() => register(onboarding), [register]);
  return null;
}
```

The prop-based form is available too — any element carrying `data-tutorial-id`
is auto-registered when you opt in with `<TutorialProvider scanAttributes>`:

```tsx
<button data-tutorial-id="create-user">New user</button>
```

---

## Core concepts

| Concept        | What it is                                                              |
| -------------- | ----------------------------------------------------------------------- |
| **Target**     | A DOM element registered under a string id.                             |
| **Step**       | One stop of a tour: a target + title + description + options.           |
| **Flow**       | A named, ordered list of steps (`Tutorial`).                            |
| **Store**      | The pure engine that owns all state; React subscribes to it.            |
| **Portal**     | Renders the overlay/spotlight/tooltip while a flow runs.                |

```ts
interface Step {
  id?: string;
  target: string;            // registered element id ("" or placement:"center" for a centered step)
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  nextLabel?: string;
  previousLabel?: string;
  finishLabel?: string;
  canSkip?: boolean;
  interactable?: boolean;    // keep the highlighted element clickable
  metadata?: unknown;
}

interface Tutorial {
  id: string;
  steps: Step[];
}
```

---

## Examples

Run the interactive Storybook to see every scenario:

```bash
npm run storybook
```

Stories cover: simple onboarding, multiple flows, a custom tooltip, dark theme,
spotlight tuning, responsiveness (centered steps), persistence, and dynamic
flows.

---

## API reference

### Components

#### `<TutorialProvider>`

Root provider. Creates a single store and mounts the global portal.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `store` | `TutorialStore` | — | Use a pre-built/shared store instead of creating one. |
| `persistence` | `boolean \| PersistenceAdapter` | in-memory | `true` uses `localStorage`. |
| `namespace` | `string` | `"rsf"` | Prefix for persistence keys. |
| `scanAttributes` | `boolean` | `false` | Auto-register `[data-tutorial-id]` elements. |
| `scanRoot` | `HTMLElement \| ShadowRoot \| Document` | `document.body` | Root that `scanAttributes` scans (e.g. a shadow root in a micro-frontend). |
| `zIndex` | `number` | `10000` | Base z-index for overlay/spotlight. |
| `offset` | `number` | `12` | Gap (px) between target and tooltip. |
| `spotlightPadding` | `number` | `8` | Padding around the highlighted element. |
| `spotlightRadius` | `number` | `6` | Corner radius of the cut-out. |
| `overlayColor` / `overlayOpacity` | `string` / `number` | `#000` / `0.5` | Backdrop styling. |
| `scrollBehavior` | `ScrollBehavior` | `"smooth"` | How targets scroll into view. |
| `closeOnEsc` | `boolean` | `true` | `Escape` cancels the tour. |
| `closeOnOverlayClick` | `boolean` | `false` | Clicking the backdrop cancels. |
| `inertBackground` | `boolean` | `false` | Mark the rest of the page `inert`/`aria-hidden` during non-interactive steps (strict modal semantics). |
| `labels` | `Partial<StepLabels>` | English | Button labels (`next`/`previous`/`finish`/`skip`). |
| `announce` | `(current, total, step) => string` | `"Step X of N: title"` | Screen-reader announcement template (for localization). |
| `targetNotFound` | `"skip" \| "center" \| "wait"` | `"center"` | Behavior when a target is missing. |
| `theme` | `string` | `"light"` | Value of the `data-rsf-theme` attribute. |
| `portalContainer` | `HTMLElement \| null` | `document.body` | Where the portal renders. |
| `tooltipAnimation` | `"fade" \| "scale" \| "slide" \| "none"` | `"fade"` | Tooltip entrance. |
| `animationDuration` | `number` | `200` | Tooltip entrance duration (ms). |
| `spotlightTransition` | `number` | `300` | Cut-out glide duration (ms). |
| `disableAnimations` | `boolean` | `false` | Turn off all animation. |
| `components` | `Partial<Slots>` | defaults | Swap `Overlay` / `Spotlight` / `Tooltip`. |

#### `<TutorialTarget id="...">`

Registers its child element. By default it clones the child and merges the ref
(`asChild`, no wrapper DOM); pass `asChild={false}` to wrap in a
`display:contents` span for text/fragment children.

#### `<TutorialPortal>`, `<TutorialTooltip>`, `<Overlay>`, `<Spotlight>`

Exported for advanced composition/replacement. The portal is mounted for you by
the provider.

### Hooks

| Hook | Returns / purpose |
| --- | --- |
| `useTutorial()` | `{ start, next, previous, finish, cancel, goTo, restart, currentStep, isRunning, progress, flow, status, stepIndex }` — reactive. |
| `useTutorialActions()` | Action-only (register/start/next/… + `addStep`/`removeStep`/`updateStep`/`setSteps`/`resetPersistence`/`hasCompleted`). **Subscribes to nothing** — never re-renders. |
| `useTutorialStep(id?)` | `{ step, index, total, isActive }` for the active step; `isActive` tells a target if it is currently highlighted. |
| `useTutorialTarget(id)` | A ref callback registering the node under `id`. |
| `useTutorialStore()` | The raw `TutorialStore` instance. |
| `useStoreSelector(selector, isEqual?)` | Subscribe to any slice of state with minimal re-renders. |

Lower-level DOM hooks are also exported: `useFloatingStep`, `useElementRect`,
`useScrollIntoView`, `useFocusTrap`, `useAttributeScan`.

### Imperative store API

Obtain the store from `useTutorialStore()` or `createStore()` (from
`@jose-eduardo-martins/react-step-flow` or `@jose-eduardo-martins/react-step-flow/core`). All
methods have stable identity.

```ts
tutorial.register(flow, options?);
tutorial.unregister(flowId);
tutorial.start(flowId, { stepIndex?, force? });
tutorial.next();
tutorial.previous();
tutorial.goTo(indexOrId);
tutorial.finish();
tutorial.cancel();
tutorial.restart(flowId);
tutorial.addStep(flowId, step, index?);
tutorial.removeStep(flowId, indexOrId);
tutorial.updateStep(flowId, indexOrId, patch);
tutorial.setSteps(flowId, steps);
tutorial.hasCompleted(flowId);
tutorial.resetPersistence(flowId);
tutorial.state;            // immutable snapshot
tutorial.emitter.on(event, cb);
tutorial.destroy();        // release a shared store when its owner unmounts
```

The core ships React-free from `@jose-eduardo-martins/react-step-flow/core` for non-React usage.

---

## Customization & theming

Everything visual is a **slot**. Provide your own components without touching
any logic:

```tsx
<TutorialProvider components={{ Tooltip: MyTooltip, Overlay: MyOverlay, Spotlight: MySpotlight }}>
```

Your `Tooltip` receives `{ step, index, total, isFirst, isLast, progress,
labels, next, previous, finish, cancel, goTo, floating, ... }`. Spread
`floating.floatingStyles` and attach `floating.setFloating` to position it.

The default tooltip reads CSS custom properties, so light theming needs no code:

```css
[data-rsf-theme="dark"] .rsf-tooltip {
  --rsf-tooltip-bg: #1f2937;
  --rsf-tooltip-fg: #f9fafb;
  --rsf-accent: #6366f1;
  --rsf-border: #374151;
}
```

Padding, radius, colors, z-index, offsets, durations and labels are all provider
props (see the table above).

---

## Events & callbacks

Global events via the store's emitter:

```ts
const off = tutorial.emitter.on("stepChange", ({ step, stepIndex }) => { /* ... */ });
// events: "start" | "finish" | "cancel" | "stepChange" | "targetNotFound"
off(); // unsubscribe
```

Per-flow callbacks at registration:

```ts
tutorial.register(flow, {
  onStart(ctx) {},
  onStepChange(ctx) {},
  onFinish(ctx) {},
  onCancel(ctx) {},
});
```

---

## Persistence

Opt in per flow so a completed tour is not shown again:

```tsx
<TutorialProvider persistence namespace="my-app">
```

```ts
tutorial.register(onboarding, { persist: true, version: "1" });
tutorial.start("first-access"); // silently skipped if already completed
```

Bump `version` to re-show a changed tour. `tutorial.hasCompleted(id)` and
`tutorial.resetPersistence(id)` give you manual control. Provide a custom
`PersistenceAdapter` (e.g. server-backed) for anything beyond `localStorage`.

---

## Dynamic flows

Flows are fully editable at runtime — even while running. The active step index
is clamped automatically and the flow cancels if it becomes empty.

```ts
tutorial.addStep("first-access", { target: "export", title: "Export", description: "…" });
tutorial.removeStep("first-access", "create-user");
tutorial.updateStep("first-access", 0, { title: "Updated" });
tutorial.setSteps("first-access", newSteps);
tutorial.restart("first-access");
tutorial.start("first-access", { stepIndex: 2 }); // start partway through
```

---

## Multi-page tours (routing)

A single flow can span several pages/routes. There is no router coupling baked
into the library — you wire it up with two small pieces plus one provider prop:

1. **Tell each step which route it lives on.** The `metadata` field is free-form
   and fully typed — parameterize `Tutorial<M>` / `Step<M>` with your shape so
   `step.metadata` is typed everywhere (no casts):

   ```ts
   interface StepMeta { route: string }

   const flow: Tutorial<StepMeta> = {
     id: "onboarding",
     steps: [
       { target: "menu-users",   title: "Users",   description: "…", metadata: { route: "/users" } },
       { target: "invoice-card", title: "Invoices", description: "…", metadata: { route: "/billing" } },
     ],
   };
   ```

2. **Navigate on step change.** Register the flow with an `onStepChange` callback
   that pushes the router whenever the active step's route differs from the
   current location:

   ```tsx
   import { useNavigate, useLocation } from "react-router-dom";

   function useRouterTour() {
     const { register, unregister } = useTutorialActions();
     const navigate = useNavigate();
     const location = useLocation();

     // Read latest navigate/path through refs so the callback never goes stale
     // while its identity stays stable (no re-registration).
     const navigateRef = useRef(navigate);
     const pathRef = useRef(location.pathname);
     navigateRef.current = navigate;
     pathRef.current = location.pathname;

     useEffect(() => {
       register(flow, {
         onStepChange({ step }) {
           const route = step.metadata?.route; // typed as StepMeta
           if (route && route !== pathRef.current) navigateRef.current(route);
         },
       });
       return () => unregister(flow.id);
     }, [register, unregister]);
   }
   ```

3. **Wait for the destination page to mount.** Run the provider with
   `targetNotFound="wait"`. While the new page mounts (and the step's target
   does not exist yet) the portal simply pauses, then resumes on that step the
   moment its `TutorialTarget` registers — no timers or manual retries:

   ```tsx
   <TutorialProvider targetNotFound="wait">
   ```

The same recipe works with any router (Next.js, TanStack Router, etc.) — only
the `navigate`/`location` hooks change. A complete, runnable example lives in
[`examples/multi-page-router`](./examples/multi-page-router) (`npm run
example:router`), and the Storybook story **Tutorial → Multi-page (React
Router)** demonstrates it inline.

---

## Accessibility

- Focus is trapped within the tooltip; `Tab`/`Shift+Tab` wrap. On
  `interactable` steps the trap is relaxed so keyboard focus can reach the
  highlighted element (Escape and initial focus still apply).
- `Escape` cancels (respecting `closeOnEsc` and the step's `canSkip`).
- Focus moves into the tooltip on each step and is restored to the trigger when
  the tour ends.
- The tooltip is a labelled `role="dialog"` with `aria-modal`, and its ids are
  unique per instance (safe with multiple providers / micro-frontends). Enable
  `inertBackground` to also mark the rest of the page `inert` during
  non-interactive steps for full modal semantics.
- A polite `aria-live` region announces "Step X of N: title". Localize it with
  the `announce` prop:

  ```tsx
  <TutorialProvider
    labels={{ next: "Próximo", previous: "Voltar", finish: "Concluir", skip: "Pular" }}
    announce={(current, total, step) => `Passo ${current} de ${total}: ${step.title}`}
  >
  ```

---

## Architecture

Two strictly separated layers:

- **Core (`src/core`, no React):** `TutorialStore` (state + `useSyncExternalStore`
  contract), navigation, an element registry (`Map<string, HTMLElement>` + a
  `WeakMap` reverse index), a typed event emitter, and a pluggable persistence
  adapter. The core never touches the DOM.
- **React layer:** a provider that puts the stable store instance and resolved
  config on context, hooks that select narrow slices of state, and a single
  portal that owns all geometry, scrolling, positioning (Floating UI) and the
  spotlight.

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full breakdown.

---

## FAQ

**Does it work with Server Components / Next.js App Router?**
Yes. The package ships a `"use client"` directive on its entry; import it from a
client component or let the directive mark the boundary.

**Can I use it without React?**
Yes — import the engine from `@jose-eduardo-martins/react-step-flow/core`.

**Why don't my `tutorialId` props on third-party components register?**
A plain prop on someone else's component is just forwarded to the DOM; the
library can't intercept it. Use `<TutorialTarget>`, `useTutorialTarget(id)`, or
opt into `scanAttributes` with `data-tutorial-id`.

**A target isn't mounted yet — what happens?**
Configurable via `targetNotFound`: `"center"` (default) shows a centered step,
`"skip"` advances, `"wait"` waits for the element to mount.

**How do I keep a "Start tour" button from re-rendering during the tour?**
Use `useTutorialActions()` — it subscribes to no state.

---

## License

MIT © José Eduardo Martins
