/** True when running in a browser-like environment with a DOM. */
export const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";
