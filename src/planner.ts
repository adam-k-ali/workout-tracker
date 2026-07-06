import {
  DAYS,
  type Day,
  type Exercise,
  type MovementFocus,
  type PlannedDay,
  type PlannedExercise,
  type Profile,
  type Run,
  type SessionMinutes,
  type WeeklyPlan,
  type Workout,
} from "./types.js";
import {
  exerciseMinutes,
  prescriptionFor,
  warmupMinutes,
  type SetPrescription,
} from "./timing.js";

/** A run counts as "hard" (leg/systemic fatigue) unless it's an easy run. */
function isHardRun(run: Run): boolean {
  return run.type !== "easy";
}

/** Push/pull/legs rotation used to assign each gym day a focus. */
const FOCUS_ROTATION: MovementFocus[] = ["push", "pull", "legs"];

const MIN_SETS = 2;

export interface PlannerInput {
  profile: Profile;
  runs: Run[];
  history: Workout[];
  exercises: Exercise[];
  /** Number of weeks to generate (defaults to 1). */
  weeks?: number;
  /** Overrides `profile.sessionMinutes` when provided. */
  sessionMinutes?: SessionMinutes;
}

/** Generate one or more weekly plans. */
export function generatePlan(input: PlannerInput): WeeklyPlan[] {
  const { profile, runs, exercises } = input;
  const weeks = Math.max(1, input.weeks ?? 1);
  const sessionMinutes = input.sessionMinutes ?? profile.sessionMinutes;

  const runByDay = new Map<Day, Run>();
  for (const run of runs) runByDay.set(run.day, run);

  // A mutable, growing history so multi-week plans progress week over week.
  const history: Workout[] = [...input.history];

  const plans: WeeklyPlan[] = [];
  for (let week = 1; week <= weeks; week++) {
    plans.push(
      buildWeek({
        week,
        profile,
        sessionMinutes,
        runByDay,
        exercises,
        history,
      }),
    );
  }
  return plans;
}

interface BuildWeekArgs {
  week: number;
  profile: Profile;
  sessionMinutes: SessionMinutes;
  runByDay: Map<Day, Run>;
  exercises: Exercise[];
  history: Workout[];
}

function buildWeek(args: BuildWeekArgs): WeeklyPlan {
  const { week, profile, sessionMinutes, runByDay, exercises, history } = args;
  const { phase } = profile;

  const gymDayIndices = chooseGymDays(runByDay, profile.gymDaysPerWeek);
  const focusByDayIndex = assignFocuses(gymDayIndices, runByDay, week);

  const days: PlannedDay[] = [];
  const legsBeforeHardRun: string[] = [];

  for (let i = 0; i < DAYS.length; i++) {
    const day = DAYS[i]!;
    const run = runByDay.get(day);
    const focus = focusByDayIndex.get(i);

    if (focus) {
      const session = buildSession({
        day,
        focus,
        phase,
        sessionMinutes,
        exercises,
        history,
        run,
      });
      days.push(session);

      // Warn if a leg session sits right before a hard run.
      if (focus === "legs") {
        const next = runByDay.get(DAYS[i + 1]!);
        if (next && isHardRun(next)) {
          legsBeforeHardRun.push(`${day} legs precedes ${DAYS[i + 1]} ${next.type} run`);
        }
      }
    } else if (run) {
      days.push({
        day,
        label: `${capitalize(run.type)} run`,
        run,
        exercises: [],
        targetMinutes: run.durationMinutes ?? 0,
        estimatedMinutes: run.durationMinutes ?? 0,
      });
    } else {
      days.push({
        day,
        label: "Rest",
        exercises: [],
        targetMinutes: 0,
        estimatedMinutes: 0,
      });
    }
  }

  return {
    weekNumber: week,
    phase,
    sessionMinutes,
    days,
    notes: buildNotes(profile, legsBeforeHardRun),
  };
}

/**
 * Choose which weekdays are gym days. Gym days are spread evenly across the week
 * and biased away from run days (especially hard runs), so lifting doesn't
 * clash with the running that takes priority.
 */
function chooseGymDays(runByDay: Map<Day, Run>, count: number): number[] {
  const n = Math.max(0, Math.min(count, DAYS.length));
  if (n === 0) return [];

  const tier = (index: number): number => {
    const run = runByDay.get(DAYS[index]!);
    if (!run) return 0; // no run: ideal
    return isHardRun(run) ? 2 : 1; // easy run: ok, hard run: avoid
  };

  // Evenly spaced target positions across the 7-day week.
  const targets: number[] = [];
  for (let i = 0; i < n; i++) {
    targets.push(n === 1 ? 3 : Math.round((i * (DAYS.length - 1)) / (n - 1)));
  }

  const chosen: number[] = [];
  for (const target of targets) {
    let best = -1;
    let bestKey: [number, number, number] | null = null;
    for (let d = 0; d < DAYS.length; d++) {
      if (chosen.includes(d)) continue;
      // Prefer low tier (avoid runs) first, then closeness to the target slot.
      const key: [number, number, number] = [tier(d), Math.abs(d - target), d];
      if (bestKey === null || keyLess(key, bestKey)) {
        bestKey = key;
        best = d;
      }
    }
    if (best >= 0) chosen.push(best);
  }
  return chosen.sort((a, b) => a - b);
}

