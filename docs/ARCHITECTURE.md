# Architecture

`react-step-flow` is built on one guiding principle: **all logic lives in a
pure, framework-agnostic core; React only subscribes to it.** This keeps the
engine testable without a DOM, reusable outside React, and free of the
re-render pitfalls that plague tour libraries.

```
┌──────────────────────────────────────────────────────────────┐
│  React layer (src/provider, src/hooks, src/components)         │
│                                                                │
│  TutorialProvider ── StoreContext (stable instance)            │
│                   └─ ConfigContext (stable resolved config)    │
│                   └─ <TutorialPortal/>  (all DOM/geometry)     │
│                                                                │
│  hooks: useTutorial / useTutorialActions / useTutorialStep     │
│         useTutorialTarget / useStoreSelector                   │
│         (DOM) useFloatingStep / useElementRect /               │
│               useScrollIntoView / useFocusTrap                 │
└───────────────▲────────────────────────────────────────────────┘
                │ subscribe / getSnapshot (useSyncExternalStore)
┌───────────────┴────────────────────────────────────────────────┐
│  Core (src/core) — NO React, NO DOM reads                       │
│                                                                 │
│  TutorialStore ── state snapshot (immutable, identity-stable)   │
│               ├─ navigation (pure helpers)                      │
│               ├─ ElementRegistry (Map + WeakMap reverse index)  │
│               ├─ EventEmitter (typed pub/sub)                   │
│               └─ PersistenceAdapter (memory / localStorage)     │
└─────────────────────────────────────────────────────────────────┘
```

## The store

`TutorialStore` is the single source of truth. It holds an **immutable,
identity-stable** `TutorialState` snapshot; every mutation shallow-spreads a new
top-level object, so unchanged references stay stable and React's `Object.is`
comparison behaves.

It exposes the `useSyncExternalStore` contract as **bound arrow-function class
properties** (`subscribe`, `getSnapshot`, `getServerSnapshot`) so their identity
never changes across renders. `getSnapshot` returns the cached state object
as-is — never a freshly-computed value, which would loop the hook forever.
Derivation (current step, progress, per-target active-ness) happens in the React
hooks via `useSyncExternalStoreWithSelector` with narrow selectors, so each
component re-renders only when its slice changes.

### State shape

```ts
interface TutorialState {
  status: "idle" | "running" | "paused" | "completed" | "cancelled";
  activeFlowId: string | null;
  stepIndex: number;                 // -1 when idle
  history: number[];                 // visited indices, for back navigation
  flows: ReadonlyMap<string, RegisteredFlow>;
}
```

Illegal transitions (e.g. `next()` while idle) are total no-ops with a dev-only
warning, keeping the public API safe to call at any time.

## DOM-free rule

The core never reads geometry. On a step change it only updates `stepIndex` and
emits `stepChange`. The React `TutorialPortal` does everything DOM-related:
resolves the target element from the registry, checks visibility, scrolls,
positions the tooltip with Floating UI, and computes the spotlight rectangle.
When a target is missing it calls back into `store.reportTargetNotFound()`,
which emits the `targetNotFound` event — the only DOM→core signal.

## Element registry

Lookups go **id → element**, which requires a string-keyed, enumerable map, so
the primary structure is `Map<string, HTMLElement>`. A
`WeakMap<HTMLElement, string>` provides a GC-friendly reverse lookup. Because the
forward map holds a strong reference, unmount **must** unregister — guaranteed by
the cleanup-returning ref callback in `useTutorialTarget`/`<TutorialTarget>`.

## Events vs. state listeners

Two independent channels:

- **State listeners** drive React re-renders (via `useSyncExternalStore`).
- **The event emitter** drives user side-effects (`start`, `finish`, `cancel`,
  `stepChange`, `targetNotFound`). Per-flow `onStart/onStepChange/onFinish/
  onCancel` callbacks are fanned out alongside global listeners, each wrapped in
  try/catch so a throwing consumer never corrupts a transition.

## Positioning & spotlight

- **Positioning** uses Floating UI's `useFloating` with `strategy: "fixed"` and
  the `offset → flip → shift → arrow` middleware, kept in sync on scroll/resize
  by `autoUpdate`. Centered/target-less steps use a viewport-centered virtual
  reference.
- **Spotlight** is an SVG `<mask>`: a full-screen dark rect with a rounded
  transparent hole at the (padded) target rect. The hole's geometry transitions
  via CSS for a smooth glide between steps. A plain `<Overlay>` is used instead
  for centered steps.
- **Live tracking** — `useElementRect` re-measures the target on resize, scroll
  (capture) and `ResizeObserver`, coalescing to one measurement per frame. None
  of this touches the core store.

## Accessibility

`useFocusTrap` records the previously-focused element, moves focus into the
tooltip on each step, contains `Tab`/`Shift+Tab`, routes `Escape` to cancel, and
restores focus on teardown. The portal renders a labelled `role="dialog"` with
`aria-modal` plus a polite `aria-live` region.

## Build & packaging

- `tsup` emits ESM + CJS + `.d.ts` for two entries: the React package (`.`) and
  the React-free core (`./core`).
- The main entry carries a `"use client"` directive (added post-build, since
  esbuild strips a banner directive during bundling) for Next.js App Router.
- `react`, `react-dom` and `@floating-ui/*` are externalized.

## Testing

The bulk of coverage comes from pure core unit tests (no DOM needed). React
hooks and components are tested with React Testing Library on jsdom, mocking
`getBoundingClientRect` and polyfilling `ResizeObserver`/`IntersectionObserver`/
`scrollIntoView`. The suite enforces ≥80% coverage (actual coverage is ~99%).
