import { ex, FLOWS } from './library';
import type { AppState, ExState, LoggedExercise, LoggedSet, Profile, Role, Units, WorkoutLog } from './types';

// ---------- Dates ----------

export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const addDays = (iso: string, n: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

/** 0 = Monday … 6 = Sunday */
export const dayIndex = (iso: string) => (fromISO(iso).getDay() + 6) % 7;

export const mondayOf = (iso: string) => addDays(iso, -dayIndex(iso));

export const daysBetween = (a: string, b: string) =>
  Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);

export const TOTAL_WEEKS = 12;

/** 1-based program week (can exceed 12 once the cycle is finished). */
export const weekOf = (p: Profile, iso: string) => Math.floor(daysBetween(p.startDate, iso) / 7) + 1;

export const clampWeek = (w: number) => Math.min(TOTAL_WEEKS, Math.max(1, w));

// ---------- Phases ----------

export type Phase = 'accumulate' | 'build' | 'strength' | 'deload' | 'test';

export const PHASES: Phase[] = ['accumulate', 'accumulate', 'accumulate', 'deload', 'build', 'build', 'build', 'deload', 'strength', 'strength', 'strength', 'test'];

export const phaseOf = (week: number): Phase => PHASES[clampWeek(week) - 1];

/** 0, 1 or 2 — which block's dynamic exercises to use. */
export const blockOf = (week: number) => (week <= 4 ? 0 : week <= 8 ? 1 : 2);

/** Position inside a 3-week block (0–2); deload/test weeks return 2. */
const weekInBlock = (week: number) => Math.min(2, (clampWeek(week) - 1) % 4);

export const PHASE_LABEL: Record<Phase, string> = {
  accumulate: 'Accumulate',
  build: 'Build',
  strength: 'Strength',
  deload: 'Deload',
  test: 'Test',
};

// ---------- Day templates ----------

export interface Slot {
  /** A fixed exercise, or one per block for the rotating dynamic slot. */
  ex: string | [string, string, string];
  role: Role;
}

export interface DayTemplate {
  id: string;
  name: string;
  short: string;
  kind: 'lift' | 'mobility' | 'outdoor' | 'rest';
  slots?: Slot[];
  primer?: string;
  coolDown?: string;
  flow?: string;
  outdoor?: 'dunes' | 'ruck' | 'walk';
  recovery?: boolean;
  detail: string;
}

