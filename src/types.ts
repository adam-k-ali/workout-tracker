/**
 * Domain types for the workout planner.
 */

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type Day = (typeof DAYS)[number];

export type Equipment = "barbell" | "dumbbell" | "machine" | "cable" | "bodyweight";

export type MuscleGroup =
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core";

export type ExerciseCategory = "compound" | "isolation";

/** Which push/pull/legs bucket an exercise belongs to, used to fill a day's focus. */
export type MovementFocus = "push" | "pull" | "legs";

export interface Exercise {
  name: string;
  category: ExerciseCategory;
  equipment: Equipment;
  focus: MovementFocus;
  /** Primary muscles worked, most important first. */
  muscles: MuscleGroup[];
  /** Exercises the user enjoys; prioritized and used as session anchors. */
  preferred: boolean;
}

export type RunType = "easy" | "tempo" | "long" | "interval";

export interface Run {
  day: Day;
  type: RunType;
  /** Distance in kilometers (optional if duration is given). */
  distanceKm?: number;
  /** Planned duration in minutes (optional if distance is given). */
  durationMinutes?: number;
}

/** A single exercise as recorded in a past session. */
export interface LoggedExercise {
  exercise: string;
  sets: number;
  reps: number;
  /** Working weight in kg (0 for bodyweight). */
  weightKg: number;
}

export interface Workout {
  /** ISO date (YYYY-MM-DD) of the completed session. */
  date: string;
  exercises: LoggedExercise[];
}

export type Phase = "cut" | "bulk";

/** Allowed session lengths: 15-minute increments from 15 min to 1h30. */
export type SessionMinutes = 15 | 30 | 45 | 60 | 75 | 90;

export const SESSION_MINUTES_OPTIONS: readonly SessionMinutes[] = [
  15, 30, 45, 60, 75, 90,
] as const;

export interface Profile {
  currentWeightKg: number;
  goalWeightKg: number;
  phase: Phase;
  gymDaysPerWeek: number;
  sessionMinutes: SessionMinutes;
}

/** A concrete exercise prescription within a planned session. */
export interface PlannedExercise {
  name: string;
  sets: number;
  /** Prescribed rep range, e.g. "10-15". */
  repRange: string;
  /** Suggested working weight in kg, or null when unknown / bodyweight. */
  targetWeightKg: number | null;
  estimatedMinutes: number;
  notes?: string;
}

export interface PlannedDay {
  day: Day;
  /** Human label, e.g. "Push (gym)", "Long run", "Rest". */
  label: string;
  focus?: MovementFocus;
  run?: Run;
  exercises: PlannedExercise[];
  targetMinutes: number;
  estimatedMinutes: number;
  notes?: string;
}

export interface WeeklyPlan {
  weekNumber: number;
  phase: Phase;
  sessionMinutes: SessionMinutes;
  days: PlannedDay[];
  notes: string[];
}
