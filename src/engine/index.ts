/**
 * Recommendation engine — pure functions only.
 *
 * This module must never import Express, the database, or the logger.
 * Everything it needs arrives as plain data, which makes it trivially
 * unit-testable and easy to describe in the report.
 *
 * Implemented so far:
 * - `generateCandidateWindows` (step 1)
 *
 * Planned:
 * - `computeCoverage`     (step 2: bitmask + weights)
 * - `rankWindows`         (step 3: merge + score)
 * - `buildCoveragePlan`   (step 4: greedy, then exact set cover)
 * - `recommend`           (orchestrator used by the service layer)
 */

export * from "./types.js";
export { generateCandidateWindows } from "./windows.js";
export type { GenerateWindowsInput } from "./windows.js";
