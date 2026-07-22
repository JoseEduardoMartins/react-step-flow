import type { Tutorial } from "../types";
import { warn } from "../utils/warn";

/**
 * Validate a flow definition at registration time. Returns true when valid;
 * otherwise warns (dev-only) and returns false so the caller can bail out.
 */
export function validateFlow(flow: Tutorial): boolean {
  if (!flow || typeof flow.id !== "string" || flow.id.length === 0) {
    warn("register() called with a flow missing a valid string id.");
    return false;
  }
  if (!Array.isArray(flow.steps) || flow.steps.length === 0) {
    warn(`flow "${flow.id}" was registered with no steps.`);
    return false;
  }
  return true;
}