export const DAYS: Record<string, DayTemplate> = {
  lowerA: {
    id: 'lowerA', name: 'Lower A — Squat', short: 'Lower A\nSquat', kind: 'lift', primer: 'primer', coolDown: 'coolDown', recovery: true,
    detail: 'Squat · RDL · split squat · dynamic · Copenhagen',
    slots: [
      { ex: 'squat', role: 'anchor' },
      { ex: 'rdl', role: 'accessory' },
      { ex: 'bss', role: 'accessory' },
      { ex: ['kbLatLungePress', 'kbCleanPress', 'kbSnatch'], role: 'dynamic' },
      { ex: 'copenhagen', role: 'core' },
    ],
  },
  upperA: {
    id: 'upperA', name: 'Upper A — Bench', short: 'Upper A\nBench', kind: 'lift', primer: 'primer', recovery: true,
    detail: 'Bench · row · incline DB · face pull · dynamic',
    slots: [
      { ex: 'bench', role: 'anchor' },
      { ex: 'bbRow', role: 'accessory' },
      { ex: 'dbIncline', role: 'accessory' },
      { ex: 'facePull', role: 'accessory' },
      { ex: ['kbSwingDyn', 'tgu', 'kbSlRdlRow'], role: 'dynamic' },
    ],
  },
  lowerB: {
    id: 'lowerB', name: 'Lower B — Deadlift', short: 'Lower B\nDeadlift', kind: 'lift', primer: 'primer', coolDown: 'coolDown', recovery: true,
    detail: 'Deadlift · front squat · hip thrust · single-leg RDL · carry',
    slots: [
      { ex: 'deadlift', role: 'anchor' },
      { ex: 'frontSquat', role: 'accessory' },
      { ex: 'hipThrust', role: 'accessory' },
      { ex: 'kbSlRdl', role: 'accessory' },
      { ex: 'suitcaseCarry', role: 'core' },
    ],
  },
  upperB: {
    id: 'upperB', name: 'Upper B — Press + Pull', short: 'Upper B\nPress + pull', kind: 'lift', primer: 'primer', recovery: true,
    detail: 'OHP · pull-ups · DB bench · curls · triceps · dynamic',
    slots: [
      { ex: 'ohp', role: 'anchor' },
      { ex: 'pullup', role: 'anchor' },
      { ex: 'dbBench', role: 'accessory' },
      { ex: 'dbCurl', role: 'accessory' },
      { ex: 'dbOhExt', role: 'accessory' },
      { ex: ['cossack', 'latBound', 'jumpSquat'], role: 'dynamic' },
    ],
  },
  fullB: {
    id: 'fullB', name: 'Full Body — Deadlift + Press', short: 'Full body\nDL + press', kind: 'lift', primer: 'primer', coolDown: 'coolDown', recovery: true,
    detail: 'Deadlift · OHP · pull-ups · split squat · dynamic · carry',
    slots: [
      { ex: 'deadlift', role: 'anchor' },
      { ex: 'ohp', role: 'anchor' },
      { ex: 'pullup', role: 'anchor' },
      { ex: 'bss', role: 'accessory' },
      { ex: ['cossack', 'latBound', 'jumpSquat'], role: 'dynamic' },
      { ex: 'suitcaseCarry', role: 'core' },
    ],
  },
  armsKb: {
    id: 'armsKb', name: 'Arms + KB Conditioning', short: 'Arms\n+ KB', kind: 'lift', primer: 'primer', recovery: true,
    detail: 'KB swings · curls · triceps · face pulls · dead bugs',
    slots: [
      { ex: 'kbSwing', role: 'accessory' },
      { ex: 'dbCurl', role: 'accessory' },
      { ex: 'dbOhExt', role: 'accessory' },
      { ex: 'facePull', role: 'accessory' },
      { ex: 'deadBug', role: 'core' },
    ],
  },
  mobilityWalk: {
    id: 'mobilityWalk', name: 'Hip Mobility Flow + Beach Walk', short: 'Mobility 20′\n+ beach walk', kind: 'mobility', flow: 'hipFlow', outdoor: 'walk',
    detail: '20 min guided flow · 45–60 min easy walk',
  },
  mobility: {
    id: 'mobility', name: 'Hip Mobility Flow', short: 'Mobility\nflow', kind: 'mobility', flow: 'hipFlow',
    detail: '25 min guided hip flow',
  },
  dunes: {
    id: 'dunes', name: 'Dune Hill Repeats + Hip Primer', short: 'Dune hills\n+ hip flow', kind: 'outdoor', outdoor: 'dunes', flow: 'primer',
    detail: 'Uphill repeats of 20–40 s, walk down · 10 min mobility',
  },
  dunesFlow: {
    id: 'dunesFlow', name: 'Dune Hills + Hip Mobility Flow', short: 'Dunes\n+ mobility', kind: 'outdoor', outdoor: 'dunes', flow: 'hipFlow',
    detail: 'Uphill repeats, walk down · 20 min guided flow',
  },
  ruck: {
    id: 'ruck', name: 'Ruck + Sauna / Cold Lake', short: 'Ruck\n+ sauna/lake', kind: 'outdoor', outdoor: 'ruck', flow: 'coolDown', recovery: true,
    detail: '60–90 min ruck · contrast recovery · cool-down flow',
  },
};

/** Serratus + shoulder-blade block, done after the hip primer on each lifting day. */
export const SHOULDER_BLOCK: Record<string, string[]> = {
  lowerA: ['pushupPlus', 'wallSlide', 'bandER'],
  upperA: ['serratusPunch', 'scaption', 'bandER'],
  lowerB: ['bandPunch', 'wallSlide', 'bearHold'],
  upperB: ['pushupPlus', 'serratusPunch', 'bandER'],
  fullB: ['serratusPunch', 'wallSlide', 'bandER'],
  armsKb: ['bandPunch', 'scaption', 'bearHold'],
};

