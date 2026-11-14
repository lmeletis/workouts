import type { AnchorLift, Muscle } from './types';

export type Equip = 'barbell' | 'dumbbell' | 'kettlebell' | 'bodyweight' | 'band';

export interface ExerciseDef {
  id: string;
  name: string;
  equip: Equip;
  muscles: Muscle[];
  /** Upper-body lifts progress in smaller jumps. */
  upper: boolean;
  perSide?: boolean;
  /** Two bells / dumbbells; weight shown is per hand. */
  pair?: boolean;
  /** Logged in seconds instead of reps. */
  timed?: boolean;
  cue: string;
  alts: string[];
  /** Starting working weight as a fraction of an anchor's estimated 1RM. */
  basis?: { lift: AnchorLift; k: number };
}

const E = (d: ExerciseDef) => d;

export const EXERCISES: Record<string, ExerciseDef> = Object.fromEntries(
  [
    // Anchors
    E({ id: 'squat', name: 'Back Squat', equip: 'barbell', muscles: ['quads', 'glutes'], upper: false, cue: 'Brace, sit between the hips, knees track over toes', alts: ['frontSquat', 'gobletSquat'] }),
    E({ id: 'bench', name: 'Bench Press', equip: 'barbell', muscles: ['chest', 'shoulders', 'arms'], upper: true, cue: 'Shoulder blades pinned, feet driving, bar to lower chest', alts: ['dbBench', 'dbIncline'] }),
    E({ id: 'deadlift', name: 'Deadlift', equip: 'barbell', muscles: ['hamstrings', 'glutes', 'back'], upper: false, cue: 'Push the floor away, bar stays on the legs, lock with glutes', alts: ['rdl', 'kbSlRdl'] }),
    E({ id: 'ohp', name: 'Overhead Press', equip: 'barbell', muscles: ['shoulders', 'arms'], upper: true, cue: 'Squeeze glutes, head through at the top, ribs down', alts: ['dbOhp', 'halfKneelKbPress'] }),
    E({ id: 'pullup', name: 'Pull-up', equip: 'bodyweight', muscles: ['back', 'arms'], upper: true, cue: 'Full hang to chin over bar, no kipping', alts: ['bbRow', 'bandPulldown'] }),
    // Accessories
    E({ id: 'rdl', name: 'Romanian Deadlift', equip: 'barbell', muscles: ['hamstrings', 'glutes'], upper: false, cue: 'Soft knees, hips back until hamstrings load, flat back', alts: ['kbSlRdl', 'hipThrust'], basis: { lift: 'deadlift', k: 0.45 } }),
    E({ id: 'bss', name: 'Bulgarian Split Squat', equip: 'kettlebell', pair: true, perSide: true, muscles: ['quads', 'glutes'], upper: false, cue: 'Tall torso, front knee forward, control the bottom', alts: ['reverseLunge', 'gobletSquat'], basis: { lift: 'squat', k: 0.14 } }),
    E({ id: 'frontSquat', name: 'Front Squat', equip: 'barbell', muscles: ['quads', 'glutes', 'core'], upper: false, cue: 'Elbows high, sit straight down', alts: ['gobletSquat', 'squat'], basis: { lift: 'squat', k: 0.55 } }),
    E({ id: 'gobletSquat', name: 'Goblet Squat', equip: 'kettlebell', muscles: ['quads', 'glutes'], upper: false, cue: 'Bell tight to chest, elbows inside knees', alts: ['frontSquat'], basis: { lift: 'squat', k: 0.2 } }),
    E({ id: 'reverseLunge', name: 'Reverse Lunge', equip: 'dumbbell', pair: true, perSide: true, muscles: ['quads', 'glutes'], upper: false, cue: 'Long step back, front shin vertical', alts: ['bss'], basis: { lift: 'squat', k: 0.16 } }),
    E({ id: 'hipThrust', name: 'Barbell Hip Thrust', equip: 'barbell', muscles: ['glutes', 'hamstrings'], upper: false, cue: 'Chin tucked, ribs down, full hip lockout', alts: ['rdl', 'kbSwing'], basis: { lift: 'deadlift', k: 0.75 } }),
    E({ id: 'kbSlRdl', name: 'Single-leg RDL (KB)', equip: 'kettlebell', perSide: true, muscles: ['hamstrings', 'glutes'], upper: false, cue: 'Hips square, reach the free leg long', alts: ['rdl'], basis: { lift: 'deadlift', k: 0.12 } }),
    E({ id: 'bbRow', name: 'Barbell Row', equip: 'barbell', muscles: ['back', 'arms'], upper: true, cue: 'Hinged at 45°, pull to belly button', alts: ['dbRow', 'bandPulldown'], basis: { lift: 'bench', k: 0.6 } }),
    E({ id: 'dbRow', name: 'One-arm DB Row', equip: 'dumbbell', perSide: true, muscles: ['back', 'arms'], upper: true, cue: 'Pull elbow to hip, no twisting', alts: ['bbRow'], basis: { lift: 'bench', k: 0.3 } }),
    E({ id: 'dbIncline', name: 'Incline DB Press', equip: 'dumbbell', pair: true, muscles: ['chest', 'shoulders'], upper: true, cue: 'Bench at 30°, elbows ~45° from torso', alts: ['dbBench', 'bench'], basis: { lift: 'bench', k: 0.25 } }),
    E({ id: 'dbBench', name: 'DB Bench Press', equip: 'dumbbell', pair: true, muscles: ['chest', 'shoulders', 'arms'], upper: true, cue: 'Deep stretch at the bottom, press up and slightly in', alts: ['dbIncline', 'bench'], basis: { lift: 'bench', k: 0.3 } }),
    E({ id: 'dbOhp', name: 'Seated DB Press', equip: 'dumbbell', pair: true, muscles: ['shoulders', 'arms'], upper: true, cue: 'Forearms vertical, press to lockout', alts: ['ohp'], basis: { lift: 'ohp', k: 0.3 } }),
    E({ id: 'facePull', name: 'Band Face Pull', equip: 'band', muscles: ['shoulders', 'back'], upper: true, cue: 'Pull to forehead, thumbs back, pause', alts: ['bandPullApart'] }),
    E({ id: 'bandPullApart', name: 'Band Pull-apart', equip: 'band', muscles: ['shoulders', 'back'], upper: true, cue: 'Straight arms, squeeze shoulder blades', alts: ['facePull'] }),
    E({ id: 'bandPulldown', name: 'Band Lat Pulldown', equip: 'band', muscles: ['back', 'arms'], upper: true, cue: 'Elbows to ribs, chest up', alts: ['pullup'] }),
    E({ id: 'dbCurl', name: 'DB Curl', equip: 'dumbbell', pair: true, muscles: ['arms'], upper: true, cue: 'Elbows pinned, slow lower', alts: ['bandCurl'], basis: { lift: 'bench', k: 0.12 } }),
    E({ id: 'bandCurl', name: 'Band Curl', equip: 'band', muscles: ['arms'], upper: true, cue: 'Squeeze at the top', alts: ['dbCurl'] }),
    E({ id: 'dbOhExt', name: 'DB Overhead Triceps Extension', equip: 'dumbbell', muscles: ['arms'], upper: true, cue: 'Elbows forward, deep stretch', alts: ['bandPushdown'], basis: { lift: 'bench', k: 0.15 } }),
    E({ id: 'bandPushdown', name: 'Band Triceps Pushdown', equip: 'band', muscles: ['arms'], upper: true, cue: 'Elbows still, full lockout', alts: ['dbOhExt'] }),
    E({ id: 'kbSwing', name: 'KB Swing', equip: 'kettlebell', muscles: ['glutes', 'hamstrings', 'core'], upper: false, cue: 'Hike, snap the hips, float the bell', alts: ['hipThrust'], basis: { lift: 'deadlift', k: 0.18 } }),
    // Dynamic slot
    E({ id: 'kbLatLungePress', name: 'KB Lateral Lunge → Press', equip: 'kettlebell', perSide: true, muscles: ['quads', 'glutes', 'shoulders'], upper: false, cue: 'Sit into the hip, drive back to standing, then press', alts: ['cossack'], basis: { lift: 'ohp', k: 0.25 } }),
    E({ id: 'kbCleanPress', name: 'KB Clean & Press', equip: 'kettlebell', perSide: true, muscles: ['shoulders', 'glutes', 'core'], upper: true, cue: 'Zip the bell up, soft catch in the rack, press', alts: ['kbLatLungePress'], basis: { lift: 'ohp', k: 0.3 } }),
    E({ id: 'kbSnatch', name: 'KB Snatch', equip: 'kettlebell', perSide: true, muscles: ['glutes', 'shoulders', 'back'], upper: false, cue: 'Hip snap, punch through at the top', alts: ['kbSwing', 'kbCleanPress'], basis: { lift: 'ohp', k: 0.3 } }),
    E({ id: 'kbSwingDyn', name: 'KB Swing (power)', equip: 'kettlebell', muscles: ['glutes', 'hamstrings', 'core'], upper: false, cue: 'Max-intent hips, crisp reps, stop before form fades', alts: ['kbSnatch'], basis: { lift: 'deadlift', k: 0.18 } }),
    E({ id: 'tgu', name: 'Turkish Get-up', equip: 'kettlebell', perSide: true, muscles: ['shoulders', 'core', 'glutes'], upper: true, cue: 'Eyes on the bell, slow and deliberate', alts: ['halfKneelKbPress'], basis: { lift: 'ohp', k: 0.2 } }),
    E({ id: 'kbSlRdlRow', name: 'Single-leg RDL to Row', equip: 'kettlebell', perSide: true, muscles: ['hamstrings', 'back', 'glutes'], upper: false, cue: 'Hinge, row at the bottom, stand tall', alts: ['kbSlRdl'], basis: { lift: 'deadlift', k: 0.14 } }),
    E({ id: 'cossack', name: 'Cossack Squat', equip: 'kettlebell', perSide: true, muscles: ['quads', 'glutes'], upper: false, cue: 'Heel down, straight leg toes up, bell as counterweight', alts: ['kbLatLungePress'], basis: { lift: 'squat', k: 0.1 } }),
    E({ id: 'latBound', name: 'Lateral Bounds', equip: 'bodyweight', perSide: true, muscles: ['glutes', 'quads'], upper: false, cue: 'Push sideways, stick the landing 2 s', alts: ['jumpSquat'] }),
    E({ id: 'jumpSquat', name: 'Jump Squat', equip: 'bodyweight', muscles: ['quads', 'glutes'], upper: false, cue: 'Quarter dip, explode, land quiet', alts: ['latBound'] }),
    E({ id: 'halfKneelKbPress', name: 'Half-kneeling KB Press', equip: 'kettlebell', perSide: true, muscles: ['shoulders', 'core'], upper: true, cue: 'Squeeze down-knee glute, ribs stacked', alts: ['dbOhp'], basis: { lift: 'ohp', k: 0.3 } }),
    // Core / carries (timed)
    E({ id: 'copenhagen', name: 'Copenhagen Plank', equip: 'bodyweight', perSide: true, timed: true, muscles: ['core'], upper: false, cue: 'Top leg on bench, hips high, straight line', alts: ['sidePlank'] }),
    E({ id: 'sidePlank', name: 'Side Plank', equip: 'bodyweight', perSide: true, timed: true, muscles: ['core'], upper: false, cue: 'Hips forward and high', alts: ['copenhagen'] }),
    E({ id: 'deadBug', name: 'Dead Bug', equip: 'bodyweight', muscles: ['core'], upper: false, cue: 'Low back glued to the floor, exhale fully', alts: ['sidePlank'] }),
    E({ id: 'suitcaseCarry', name: 'Suitcase Carry', equip: 'kettlebell', perSide: true, timed: true, muscles: ['core', 'back'], upper: false, cue: 'Tall, no lean, slow steps', alts: ['sidePlank'], basis: { lift: 'deadlift', k: 0.16 } }),
  ].map((e) => [e.id, e]),
);

