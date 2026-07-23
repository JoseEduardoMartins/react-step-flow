import type { Step, Tutorial } from "../types";
import { warn } from "../utils/warn";

/** Whether a value is a plain step with the required string fields. */
function isValidStep(step: unknown): step is Step {
  if (typeof step !== "object" || step === null) return false;
  const s = step as Record<string, unknown>;
  return (
    typeof s.target === "string" &&
    typeof s.title === "string" &&
    typeof s.description === "string"
  );
}

/**
 * Validate a flow definition at registration time. Returns true when valid;
 * otherwise warns (dev-only) and returns false so the caller can bail out.
 *
 * Duplicate step ids are non-fatal: they are warned about (since `goTo(id)`
 * would resolve ambiguously) but do not reject the flow.
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

  for (let i = 0; i < flow.steps.length; i++) {
    if (!isValidStep(flow.steps[i])) {
      warn(
        `flow "${flow.id}" step at index ${i} is malformed: ` +
          `\`target\`, \`title\` and \`description\` must all be strings.`
      );
      return false;
    }
  }

  const ids = flow.steps
    .map((step) => step.id)
    .filter((id): id is string => typeof id === "string");
  const duplicate = ids.find((id, i) => ids.indexOf(id) !== i);
  if (duplicate !== undefined) {
    warn(
      `flow "${flow.id}" has duplicate step id "${duplicate}"; ` +
        `goTo("${duplicate}") will resolve to the first match.`
    );
  }

  return true;
}