function keyLess(a: [number, number, number], b: [number, number, number]): boolean {
  if (a[0] !== b[0]) return a[0] < b[0];
  if (a[1] !== b[1]) return a[1] < b[1];
  return a[2] < b[2];
}

/**
 * Assign a push/pull/legs focus to each gym day, rotating the starting point by
 * week for variety, then trying to move a legs day off a slot right before a
 * hard run.
 */
function assignFocuses(
  gymDayIndices: number[],
  runByDay: Map<Day, Run>,
  week: number,
): Map<number, MovementFocus> {
  const result = new Map<number, MovementFocus>();
  const offset = (week - 1) % FOCUS_ROTATION.length;
  gymDayIndices.forEach((dayIndex, i) => {
    result.set(dayIndex, FOCUS_ROTATION[(i + offset) % FOCUS_ROTATION.length]!);
  });

  const precedesHardRun = (dayIndex: number): boolean => {
    const next = runByDay.get(DAYS[dayIndex + 1]!);
    return !!next && isHardRun(next);
  };

  // If a legs day precedes a hard run, try swapping with a gym day that doesn't.
  for (const legsDay of gymDayIndices) {
    if (result.get(legsDay) !== "legs") continue;
    if (!precedesHardRun(legsDay)) continue;
    const swapWith = gymDayIndices.find(
      (d) => d !== legsDay && !precedesHardRun(d),
    );
    if (swapWith !== undefined) {
      const other = result.get(swapWith)!;
      result.set(swapWith, "legs");
      result.set(legsDay, other);
    }
  }
  return result;
}

interface BuildSessionArgs {
  day: Day;
  focus: MovementFocus;
  phase: Profile["phase"];
  sessionMinutes: SessionMinutes;
  exercises: Exercise[];
  history: Workout[];
  run?: Run;
}

function buildSession(args: BuildSessionArgs): PlannedDay {
  const { day, focus, phase, sessionMinutes, exercises, history, run } = args;

  const warmup = warmupMinutes(sessionMinutes);
  const budget = sessionMinutes - warmup;

  const selected = selectExercises(focus, phase, budget, exercises);

  const plannedExercises: PlannedExercise[] = [];
  const logForHistory: Workout["exercises"] = [];

  for (const { exercise, prescription } of selected) {
    const progression = suggestWeight(exercise, prescription, history);
    const notes: string[] = [];
    if (phase === "cut" && exercise.category === "isolation") {
      notes.push("superset to save time");
    }
    if (progression.note) notes.push(progression.note);

    plannedExercises.push({
      name: exercise.name,
      sets: prescription.sets,
      repRange: prescription.repRange,
      targetWeightKg: progression.weightKg,
      estimatedMinutes: round1(
        exerciseMinutes(prescription.sets, prescription.restSeconds),
      ),
      notes: notes.length ? notes.join("; ") : undefined,
    });

    // Feed the plan back into history so later weeks progress from it.
    logForHistory.push({
      exercise: exercise.name,
      sets: prescription.sets,
      reps: topOfRange(prescription.repRange),
      weightKg: progression.weightKg ?? 0,
    });
  }

  history.push({ date: `plan-w-${day}`, exercises: logForHistory });

  const estimated =
    warmup +
    plannedExercises.reduce((sum, ex) => sum + ex.estimatedMinutes, 0);

  const label = run
    ? `${capitalize(focus)} (gym) + ${run.type} run`
    : `${capitalize(focus)} (gym)`;

  return {
    day,
    label,
    focus,
    run,
    exercises: plannedExercises,
    targetMinutes: sessionMinutes,
    estimatedMinutes: round1(estimated),
    notes: `~${warmup} min warm-up included`,
  };
}

interface SelectedExercise {
  exercise: Exercise;
  prescription: SetPrescription;
}

/**
 * Budget-aware, greedy selection that fills the available time. The top-ranked
 * preferred compound for the focus is anchored first (trimmed to fit if the
 * session is very short), then accessories are added while they fit, favoring
 * preferred lifts, compounds, and muscle-group coverage.
 */