/** Monday → Sunday. */
export const SCHEDULES: Record<3 | 4 | 5, string[]> = {
  3: ['lowerA', 'mobilityWalk', 'upperA', 'dunes', 'fullB', 'mobility', 'ruck'],
  4: ['lowerA', 'mobilityWalk', 'upperA', 'dunes', 'lowerB', 'upperB', 'ruck'],
  5: ['lowerA', 'upperA', 'dunesFlow', 'lowerB', 'upperB', 'armsKb', 'ruck'],
};

export const scheduledDay = (p: Profile, iso: string) => SCHEDULES[p.days][dayIndex(iso)];

export const dayFor = (s: AppState, iso: string) =>
  DAYS[s.dayOverrides[iso] ?? (s.profile ? scheduledDay(s.profile, iso) : 'lowerA')];

/** The rotating dynamic slot by block, for the program screen. */
export const DYNAMIC_ROTATION = [0, 1, 2].map((b) =>
  [...new Set(Object.values(DAYS).flatMap((d) => (d.slots ?? []).filter((s) => Array.isArray(s.ex)).map((s) => (s.ex as string[])[b])))],
);

// ---------- Prescriptions ----------

export interface Prescription {
  sets: number;
  range: [number, number];
  rpe: string;
  rest: number;
}

export function prescribe(role: Role, week: number, exId: string, p: Profile): Prescription {
  const phase = phaseOf(week);
  const wib = weekInBlock(week);
  const def = ex(exId);
  const novice = p.experience === 'novice' ? 1 : 0;
  const deload = phase === 'deload';
  let rx: Prescription;

  if (role === 'prehab') {
    rx = { sets: week >= 5 ? 3 : 2, range: def.timed ? [20, 40] : [10, 15], rpe: '5–6', rest: 30 };
  } else if (def.timed) {
    rx = { sets: 3, range: [20, 40], rpe: '7', rest: 45 };
  } else if (role === 'anchor' && def.equip === 'bodyweight') {
    rx = { sets: 3 + (wib > 0 ? 1 : 0), range: [5, 10], rpe: '8', rest: 120 };
  } else if (role === 'anchor') {
    const reps = phase === 'test' ? 3 : phase === 'strength' ? 4 : phase === 'build' ? 6 : week >= 8 ? 6 : 8;
    const sets =
      phase === 'test' ? 3 : phase === 'strength' ? [4, 5, 5][wib] : phase === 'build' ? [4, 4, 5][wib] : [3, 4, 4][wib];
    const rpe = phase === 'test' ? '8–9' : phase === 'strength' ? '8–9' : phase === 'build' ? '7–9' : '7–8';
    rx = { sets, range: [reps, reps], rpe, rest: phase === 'strength' || phase === 'test' ? 180 : 150 };
  } else if (role === 'accessory') {
    const range: [number, number] = phase === 'build' ? [8, 10] : phase === 'strength' || phase === 'test' ? [8, 12] : [10, 12];
    rx = { sets: phase === 'build' && wib === 2 ? 4 : 3, range, rpe: '7–8', rest: 90 };
  } else if (role === 'dynamic') {
    rx = { sets: 3, range: [6, 8], rpe: '7', rest: 75 };
  } else {
    rx = { sets: 3, range: [8, 12], rpe: '7', rest: 45 };
  }

  if (deload) rx = { ...rx, sets: Math.max(2, Math.round(rx.sets * 0.6)), rpe: '6' };
  if (novice && rx.sets > 3) rx = { ...rx, sets: rx.sets - 1 };
  return rx;
}

// ---------- Weights ----------

/** Epley estimate; reps in reserve folded in from RPE when given. */
export const e1rm = (w: number, reps: number, rpe?: number) =>
  w <= 0 || reps <= 0 ? 0 : w * (1 + (reps + (rpe ? Math.max(0, 10 - rpe) : 0)) / 30);

