import type { PlannedDay, WeeklyPlan } from "./types.js";

/** Render one or more weekly plans as readable console text. */
export function formatPlans(plans: WeeklyPlan[]): string {
  return plans.map(formatWeek).join("\n\n");
}

function formatWeek(plan: WeeklyPlan): string {
  const lines: string[] = [];
  const header = `WEEK ${plan.weekNumber}  ·  phase: ${plan.phase.toUpperCase()}  ·  session target: ${plan.sessionMinutes} min`;
  lines.push(header);
  lines.push("=".repeat(header.length));

  for (const day of plan.days) {
    lines.push("");
    lines.push(formatDay(day));
  }

  if (plan.notes.length > 0) {
    lines.push("");
    lines.push("Notes:");
    for (const note of plan.notes) lines.push(`  - ${note}`);
  }

  return lines.join("\n");
}

function formatDay(day: PlannedDay): string {
  const lines: string[] = [];
  const isSession = day.exercises.length > 0;
  const timing = isSession
    ? `  [${day.estimatedMinutes}/${day.targetMinutes} min]`
    : "";
  lines.push(`${day.day} — ${day.label}${timing}`);

  if (day.run && isSession) {
    lines.push(`    Run: ${describeRun(day)}`);
  }

  if (isSession) {
    for (const ex of day.exercises) {
      const weight =
        ex.targetWeightKg !== null ? `@ ${ex.targetWeightKg}kg` : "@ bodyweight/choose";
      const note = ex.notes ? `  (${ex.notes})` : "";
      lines.push(
        `    • ${ex.name}: ${ex.sets}x${ex.repRange} ${weight}  ~${ex.estimatedMinutes} min${note}`,
      );
    }
    if (day.notes) lines.push(`    ${day.notes}`);
  } else if (day.run) {
    lines.push(`    ${describeRun(day)}`);
  }

  return lines.join("\n");
}

function describeRun(day: PlannedDay): string {
  const run = day.run;
  if (!run) return "";
  const bits: string[] = [`${run.type}`];
  if (run.distanceKm !== undefined) bits.push(`${run.distanceKm} km`);
  if (run.durationMinutes !== undefined) bits.push(`${run.durationMinutes} min`);
  return bits.join(", ");
}
