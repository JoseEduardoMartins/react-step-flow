# Multi-page tour with React Router

A standalone example of a single guided tour whose steps live on **three
different routes** (`/users`, `/billing`, `/settings`). Starting it walks the
user across the pages, driving the router as it goes.

## Run it

From the repository root:

```bash
npm install       # once, if you haven't already
npm run example:router
```

Vite prints a local URL (default http://localhost:5173). Open it and click
**Start multi-page tour** — watch the address bar change as the tour advances.

This example runs against the library **source** (aliased in `vite.config.ts`),
so any change you make under `../../src` is reflected on reload.

## How it works

Only two small pieces couple the tour to the router (see `src/App.tsx`):

1. **Each step names its route** via `metadata`:

   ```ts
   { target: "billing-plan", title: "Your plan", description: "…",
     metadata: { route: "/billing" } }
   ```

2. **A per-flow `onStepChange` navigates** when the active step's route differs
   from the current location:

   ```ts
   actions.register(multiPageTour, {
     onStepChange({ step }) {
       const route = step.metadata?.route;
       if (route && route !== currentPath) navigate(route);
     },
   });
   ```

The provider runs with **`targetNotFound="wait"`** (`src/main.tsx`), so while
the destination page is mounting — and the step's target does not exist yet —
the portal simply waits. As soon as the `TutorialTarget` for that step
registers, the portal resumes on it. No timers, no manual retries.
