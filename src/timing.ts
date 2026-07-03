import type { ExerciseCategory, Phase } from "./types.js";

/**
 * Time-cost model. Used by the planner to fit a session's exercises into the
 * configured duration budget.
 *
 * A set's time cost = time under tension/execution + rest before the next set.
 * Compounds take longer to set up and need longer rest than isolation work,
 * and a `cut` uses shorter rest than a `bulk` (more density, less absolute load).
 */

/** Approximate active execution time for a single working set, in seconds. */
const SECONDS_PER_SET_EXECUTION = 45;

export interface SetPrescription {
  sets: number;
  repRange: string;
  restSeconds: number;
}

/**
 * Base prescription driven by phase and exercise category.
 * - cut: higher reps, shorter rest, strength-preserving.
 * - bulk: lower reps, heavier, longer rest, more volume.
 */
export function prescriptionFor(
  category: ExerciseCategory,
  phase: Phase,
): SetPrescription {
  if (phase === "cut") {
    return category === "compound"
      ? { sets: 4, repRange: "8-12", restSeconds: 90 }
      : { sets: 3, repRange: "12-15", restSeconds: 60 };
  }
  // bulk
  return category === "compound"
    ? { sets: 4, repRange: "5-8", restSeconds: 180 }
    : { sets: 3, repRange: "8-12", restSeconds: 90 };
}

/** Estimated wall-clock minutes for an exercise given its sets and rest. */
export function exerciseMinutes(sets: number, restSeconds: number): number {
  const totalSeconds = sets * (SECONDS_PER_SET_EXECUTION + restSeconds);
  return totalSeconds / 60;
}

/**
 * Warm-up allowance reserved before working sets, scaled to session length so
 * short sessions don't lose most of their time to warming up.
 */
export function warmupMinutes(sessionMinutes: number): number {
  if (sessionMinutes <= 15) return 3;
  if (sessionMinutes <= 30) return 5;
  if (sessionMinutes <= 45) return 6;
  return 8;
}