export const ex = (id: string): ExerciseDef =>
  EXERCISES[id] ?? { id, name: id, equip: 'bodyweight', muscles: [], upper: false, cue: '', alts: [] };

// ---------- Mobility ----------

export interface Move {
  id: string;
  name: string;
  sec: number;
  perSide?: boolean;
  cue: string;
}

export const MOVES: Record<string, Move> = Object.fromEntries(
  [
    { id: 'hipCars', name: 'Hip CARs', sec: 60, perSide: true, cue: 'Slow full circles, keep the pelvis still. 5 each way.' },
    { id: 'catCow', name: 'Cat-cow + T-spine rotation', sec: 120, cue: 'Segment the spine, then thread the needle each side.' },
    { id: 'switch9090', name: '90/90 Switch → Hold', sec: 60, perSide: true, cue: 'Sit tall, chest over the front shin, breathe into the back hip.' },
    { id: 'couch', name: 'Couch Stretch', sec: 75, perSide: true, cue: 'Squeeze the glute of the back leg, ribs down, no arching.' },
    { id: 'cossackRock', name: 'Cossack Squat (KB counter)', sec: 90, perSide: true, cue: 'Sink slow, heel down, use the bell to sit deeper.' },
    { id: 'pigeon', name: 'Pigeon → PAILs/RAILs', sec: 120, perSide: true, cue: '2 min hold; press shin down 10 s, then lift 10 s, repeat x2.' },
    { id: 'gobletHold', name: 'Deep Goblet Squat Hold', sec: 90, cue: 'Elbows push knees out, shift side to side.' },
    { id: 'bandDistraction', name: 'Banded Hip Distraction', sec: 120, perSide: true, cue: 'Band high on the thigh, lean away, small rocks.' },
    { id: 'rockBack', name: 'Cossack Rock-backs', sec: 45, perSide: true, cue: 'Wide stance, shift side to side, slow.' },
    { id: 'bandWalk', name: 'Band Lateral Walks', sec: 60, cue: 'Band above knees, toes forward, steady tension.' },
    { id: 'kneeWall', name: 'Knee-to-wall Ankle Rocks', sec: 45, perSide: true, cue: 'Heel down, knee over little toe.' },
    { id: 'childPose', name: 'Wide Child’s Pose', sec: 60, cue: 'Knees wide, slow breaths into the low back.' },
  ].map((m) => [m.id, m as Move]),
);

