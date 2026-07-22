import type { EventMap, TutorialEventName } from "../types";
import { warn } from "../utils/warn";

type Listener<K extends TutorialEventName> = (payload: EventMap[K]) => void;

/**
 * Tiny typed pub/sub used for lifecycle events. This is intentionally separate
 * from the store's state-change listeners: state listeners drive React
 * re-renders, whereas these events drive user side-effects/callbacks.
 */
export class EventEmitter {
  private readonly listeners = new Map<
    TutorialEventName,
    Set<Listener<TutorialEventName>>
  >();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends TutorialEventName>(event: K, listener: Listener<K>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<TutorialEventName>);
    return () => this.off(event, listener);
  }

  /** Unsubscribe a previously registered listener. */
  off<K extends TutorialEventName>(event: K, listener: Listener<K>): void {
    this.listeners.get(event)?.delete(listener as Listener<TutorialEventName>);
  }

  /** Emit an event, invoking every listener. A throwing listener never breaks others. */
  emit<K extends TutorialEventName>(event: K, payload: EventMap[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    // Iterate over a copy so listeners may unsubscribe during emission.
    for (const listener of [...set]) {
      try {
        listener(payload);
      } catch (error) {
        warn(`event listener for "${event}" threw: ${String(error)}`);
      }
    }
  }

  /** Remove all listeners (all events, or a single event). */
  clear(event?: TutorialEventName): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
