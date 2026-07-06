# Workout Planner

A small, dependency-light TypeScript CLI that generates a weekly **gym** workout plan for a runner. It:

- Builds each session around the lifts you enjoy (deadlift, barbell squat, lat row, bench press).
- Schedules gym days **around your planned runs** (running is the priority sport), keeping heavy legs away from hard run days.
- Reflects on your **previous workouts** to apply progressive overload.
- Adapts volume and rep ranges to your current **goal phase**: `cut` (lose fat) then `bulk` (build muscle).
- Fits each session to a **configurable duration** (15-minute increments from 15 min to 1h30) by picking exercises to fill the available time, always anchoring on your favorite compound lifts.

## Requirements

- Node.js 18+ (uses ES modules).

## Install

```bash
npm install
```

## Usage

```bash
npm run plan                 # generate this week's plan using your profile settings
npm run plan -- --weeks 2    # generate two weeks
npm run plan -- --duration 45   # override session length (15|30|45|60|75|90)
npm run plan -- --json       # emit the plan as JSON instead of formatted text
```

`--duration` overrides `sessionMinutes` from your profile. Only 15-minute increments
between 15 and 90 are accepted.

## Editing your data

All inputs live in `src/data/` and are easy to edit:

- `profile.json` — your current weight, goal weight, phase (`cut`/`bulk`), gym days per week, and default session length.
- `runs.json` — your planned runs for the week (day, type, distance/duration).
- `workouts.json` — a log of past gym sessions used for progressive overload.
- `exercises.ts` — the exercise library. Exercises flagged `preferred: true` are prioritized and used as session anchors.

## Type checking

```bash
npm run typecheck
```