export interface Flow {
  id: string;
  name: string;
  moves: string[];
}

export const FLOWS: Record<string, Flow> = {
  primer: { id: 'primer', name: 'Hip Mobility Primer', moves: ['hipCars', 'switch9090', 'rockBack', 'bandWalk'] },
  hipFlow: { id: 'hipFlow', name: 'Hip Mobility Flow', moves: ['hipCars', 'catCow', 'switch9090', 'couch', 'cossackRock', 'pigeon', 'gobletHold', 'bandDistraction'] },
  coolDown: { id: 'coolDown', name: 'Cool-down Hip Flow', moves: ['pigeon', 'gobletHold', 'childPose'] },
};

export interface FlowStep {
  move: Move;
  side: 'Left' | 'Right' | null;
}

/** Expanded step list (per-side moves become L and R steps). */
export function flowSteps(flowId: string, hipFocus = false): FlowStep[] {
  const f = FLOWS[flowId];
  const ids = [...f.moves];
  if (hipFocus && !ids.includes('couch')) ids.splice(1, 0, 'couch');
  if (hipFocus && !ids.includes('kneeWall') && flowId === 'primer') ids.push('kneeWall');
  return ids.flatMap((id): FlowStep[] => {
    const m = MOVES[id];
    return m.perSide ? [{ move: m, side: 'Left' }, { move: m, side: 'Right' }] : [{ move: m, side: null }];
  });
}

export function flowMinutes(flowId: string, hipFocus = false) {
  return Math.round(flowSteps(flowId, hipFocus).reduce((a, s) => a + s.move.sec, 0) / 60);
}
