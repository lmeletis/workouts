import { ex } from './library';
import { addDays, e1rm, phaseOf, roundLoad, stepLoad } from './program';
import type { AppState, Change, ExState, LoggedExercise, Profile, Units, WorkoutLog } from './types';

export const unitW = (u: Units) => (u === 'imperial' ? 'lb' : 'kg');
export const unitD = (u: Units) => (u === 'imperial' ? 'mi' : 'km');
export const unitT = (u: Units) => (u === 'imperial' ? '°F' : '°C');
export const unitL = (u: Units) => (u === 'imperial' ? 'in' : 'cm');

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, ''));

export function fmtLoad(exId: string, w: number, u: Units) {
  const def = ex(exId);
  if (def.equip === 'band') return 'band';
  if (def.equip === 'bodyweight' || w <= 0) return 'bodyweight';
  return `${def.pair ? '2×' : ''}${num(w)} ${unitW(u)}`;
}

export function fmtTarget(le: LoggedExercise, u: Units) {
  const work = le.sets.filter((s) => s.kind === 'work');
  if (!work.length) return '';
  const def = ex(le.exId);
  const reps = def.timed ? `${work[0].targetReps} s` : `${work[0].targetReps}`;
  const side = def.perSide ? ' /side' : '';
  const load = def.equip === 'bodyweight' || def.equip === 'band' ? '' : ` @ ${fmtLoad(le.exId, work[0].targetWeight, u)}`;
  return `${work.length} × ${reps}${side}${load}`;
}

export const workSets = (le: LoggedExercise) => le.sets.filter((s) => s.kind === 'work');

export const bestE1rm = (le: LoggedExercise) =>
  Math.max(0, ...workSets(le).filter((s) => s.done).map((s) => e1rm(s.weight, s.reps, s.rpe)));

export interface FeedbackResult {
  exState: Record<string, ExState>;
  changes: Change[];
  hipFocusUntil?: string;
}

