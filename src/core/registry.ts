/**
 * Registry mapping tutorial target ids to live DOM elements.
 *
 * The primary structure is a `Map<string, HTMLElement>` because lookups go
 * id -> element and must be keyed by string (a WeakMap cannot be keyed by a
 * string nor enumerated). A `WeakMap<HTMLElement, string>` reverse index gives
 * a GC-friendly element -> id lookup without pinning detached nodes.
 *
 * NOTE: because the forward map holds a strong reference, callers MUST call
 * {@link unregister} on unmount or detached nodes will leak. The ref-callback
 * cleanup in `<TutorialTarget>` / `useTutorialTarget` guarantees this.
 */
export class ElementRegistry {
  private readonly byId = new Map<string, HTMLElement>();
  private readonly idOf = new WeakMap<HTMLElement, string>();
  private readonly listeners = new Set<(id: string) => void>();

  /** Register (or replace) the element for an id. */
  register(id: string, element: HTMLElement): void {
    const existing = this.byId.get(id);
    if (existing === element) return;
    this.byId.set(id, element);
    this.idOf.set(element, id);
    this.notify(id);
  }

  /** Remove the element registered under an id. */
  unregister(id: string): void {
    const element = this.byId.get(id);
    if (!element) return;
    this.byId.delete(id);
    // The WeakMap entry self-cleans once the node is collected, but delete the
    // reverse mapping eagerly if the element is not registered elsewhere.
    if (this.idOf.get(element) === id) {
      this.idOf.delete(element);
    }
    this.notify(id);
  }

  /** Get the element for an id, or null if none is registered. */
  get(id: string): HTMLElement | null {
    return this.byId.get(id) ?? null;
  }

  /** Whether an element is registered for the id. */
  has(id: string): boolean {
    return this.byId.has(id);
  }

  /** Get the id an element is registered under, if any. */
  idFor(element: HTMLElement): string | undefined {
    return this.idOf.get(element);
  }

  /** Number of registered elements. */
  get size(): number {
    return this.byId.size;
  }

  /**
   * Subscribe to registration changes for a specific id (used by the portal to
   * retry when a lazily-mounted target appears). Returns an unsubscribe fn.
   */
  subscribe(listener: (id: string) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(id: string): void {
    for (const listener of [...this.listeners]) {
      listener(id);
    }
  }
}
