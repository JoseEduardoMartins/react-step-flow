/**
 * Framework-agnostic core barrel (React-free).
 *
 * Import from `react-step-flow/core` to use the engine without React.
 */
export { TutorialStore } from "./store";
export type { StoreConfig } from "./store";
export { createStore } from "./createStore";
export type { CreateStoreOptions } from "./createStore";
export { EventEmitter } from "./emitter";
export { ElementRegistry } from "./registry";
export {
  createMemoryAdapter,
  createLocalStorageAdapter,
} from "./persistence";
export type { PersistenceAdapter } from "./persistence";
export {
  clampIndex,
  resolveStepIndex,
  isFirstStep,
  isLastStep,
  stepAt,
} from "./navigation";
export { validateFlow } from "./guards";

export type * from "../types";
