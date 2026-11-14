import { describe, expect, it } from 'vitest';
import { buildSession, phaseOf, plates, roundLoad, stepLoad, weekOf } from './program';
import { applyFeedback } from './progression';
import { emptyState } from './store';
import type { AppState, Profile } from './types';

const profile: Profile = {
  experience: 'intermediate', days: 4, sessionMin: 60, units: 'imperial', coldExperience: 'some',
  startLifts: { squat: 225, bench: 175, deadlift: 285, ohp: 115 }, pullupReps: 8,
  priorities: [], kettlebells: [25, 35, 45, 53], dumbbellMax: 75, limitations: '',
  startDate: '2026-11-02', cycle: 1,
};
const base = (): AppState => ({ ...emptyState(), profile });

describe('program', () => {
  it('maps weeks to phases', () => {
    expect(phaseOf(1)).toBe('accumulate');
    expect(phaseOf(4)).toBe('deload');
    expect(phaseOf(9)).toBe('strength');
    expect(phaseOf(12)).toBe('test');
    expect(weekOf(profile, '2026-11-16')).toBe(3);
  });

  it('rounds loads to plates and owned bells', () => {
    expect(roundLoad(197, 'barbell', 'imperial', [])).toBe(195);
    expect(roundLoad(30, 'barbell', 'imperial', [])).toBe(45);
    expect(roundLoad(40, 'kettlebell', 'imperial', [25, 35, 45, 53])).toBe(35);
    expect(stepLoad(35, 1, 'bss', profile)).toBe(45);
    expect(stepLoad(225, 1, 'squat', profile)).toBe(235);
    expect(stepLoad(175, 1, 'bench', profile)).toBe(180);
    expect(plates(225, 'imperial')).toEqual([45, 45]);
  });

  it('builds a Lower A session with warm-ups and sensible weights', () => {
    const w = buildSession(base(), 'lowerA', '2026-11-16');
    expect(w.exercises[0].flowId).toBe('primer');
    const squat = w.exercises.find((e) => e.exId === 'squat')!;
    const work = squat.sets.filter((s) => s.kind === 'work');
    expect(work).toHaveLength(4);
    expect(work[0].targetReps).toBe(8);
    expect(work[0].targetWeight).toBeGreaterThan(170);
    expect(work[0].targetWeight).toBeLessThan(225);
    expect(squat.sets.some((s) => s.kind === 'warmup')).toBe(true);
    expect(w.exercises.some((e) => e.exId === 'kbLatLungePress')).toBe(true);
  });
});

describe('feedback', () => {
  const finish = (s: AppState, rating: 'easy' | 'right' | 'hard', hit = true, pain = false) => {
    const w = buildSession(s, 'lowerA', '2026-11-16');
    for (const e of w.exercises) {
      e.rating = rating;
      e.pain = pain && e.exId === 'bss';
      e.sets.forEach((st) => { st.done = true; st.rpe = 7; if (!hit) st.reps = st.targetReps - 1; });
    }
    return { w, r: applyFeedback(s, w) };
  };

  it('adds weight to anchors when just right', () => {
    const { w, r } = finish(base(), 'right');
    const squatW = w.exercises.find((e) => e.exId === 'squat')!.sets.at(-1)!.weight;
    expect(r.exState.squat.weight).toBe(squatW + 10);
  });

  it('holds then resets after two misses', () => {
    const s = base();
    const first = finish(s, 'right', false);
    const s2 = { ...s, exState: first.r.exState };
    const second = finish(s2, 'right', false);
    const used = second.w.exercises.find((e) => e.exId === 'squat')!.sets.at(-1)!.weight;
    expect(first.r.exState.squat.weight).toBe(used);
    expect(second.r.exState.squat.weight).toBeLessThan(used);
  });

  it('adds reps to accessories and backs off on pain', () => {
    const { r } = finish(base(), 'right', true, true);
    expect(r.exState.rdl.repTarget).toBe(11);
    expect(r.exState.bss.weight).toBe(25);
    expect(r.hipFocusUntil).toBe('2026-11-30');
  });
});