/** Turns a finished, rated workout into next-session targets. */
export function applyFeedback(s: AppState, log: WorkoutLog): FeedbackResult {
  const p = s.profile!;
  const exState = { ...s.exState };
  const changes: Change[] = [];
  const phase = phaseOf(log.week);
  let hipFocusUntil = s.hipFocusUntil;

  for (const le of log.exercises) {
    if (le.flowId) continue;
    const def = ex(le.exId);
    const all = workSets(le);
    const done = all.filter((x) => x.done);
    if (!done.length) continue;

    const [lo, hi] = le.repRange;
    const target = all[0].targetReps;
    const rating = le.rating ?? 'right';
    const loadless = def.equip === 'bodyweight' || def.equip === 'band';
    const topWeight = Math.max(...done.map((x) => x.weight));
    const allHit = done.length === all.length && done.every((x) => x.reps >= x.targetReps);
    const rpes = done.map((x) => x.rpe).filter((r): r is number => !!r);
    const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : undefined;
    const prev: ExState = exState[le.exId] ?? { weight: topWeight, repTarget: target, painFlags: 0, misses: 0 };
    const st: ExState = { ...prev, weight: loadless ? 0 : topWeight };
    const name = def.name;
    const load = (w: number) => fmtLoad(le.exId, w, p.units);
    const push = (change: string, why: string, tone: Change['tone']) => changes.push({ exId: le.exId, name, change, why, tone });

    const best = bestE1rm(le);
    if (best > 0) st.e1rm = prev.e1rm ? Math.max(best, prev.e1rm * 0.95) : best;

    if (le.pain) {
      st.painFlags = prev.painFlags + 1;
      st.misses = 0;
      if (!loadless) st.weight = le.role === 'anchor' && def.equip === 'barbell'
        ? roundLoad(topWeight * 0.9, def.equip, p.units, p.kettlebells)
        : stepLoad(topWeight, -1, le.exId, p);
      st.repTarget = le.role === 'anchor' ? target : lo;
      push(loadless ? `Reps reset → ${lo}` : `Lighter → ${load(st.weight)}`, 'Pain flagged — backing off and adding hip prep', 'down');
      if (st.painFlags >= 2) push('Consider a swap', `Pain flagged ${st.painFlags} sessions in a row — try an alternative`, 'info');
    } else {
      st.painFlags = 0;
      if (phase === 'deload' || phase === 'test') {
        push('Hold', phase === 'deload' ? 'Deload week — progress resumes next block' : 'Test week — new block weights come from today', 'hold');
      } else if (le.role === 'anchor' && !loadless) {
        st.schemeReps = target;
        st.repTarget = target;
        if (!allHit || rating === 'hard') {
          st.misses = prev.misses + 1;
          if (st.misses >= 2) {
            st.weight = roundLoad(topWeight * 0.95, def.equip, p.units, p.kettlebells);
            st.misses = 0;
            push(`Reset → ${load(st.weight)}`, 'Missed or too hard twice — small reset to rebuild momentum', 'down');
          } else {
            push(`Hold · ${load(topWeight)}`, !allHit ? 'Some reps missed — same weight next time' : 'Felt too hard — repeat before adding weight', 'hold');
          }
        } else {
          const steps = rating === 'easy' && (avgRpe ?? 7) <= 7.5 ? 2 : 1;
          st.weight = stepLoad(topWeight, 1, le.exId, p, steps);
          st.misses = 0;
          push(`+${st.weight - topWeight} ${unitW(p.units)} → ${load(st.weight)}`,
            rating === 'easy' ? 'Too easy — bigger jump' : `Just right${avgRpe ? ` at RPE ${avgRpe.toFixed(1).replace('.0', '')}` : ''}, all reps hit`, 'up');
        }
      } else {
        // Double progression: add reps until the top of the range, then add load.
        const base = Math.min(hi, Math.max(lo, prev.repTarget ?? target));
        const unit = def.timed ? ' s' : '';
        if (rating === 'hard' && done.some((x) => x.reps < lo) && !loadless) {
          st.weight = stepLoad(topWeight, -1, le.exId, p);
          st.repTarget = lo;
          push(`Drop · ${load(st.weight)}`, 'Too hard and under the rep range — lighter, rebuild reps', 'down');
        } else if (!allHit || rating === 'hard') {
          st.repTarget = base;
          push(`Hold · ${base}${unit}`, 'Repeat the same target', 'hold');
        } else {
          const step = def.timed ? 5 : 1;
          const next = base + (rating === 'easy' ? 2 * step : step);
          if (next > hi && !loadless) {
            st.weight = stepLoad(topWeight, 1, le.exId, p);
            st.repTarget = lo;
            push(`Heavier → ${load(st.weight)}`, `Top of ${lo}–${hi} reached — more load, back to ${lo} reps`, 'up');
          } else if (next > hi) {
            st.repTarget = hi;
            push(`Max ${hi}${unit}`, def.timed ? 'Top of range — add load or a harder variation' : 'Top of range — slow the tempo or add a band', 'info');
          } else {
            st.repTarget = next;
            push(`+${next - base}${unit} → ${next}${unit}`, 'Double progression: build reps, then add weight', 'up');
          }
        }
      }
    }
    exState[le.exId] = st;
  }

  const hipFlag = log.hips === 'tight' || log.exercises.some((e) => e.pain);
  if (hipFlag) {
    hipFocusUntil = addDays(log.date, 14);
    changes.push({ exId: 'flow:primer', name: 'Mobility primer', change: '+ couch stretch', why: 'Hips flagged tight or painful — extra hip-flexor and ankle work for 2 weeks', tone: 'info' });
  }

  return { exState, changes, hipFocusUntil };
}

/** Convert stored loads when the user switches units. */
export function convertUnits(s: AppState, to: Units): AppState {
  if (!s.profile || s.profile.units === to) return s;
  const f = to === 'metric' ? 0.4536 : 2.2046;
  const p: Profile = {
    ...s.profile,
    units: to,
    startLifts: Object.fromEntries(Object.entries(s.profile.startLifts).map(([k, v]) => [k, v ? Math.round(v * f) : v])),
    kettlebells: s.profile.kettlebells.map((k) => Math.round(k * f)),
    dumbbellMax: Math.round(s.profile.dumbbellMax * f),
  };
  const exState = Object.fromEntries(
    Object.entries(s.exState).map(([id, st]) => [
      id,
      { ...st, weight: roundLoad(st.weight * f, ex(id).equip, to, p.kettlebells), e1rm: st.e1rm ? st.e1rm * f : st.e1rm },
    ]),
  );
  return { ...s, profile: p, exState };
}

/** Converts a weight logged in one unit system to another for charts. */
export const toUnits = (w: number, from: Units, to: Units) =>
  from === to ? w : to === 'metric' ? w * 0.4536 : w * 2.2046;
