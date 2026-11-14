export type Units = 'imperial' | 'metric';
export type Experience = 'novice' | 'intermediate' | 'advanced';
export type Role = 'anchor' | 'accessory' | 'dynamic' | 'core';
export type Rating = 'easy' | 'right' | 'hard';
export type Muscle =
  | 'abdominals' | 'abductors' | 'adductors' | 'biceps' | 'calves' | 'chest' | 'forearms' | 'glutes' | 'hamstrings'
  | 'lats' | 'lower back' | 'middle back' | 'neck' | 'quadriceps' | 'shoulders' | 'traps' | 'triceps';
export type AnchorLift = 'squat' | 'bench' | 'deadlift' | 'ohp';

export interface Profile {
  experience: Experience;
  days: 3 | 4 | 5;
  sessionMin: 45 | 60 | 75;
  units: Units;
  coldExperience: 'new' | 'some' | 'regular';
  /** Weight the user can lift for ~5 good reps (in profile units). */
  startLifts: Partial<Record<AnchorLift, number>>;
  pullupReps?: number;
  priorities: string[];
  kettlebells: number[];
  dumbbellMax: number;
  limitations: string;
  /** ISO date (YYYY-MM-DD) of the Monday the 12-week cycle started. */
  startDate: string;
  cycle: number;
}

/** Per-exercise progression memory. */
export interface ExState {
  weight: number;
  /** Current rep (or seconds) target for double progression. */
  repTarget: number;
  /** Rep scheme the weight was computed for — anchors recalc when a block changes it. */
  schemeReps?: number;
  e1rm?: number;
  painFlags: number;
  misses: number;
}

export interface LoggedSet {
  kind: 'warmup' | 'work';
  targetReps: number;
  targetWeight: number;
  weight: number;
  reps: number;
  rpe?: number;
  done: boolean;
}

export interface LoggedExercise {
  exId: string;
  role: Role;
  repRange: [number, number];
  rpeTarget?: string;
  restSec: number;
  sets: LoggedSet[];
  rating?: Rating;
  pain?: boolean;
  /** Mobility block inside a lifting session (primer / cool-down). */
  flowId?: string;
  flowDone?: boolean;
  slotKey?: string;
}

export interface Change {
  exId: string;
  name: string;
  change: string;
  why: string;
  tone: 'up' | 'hold' | 'down' | 'info';
}

export interface WorkoutLog {
  id: string;
  date: string;
  week: number;
  dayId: string;
  name: string;
  units: Units;
  startedAt: number;
  endedAt?: number;
  short?: boolean;
  exercises: LoggedExercise[];
  sessionRpe?: number;
  hips?: 'tight' | 'ok' | 'loose';
  notes?: string;
  changes?: Change[];
}

export interface MobilityLog {
  id: string;
  date: string;
  flowId: string;
  minutes: number;
}

export interface RomTest {
  id: string;
  date: string;
  kneeWallL?: number;
  kneeWallR?: number;
  sit9090L?: number;
  sit9090R?: number;
  hipIrL?: number;
  hipIrR?: number;
  deepSquatSec?: number;
}

export type OutdoorType = 'dunes' | 'ruck' | 'walk' | 'sprints' | 'other';

export interface OutdoorLog {
  id: string;
  date: string;
  type: OutdoorType;
  units: Units;
  /** Dune / sprint rep times in seconds. */
  reps?: number[];
  sand?: string;
  rpe?: number;
  avgHr?: number;
  load?: number;
  distance?: number;
  minutes?: number;
  notes?: string;
}

export interface RecoveryLog {
  id: string;
  date: string;
  units: Units;
  lakeTemp?: number;
  saunaTemp?: number;
  rounds: { saunaMin: number; coldSec: number }[];
}

export interface AppState {
  version: 1;
  profile?: Profile;
  exState: Record<string, ExState>;
  workouts: WorkoutLog[];
  active?: WorkoutLog;
  mobility: MobilityLog[];
  rom: RomTest[];
  outdoor: OutdoorLog[];
  recovery: RecoveryLog[];
  /** date → dayId when the user swaps today's session. */
  dayOverrides: Record<string, string>;
  /** slotKey (dayId:index) → exercise id, for user exercise swaps. */
  swaps: Record<string, string>;
  /** Until this date, the hip primer adds extra hip-flexor work. */
  hipFocusUntil?: string;
}