function selectExercises(
  focus: MovementFocus,
  phase: Profile["phase"],
  budgetMinutes: number,
  exercises: Exercise[],
): SelectedExercise[] {
  const pool = exercises.filter((e) => e.focus === focus);
  const chosen: SelectedExercise[] = [];
  const covered = new Set<string>();
  let remaining = budgetMinutes;

  const take = (exercise: Exercise, sets: number, minutes: number) => {
    const base = prescriptionFor(exercise.category, phase);
    chosen.push({ exercise, prescription: { ...base, sets } });
    for (const m of exercise.muscles) covered.add(m);
    remaining -= minutes;
    const idx = pool.indexOf(exercise);
    if (idx >= 0) pool.splice(idx, 1);
  };

  // Anchor: the best preferred compound for this focus, trimmed to fit if needed.
  const anchor = [...pool]
    .filter((e) => e.preferred && e.category === "compound")
    .sort((a, b) => score(b, covered) - score(a, covered))[0];
  if (anchor) {
    const presc = prescriptionFor(anchor.category, phase);
    const full = exerciseMinutes(presc.sets, presc.restSeconds);
    if (full <= remaining) {
      take(anchor, presc.sets, full);
    } else {
      const sets = maxFittingSets(presc, remaining);
      if (sets >= 1) {
        take(anchor, sets, exerciseMinutes(sets, presc.restSeconds));
      }
    }
  }

  // Fill remaining time, re-ranking by coverage each pass.
  while (pool.length > 0) {
    const candidate = [...pool].sort(
      (a, b) => score(b, covered) - score(a, covered),
    )[0]!;
    const presc = prescriptionFor(candidate.category, phase);
    const full = exerciseMinutes(presc.sets, presc.restSeconds);
    if (full <= remaining) {
      take(candidate, presc.sets, full);
      continue;
    }
    // Doesn't fit at full volume: try trimming, else drop it and try smaller ones.
    const sets = maxFittingSets(presc, remaining);
    if (sets >= MIN_SETS) {
      take(candidate, sets, exerciseMinutes(sets, presc.restSeconds));
    } else {
      const idx = pool.indexOf(candidate);
      pool.splice(idx, 1);
    }
  }

  return chosen;
}

function maxFittingSets(presc: SetPrescription, remaining: number): number {
  let sets = presc.sets;
  while (sets >= 1 && exerciseMinutes(sets, presc.restSeconds) > remaining) {
    sets--;
  }
  return sets;
}

/** Ranking score: preferred > compound > new-muscle coverage. */
function score(exercise: Exercise, covered: Set<string>): number {
  let s = 0;
  if (exercise.preferred) s += 1000;
  if (exercise.category === "compound") s += 100;
  const newMuscles = exercise.muscles.filter((m) => !covered.has(m)).length;
  s += newMuscles * 10;
  return s;
}

interface Progression {
  weightKg: number | null;
  note?: string;
}

/** Progressive overload from the most recent matching logged exercise. */
function suggestWeight(
  exercise: Exercise,
  prescription: SetPrescription,
  history: Workout[],
): Progression {
  const last = mostRecentLog(history, exercise.name);
  if (!last) {
    return { weightKg: null, note: "new lift — leave 2-3 reps in reserve" };
  }
  if (last.weightKg <= 0) {
    return { weightKg: null, note: "bodyweight" };
  }
  const top = topOfRange(prescription.repRange);
  if (last.reps >= top) {
    const increment = exercise.category === "compound" && last.weightKg >= 60 ? 5 : 2.5;
    return {
      weightKg: last.weightKg + increment,
      note: `+${increment}kg (hit ${last.reps} reps last time)`,
    };
  }
  return {
    weightKg: last.weightKg,
    note: `hold ${last.weightKg}kg, add reps`,
  };
}

function mostRecentLog(history: Workout[], name: string) {
  for (let i = history.length - 1; i >= 0; i--) {
    const match = history[i]!.exercises.find((e) => e.exercise === name);
    if (match) return match;
  }
  return undefined;
}

function buildNotes(profile: Profile, legsBeforeHardRun: string[]): string[] {
  const notes: string[] = [];
  const { phase, currentWeightKg, goalWeightKg } = profile;

  if (phase === "cut") {
    const toLose = round1(currentWeightKg - goalWeightKg);
    notes.push(
      `Cut phase: keep a moderate calorie deficit (targeting ~${Math.max(0, toLose)}kg fat loss). ` +
        "Higher reps, short rest, and supersets preserve strength while adding conditioning.",
    );
    if (currentWeightKg <= goalWeightKg) {
      notes.push(
        "You've reached your goal weight — consider switching your profile phase to 'bulk' to start building muscle.",
      );
    }
  } else {
    notes.push(
      "Bulk phase: eat in a slight calorie surplus, push heavier loads with lower reps and more total sets to build muscle.",
    );
  }

  notes.push(
    "Running is the priority: gym days are placed to avoid clashing with hard runs. Fuel and recover around your key sessions.",
  );

  for (const warning of legsBeforeHardRun) {
    notes.push(`Heads up: ${warning}. Keep leg volume conservative or shuffle the run.`);
  }

  return notes;
}

function topOfRange(range: string): number {
  const parts = range.split("-");
  return Number(parts[parts.length - 1]);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
