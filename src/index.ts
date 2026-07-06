import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { EXERCISES } from "./data/exercises.js";
import { formatPlans } from "./format.js";
import { generatePlan } from "./planner.js";
import {
  SESSION_MINUTES_OPTIONS,
  type Profile,
  type Run,
  type SessionMinutes,
  type Workout,
} from "./types.js";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(dataDir, file), "utf8")) as T;
}

interface CliOptions {
  weeks: number;
  duration?: SessionMinutes;
  json: boolean;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { weeks: 1, json: false };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--json":
        options.json = true;
        break;
      case "--weeks": {
        const value = Number(argv[++i]);
        if (!Number.isInteger(value) || value < 1) {
          fail(`--weeks expects a positive integer, got "${argv[i]}"`);
        }
        options.weeks = value;
        break;
      }
      case "--duration": {
        const value = Number(argv[++i]);
        if (!isSessionMinutes(value)) {
          fail(
            `--duration must be one of ${SESSION_MINUTES_OPTIONS.join(", ")} (15-minute increments), got "${argv[i]}"`,
          );
        }
        options.duration = value;
        break;
      }
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
      default:
        fail(`Unknown argument: "${arg}"`);
    }
  }

  return options;
}

function isSessionMinutes(value: number): value is SessionMinutes {
  return (SESSION_MINUTES_OPTIONS as readonly number[]).includes(value);
}

function fail(message: string): never {
  console.error(`Error: ${message}\n`);
  printHelp();
  process.exit(1);
}

function printHelp(): void {
  console.log(
    [
      "Workout Planner",
      "",
      "Usage: npm run plan -- [options]",
      "",
      "Options:",
      "  --weeks <n>       Number of weeks to generate (default: 1)",
      `  --duration <min>  Session length: ${SESSION_MINUTES_OPTIONS.join(" | ")} (overrides profile)`,
      "  --json            Output the plan as JSON",
      "  -h, --help        Show this help",
    ].join("\n"),
  );
}

function main(): void {
  const options = parseArgs(process.argv.slice(2));

  const profile = loadJson<Profile>("profile.json");
  const runs = loadJson<Run[]>("runs.json");
  const history = loadJson<Workout[]>("workouts.json");

  if (!isSessionMinutes(profile.sessionMinutes)) {
    fail(
      `profile.json sessionMinutes must be one of ${SESSION_MINUTES_OPTIONS.join(", ")}, got "${profile.sessionMinutes}"`,
    );
  }

  const plans = generatePlan({
    profile,
    runs,
    history,
    exercises: EXERCISES,
    weeks: options.weeks,
    sessionMinutes: options.duration,
  });

  if (options.json) {
    console.log(JSON.stringify(plans, null, 2));
  } else {
    console.log(formatPlans(plans));
  }
}

main();