/** Working weight that leaves ~2 reps in reserve. */
export const workingWeight = (oneRm: number, reps: number, rir = 2) => oneRm / (1 + (reps + rir) / 30);

export const barWeight = (u: Units) => (u === 'imperial' ? 45 : 20);

export function roundLoad(w: number, equip: string, u: Units, bells: number[]): number {
  if (equip === 'band' || equip === 'bodyweight' || w <= 0) return 0;
  if (equip === 'kettlebell' && bells.length) {
    return bells.reduce((best, b) => (Math.abs(b - w) < Math.abs(best - w) ? b : best), bells[0]);
  }
  const step = equip === 'barbell' ? (u === 'imperial' ? 5 : 2.5) : u === 'imperial' ? 5 : 2;
  const r = Math.max(step, Math.round(w / step) * step);
  return equip === 'barbell' ? Math.max(barWeight(u), r) : r;
}

/** Next heavier or lighter load for an exercise (bells step through what you own). */
export function stepLoad(w: number, dir: 1 | -1, exId: string, p: Profile, times = 1): number {
  const def = ex(exId);
  let cur = w;
  for (let i = 0; i < times; i++) {
    if (def.equip === 'kettlebell' && p.kettlebells.length) {
      const bells = [...p.kettlebells].sort((a, b) => a - b);
      const idx = bells.findIndex((b) => b >= cur);
      const at = idx === -1 ? bells.length - 1 : bells[idx] === cur ? idx : dir === 1 ? idx - 1 : idx;
      cur = bells[Math.min(bells.length - 1, Math.max(0, at + dir))];
    } else {
      const imp = p.units === 'imperial';
      const inc =
        def.equip === 'barbell' ? (def.upper ? (imp ? 5 : 2.5) : imp ? 10 : 5) : imp ? 5 : 2;
      cur = Math.max(0, cur + dir * inc);
    }
  }
  return cur;
}

export function startingE1rm(p: Profile, lift: string): number | undefined {
  const w = p.startLifts[lift as keyof Profile['startLifts']];
  return w ? e1rm(w, 5) : undefined;
}

/** Best known e1RM for an anchor: logged state first, else the setup estimate. */
export function anchorE1rm(s: AppState, lift: string) {
  return s.exState[lift]?.e1rm || (s.profile ? startingE1rm(s.profile, lift) : undefined);
}

/** Weight + rep target for the next time this exercise is done. */
export function targetFor(s: AppState, exId: string, role: Role, rx: Prescription): { weight: number; reps: number } {
  const p = s.profile!;
  const def = ex(exId);
  const st: ExState | undefined = s.exState[exId];
  const [lo, hi] = rx.range;

  if (def.equip === 'bodyweight' || def.equip === 'band') {
    const reps = st ? Math.min(hi, Math.max(lo, st.repTarget)) : exId === 'pullup' && p.pullupReps ? Math.min(hi, Math.max(lo, p.pullupReps - 2)) : lo;
    return { weight: 0, reps };
  }

  if (role === 'anchor') {
    const reps = lo;
    const oneRm = anchorE1rm(s, exId);
    if (st && st.schemeReps === reps && st.weight > 0) return { weight: st.weight, reps };
    if (!oneRm) return { weight: st?.weight ?? 0, reps };
    const rir = phaseOf(weekOf(p, todayISO())) === 'test' ? 1 : 2;
    return { weight: roundLoad(workingWeight(oneRm, reps, rir), def.equip, p.units, p.kettlebells), reps };
  }

  // Accessory / dynamic / core: double progression.
  if (st && st.weight > 0) return { weight: st.weight, reps: Math.min(hi, Math.max(lo, st.repTarget)) };
  if (def.basis) {
    const base = anchorE1rm(s, def.basis.lift);
    if (base) return { weight: roundLoad(base * def.basis.k, def.equip, p.units, p.kettlebells), reps: lo };
  }
  return { weight: st?.weight ?? 0, reps: lo };
}

