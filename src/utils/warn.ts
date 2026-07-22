/**
 * Dev-only console warning. Silenced when NODE_ENV is "production" so illegal
 * API calls surface loudly in development without shipping noise to prod.
 */
export function warn(message: string): void {
  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } })
    .process?.env?.NODE_ENV;
  if (nodeEnv === "production") return;
  console.warn(`[react-step-flow] ${message}`);
}