export function warmups(work: number, u: Units): LoggedSet[] {
  const bar = barWeight(u);
  if (work < bar + 30) return [];
  const steps: [number, number][] = [[0.4, 8], [0.6, 5], [0.8, 3]];
  const seen = new Set<number>();
  return steps
    .map(([pct, reps]) => ({ w: Math.max(bar, roundLoad(work * pct, 'barbell', u, [])), reps }))
    .filter(({ w }) => w < work && !seen.has(w) && seen.add(w))
    .map(({ w, reps }) => ({ kind: 'warmup', targetReps: reps, targetWeight: w, weight: w, reps, done: false }));
}

export function plates(total: number, u: Units): number[] {
  const avail = u === 'imperial' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25];
  let side = (total - barWeight(u)) / 2;
  const out: number[] = [];
  for (const p of avail) {
    while (side >= p - 1e-9) {
      out.push(p);
      side -= p;
    }
  }
  return out;
}

export const resolveSlotEx = (s: AppState, dayId: string, i: number, slot: Slot, week: number) =>
  s.swaps[`${dayId}:${i}`] ?? (Array.isArray(slot.ex) ? slot.ex[blockOf(week)] : slot.ex);

export function buildExercise(s: AppState, exId: string, role: Role, week: number, slotKey?: string, setCut = 0): LoggedExercise {
  const p = s.profile!;
  const rx = prescribe(role, week, exId, p);
  const t = targetFor(s, exId, role, rx);
  const sets = Math.max(2, rx.sets - setCut);
  const work: LoggedSet[] = Array.from({ length: sets }, () => ({
    kind: 'work', targetReps: t.reps, targetWeight: t.weight, weight: t.weight, reps: t.reps, done: false,
  }));
  const isBarbellAnchor = role === 'anchor' && ex(exId).equip === 'barbell';
  return {
    exId, role, repRange: rx.range, rpeTarget: rx.rpe, restSec: rx.rest, slotKey,
    sets: [...(isBarbellAnchor ? warmups(t.weight, p.units) : []), ...work],
  };
}

export function buildSession(s: AppState, dayId: string, iso: string, short = false): WorkoutLog {
  const p = s.profile!;
  const day = DAYS[dayId];
  const week = clampWeek(weekOf(p, iso));
  const exercises: LoggedExercise[] = [];
  const flowItem = (flowId: string): LoggedExercise => ({ exId: `flow:${flowId}`, role: 'core', repRange: [0, 0], restSec: 0, sets: [], flowId });

  if (day.primer) exercises.push(flowItem(day.primer));
  if (p.shoulderBlock !== false) {
    (SHOULDER_BLOCK[dayId] ?? []).forEach((id, i) => exercises.push(buildExercise(s, s.swaps[`${dayId}:sh${i}`] ?? id, 'prehab', week, `${dayId}:sh${i}`, short ? 1 : 0)));
  }
  let slots = (day.slots ?? []).map((slot, i) => ({ slot, i }));
  if (short) {
    let acc = 0;
    slots = slots.filter(({ slot }) => slot.role === 'anchor' || (slot.role === 'accessory' && acc++ < 1) || slot.role === 'dynamic');
  } else if (p.sessionMin === 45) {
    slots = slots.filter(({ slot }) => slot.role !== 'core');
  }
  for (const { slot, i } of slots) {
    const id = resolveSlotEx(s, dayId, i, slot, week);
    exercises.push(buildExercise(s, id, slot.role, week, `${dayId}:${i}`, short ? 1 : 0));
  }
  if (day.coolDown && !short) exercises.push(flowItem(day.coolDown));

  return {
    id: `w${Date.now()}`, date: iso, week, dayId, name: day.name, units: p.units,
    startedAt: Date.now(), short, exercises,
  };
}

export const flowName = (id: string) => FLOWS[id]?.name ?? id;

export const isWork = (st: LoggedSet) => st.kind === 'work';

/** Dune hill repeat target for the week. */
export const duneTarget = (week: number) =>
  ({ accumulate: 6, build: 8, strength: 10, deload: 4, test: 6 })[phaseOf(week)];

/** Weekly outdoor distance goal. */
export const outdoorGoal = (u: Units) => (u === 'imperial' ? 9 : 14);
export const MOBILITY_GOAL_MIN = 90;
