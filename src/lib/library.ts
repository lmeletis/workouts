import catalog from '../data/catalog.json';
import type { AnchorLift, Muscle } from './types';

export type Equip = 'barbell' | 'dumbbell' | 'kettlebell' | 'bodyweight' | 'band';

export interface ExerciseDef {
  id: string;
  name: string;
  equip: Equip;
  /** Primary muscles worked. */
  muscles: Muscle[];
  /** Muscles that assist. */
  secondary: Muscle[];
  /** Photo set id under public/ex/ (start + end position). */
  img?: string;
  /** How-to steps; falls back to the photo set's catalog instructions. */
  steps?: string[];
  category?: string;
  level?: string;
  /** From the full exercise catalog rather than the program. */
  catalog?: boolean;
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
    E({ id: 'squat', name: 'Back Squat', equip: 'barbell', muscles: ['quadriceps', 'glutes'], secondary: ['hamstrings', 'adductors', 'lower back', 'abdominals'], img: 'Barbell_Squat', upper: false, cue: 'Brace, sit between the hips, knees track over toes', alts: ['frontSquat', 'gobletSquat'] }),
    E({ id: 'bench', name: 'Bench Press', equip: 'barbell', muscles: ['chest'], secondary: ['shoulders', 'triceps'], img: 'Barbell_Bench_Press_-_Medium_Grip', upper: true, cue: 'Shoulder blades pinned, feet driving, bar to lower chest', alts: ['dbBench', 'dbIncline'] }),
    E({ id: 'deadlift', name: 'Deadlift', equip: 'barbell', muscles: ['hamstrings', 'glutes', 'lower back'], secondary: ['quadriceps', 'traps', 'forearms', 'lats'], img: 'Barbell_Deadlift', upper: false, cue: 'Push the floor away, bar stays on the legs, lock with glutes', alts: ['rdl', 'kbSlRdl'] }),
    E({ id: 'ohp', name: 'Overhead Press', equip: 'barbell', muscles: ['shoulders'], secondary: ['triceps', 'traps', 'abdominals'], img: 'Standing_Military_Press', upper: true, cue: 'Squeeze glutes, head through at the top, ribs down', alts: ['dbOhp', 'halfKneelKbPress'] }),
    E({ id: 'pullup', name: 'Pull-up', equip: 'bodyweight', muscles: ['lats'], secondary: ['biceps', 'middle back', 'forearms'], img: 'Pullups', upper: true, cue: 'Full hang to chin over bar, no kipping', alts: ['bbRow', 'bandPulldown'] }),
    // Accessories
    E({ id: 'rdl', name: 'Romanian Deadlift', equip: 'barbell', muscles: ['hamstrings', 'glutes'], secondary: ['lower back', 'forearms'], img: 'Romanian_Deadlift', upper: false, cue: 'Soft knees, hips back until hamstrings load, flat back', alts: ['kbSlRdl', 'hipThrust'], basis: { lift: 'deadlift', k: 0.45 } }),
    E({ id: 'bss', name: 'Bulgarian Split Squat', equip: 'kettlebell', pair: true, perSide: true, muscles: ['quadriceps', 'glutes'], secondary: ['hamstrings', 'adductors'], img: 'Split_Squat_with_Dumbbells', upper: false, cue: 'Tall torso, front knee forward, control the bottom', alts: ['reverseLunge', 'gobletSquat'], basis: { lift: 'squat', k: 0.14 } }),
    E({ id: 'frontSquat', name: 'Front Squat', equip: 'barbell', muscles: ['quadriceps'], secondary: ['glutes', 'abdominals', 'lower back'], img: 'Front_Barbell_Squat', upper: false, cue: 'Elbows high, sit straight down', alts: ['gobletSquat', 'squat'], basis: { lift: 'squat', k: 0.55 } }),
    E({ id: 'gobletSquat', name: 'Goblet Squat', equip: 'kettlebell', muscles: ['quadriceps', 'glutes'], secondary: ['adductors', 'abdominals'], img: 'Goblet_Squat', upper: false, cue: 'Bell tight to chest, elbows inside knees', alts: ['frontSquat'], basis: { lift: 'squat', k: 0.2 } }),
    E({ id: 'reverseLunge', name: 'Reverse Lunge', equip: 'dumbbell', pair: true, perSide: true, muscles: ['quadriceps', 'glutes'], secondary: ['hamstrings', 'calves'], img: 'Dumbbell_Rear_Lunge', upper: false, cue: 'Long step back, front shin vertical', alts: ['bss'], basis: { lift: 'squat', k: 0.16 } }),
    E({ id: 'hipThrust', name: 'Barbell Hip Thrust', equip: 'barbell', muscles: ['glutes'], secondary: ['hamstrings'], img: 'Barbell_Hip_Thrust', upper: false, cue: 'Chin tucked, ribs down, full hip lockout', alts: ['rdl', 'kbSwing'], basis: { lift: 'deadlift', k: 0.75 } }),
    E({ id: 'kbSlRdl', name: 'Single-leg RDL (KB)', equip: 'kettlebell', perSide: true, muscles: ['hamstrings', 'glutes'], secondary: ['lower back', 'abductors'], img: 'Kettlebell_One-Legged_Deadlift', upper: false, cue: 'Hips square, reach the free leg long', alts: ['rdl'], basis: { lift: 'deadlift', k: 0.12 } }),
    E({ id: 'bbRow', name: 'Barbell Row', equip: 'barbell', muscles: ['middle back', 'lats'], secondary: ['biceps', 'shoulders', 'lower back'], img: 'Bent_Over_Barbell_Row', upper: true, cue: 'Hinged at 45°, pull to belly button', alts: ['dbRow', 'bandPulldown'], basis: { lift: 'bench', k: 0.6 } }),
    E({ id: 'dbRow', name: 'One-arm DB Row', equip: 'dumbbell', perSide: true, muscles: ['lats', 'middle back'], secondary: ['biceps'], img: 'One-Arm_Dumbbell_Row', upper: true, cue: 'Pull elbow to hip, no twisting', alts: ['bbRow'], basis: { lift: 'bench', k: 0.3 } }),
    E({ id: 'dbIncline', name: 'Incline DB Press', equip: 'dumbbell', pair: true, muscles: ['chest', 'shoulders'], secondary: ['triceps'], img: 'Incline_Dumbbell_Press', upper: true, cue: 'Bench at 30°, elbows ~45° from torso', alts: ['dbBench', 'bench'], basis: { lift: 'bench', k: 0.25 } }),
    E({ id: 'dbBench', name: 'DB Bench Press', equip: 'dumbbell', pair: true, muscles: ['chest'], secondary: ['shoulders', 'triceps'], img: 'Dumbbell_Bench_Press', upper: true, cue: 'Deep stretch at the bottom, press up and slightly in', alts: ['dbIncline', 'bench'], basis: { lift: 'bench', k: 0.3 } }),
    E({ id: 'dbOhp', name: 'Seated DB Press', equip: 'dumbbell', pair: true, muscles: ['shoulders'], secondary: ['triceps'], img: 'Dumbbell_Shoulder_Press', upper: true, cue: 'Forearms vertical, press to lockout', alts: ['ohp'], basis: { lift: 'ohp', k: 0.3 } }),
    E({ id: 'facePull', name: 'Band Face Pull', equip: 'band', muscles: ['shoulders'], secondary: ['middle back', 'traps'], img: 'Face_Pull', upper: true, cue: 'Pull to forehead, thumbs back, pause', alts: ['bandPullApart'] }),
    E({ id: 'bandPullApart', name: 'Band Pull-apart', equip: 'band', muscles: ['shoulders'], secondary: ['middle back', 'traps'], img: 'Band_Pull_Apart', upper: true, cue: 'Straight arms, squeeze shoulder blades', alts: ['facePull'] }),
    E({ id: 'bandPulldown', name: 'Band Lat Pulldown', equip: 'band', muscles: ['lats'], secondary: ['biceps', 'middle back'], steps: ['Anchor a band high (top of the rack).', 'Kneel facing it, arms overhead holding the band.', 'Pull elbows down to your ribs, chest up.', 'Return slowly with control.'], upper: true, cue: 'Elbows to ribs, chest up', alts: ['pullup'] }),
    E({ id: 'dbCurl', name: 'DB Curl', equip: 'dumbbell', pair: true, muscles: ['biceps'], secondary: ['forearms'], img: 'Dumbbell_Bicep_Curl', upper: true, cue: 'Elbows pinned, slow lower', alts: ['bandCurl'], basis: { lift: 'bench', k: 0.12 } }),
    E({ id: 'bandCurl', name: 'Band Curl', equip: 'band', muscles: ['biceps'], secondary: ['forearms'], steps: ['Stand on the band, palms forward.', 'Curl hands to shoulders, elbows pinned.', 'Lower slowly.'], upper: true, cue: 'Squeeze at the top', alts: ['dbCurl'] }),
    E({ id: 'dbOhExt', name: 'DB Overhead Triceps Extension', equip: 'dumbbell', muscles: ['triceps'], secondary: [], img: 'Dumbbell_One-Arm_Triceps_Extension', upper: true, cue: 'Elbows forward, deep stretch', alts: ['bandPushdown'], basis: { lift: 'bench', k: 0.15 } }),
    E({ id: 'bandPushdown', name: 'Band Triceps Pushdown', equip: 'band', muscles: ['triceps'], secondary: [], steps: ['Anchor a band high.', 'Elbows at your sides, push hands down to full lockout.', 'Return slowly, elbows still.'], upper: true, cue: 'Elbows still, full lockout', alts: ['dbOhExt'] }),
    E({ id: 'kbSwing', name: 'KB Swing', equip: 'kettlebell', muscles: ['glutes', 'hamstrings'], secondary: ['lower back', 'abdominals', 'shoulders'], img: 'One-Arm_Kettlebell_Swings', upper: false, cue: 'Hike, snap the hips, float the bell', alts: ['hipThrust'], basis: { lift: 'deadlift', k: 0.18 } }),
    // Dynamic slot
    E({ id: 'kbLatLungePress', name: 'KB Lateral Lunge → Press', equip: 'kettlebell', perSide: true, muscles: ['quadriceps', 'glutes', 'adductors'], secondary: ['shoulders', 'triceps'], steps: ['Hold a kettlebell in the rack position.', 'Step wide to one side and sit into that hip, other leg straight.', 'Drive back to standing.', 'Press the bell overhead, lower it to the rack. Repeat other side.'], upper: false, cue: 'Sit into the hip, drive back to standing, then press', alts: ['cossack'], basis: { lift: 'ohp', k: 0.25 } }),
    E({ id: 'kbCleanPress', name: 'KB Clean & Press', equip: 'kettlebell', perSide: true, muscles: ['shoulders'], secondary: ['glutes', 'hamstrings', 'triceps', 'abdominals'], img: 'One-Arm_Kettlebell_Clean', upper: true, cue: 'Zip the bell up, soft catch in the rack, press', alts: ['kbLatLungePress'], basis: { lift: 'ohp', k: 0.3 } }),
    E({ id: 'kbSnatch', name: 'KB Snatch', equip: 'kettlebell', perSide: true, muscles: ['shoulders', 'glutes', 'hamstrings'], secondary: ['traps', 'lower back'], img: 'One-Arm_Kettlebell_Snatch', upper: false, cue: 'Hip snap, punch through at the top', alts: ['kbSwing', 'kbCleanPress'], basis: { lift: 'ohp', k: 0.3 } }),
    E({ id: 'kbSwingDyn', name: 'KB Swing (power)', equip: 'kettlebell', muscles: ['glutes', 'hamstrings'], secondary: ['lower back', 'abdominals', 'shoulders'], img: 'One-Arm_Kettlebell_Swings', upper: false, cue: 'Max-intent hips, crisp reps, stop before form fades', alts: ['kbSnatch'], basis: { lift: 'deadlift', k: 0.18 } }),
    E({ id: 'tgu', name: 'Turkish Get-up', equip: 'kettlebell', perSide: true, muscles: ['shoulders', 'abdominals'], secondary: ['glutes', 'triceps', 'quadriceps'], img: 'Kettlebell_Turkish_Get-Up_Lunge_style', upper: true, cue: 'Eyes on the bell, slow and deliberate', alts: ['halfKneelKbPress'], basis: { lift: 'ohp', k: 0.2 } }),
    E({ id: 'kbSlRdlRow', name: 'Single-leg RDL to Row', equip: 'kettlebell', perSide: true, muscles: ['hamstrings', 'glutes', 'lats'], secondary: ['middle back', 'biceps'], img: 'Kettlebell_One-Legged_Deadlift', upper: false, cue: 'Hinge, row at the bottom, stand tall', alts: ['kbSlRdl'], basis: { lift: 'deadlift', k: 0.14 } }),
    E({ id: 'cossack', name: 'Cossack Squat', equip: 'kettlebell', perSide: true, muscles: ['quadriceps', 'adductors', 'glutes'], secondary: ['hamstrings'], steps: ['Stand very wide, toes slightly out, bell held at chest.', 'Shift and sit down into one hip, heel flat.', 'Straighten the other leg with toes pointing up.', 'Push back to the middle and switch sides.'], upper: false, cue: 'Heel down, straight leg toes up, bell as counterweight', alts: ['kbLatLungePress'], basis: { lift: 'squat', k: 0.1 } }),
    E({ id: 'latBound', name: 'Lateral Bounds', equip: 'bodyweight', perSide: true, muscles: ['glutes', 'quadriceps'], secondary: ['adductors', 'abductors', 'calves'], img: 'Lateral_Bound', upper: false, cue: 'Push sideways, stick the landing 2 s', alts: ['jumpSquat'] }),
    E({ id: 'jumpSquat', name: 'Jump Squat', equip: 'bodyweight', muscles: ['quadriceps', 'glutes'], secondary: ['calves', 'hamstrings'], img: 'Freehand_Jump_Squat', upper: false, cue: 'Quarter dip, explode, land quiet', alts: ['latBound'] }),
    E({ id: 'halfKneelKbPress', name: 'Half-kneeling KB Press', equip: 'kettlebell', perSide: true, muscles: ['shoulders'], secondary: ['triceps', 'abdominals'], img: 'Alternating_Kettlebell_Press', upper: true, cue: 'Squeeze down-knee glute, ribs stacked', alts: ['dbOhp'], basis: { lift: 'ohp', k: 0.3 } }),
    // Shoulder / serratus block (light, slow, pain-free — follow your PT)
    E({ id: 'pushupPlus', name: 'Push-up Plus', equip: 'bodyweight', muscles: ['serratus'], secondary: ['chest', 'triceps', 'abdominals'], img: 'Pushups', upper: true, cue: 'At the top, push the floor away so your upper back rounds slightly — that extra push is the “plus”', alts: ['scapPushup', 'bandPunch'], steps: ['Start in a push-up position (hands on a bench to make it easier).', 'Lower with control, elbows about 45° from your body.', 'Press up to straight arms.', 'Keep pushing: spread your shoulder blades apart around your ribs, hold 1 s.', 'Let them come back together slowly, then start the next rep.'] }),
    E({ id: 'scapPushup', name: 'Scap Push-up', equip: 'bodyweight', muscles: ['serratus'], secondary: ['traps', 'abdominals'], upper: true, cue: 'Arms stay straight — only the shoulder blades move', alts: ['pushupPlus'], steps: ['Hold a high plank (or hands on a bench), arms straight.', 'Let your chest sink so the shoulder blades pinch together.', 'Push the floor away so they spread apart and your upper back rounds.', 'Move slowly through the full range; elbows never bend.'] }),
    E({ id: 'serratusPunch', name: 'Supine DB Serratus Punch', equip: 'dumbbell', pair: true, muscles: ['serratus'], secondary: ['shoulders', 'chest'], img: 'Dumbbell_Incline_Shoulder_Raise', upper: true, cue: 'Punch the ceiling by lifting the shoulder blade off the bench — elbows stay locked', alts: ['bandPunch', 'pushupPlus'], basis: { lift: 'bench', k: 0.08 }, steps: ['Lie on a flat or slightly inclined bench, light dumbbells straight up over your shoulders.', 'Keeping elbows straight, reach the weights toward the ceiling so your shoulder blades lift off the bench.', 'Pause 1 s at the top.', 'Lower slowly by letting the shoulder blades sink back to the bench.'] }),
    E({ id: 'bandPunch', name: 'Standing Band Serratus Punch', equip: 'band', perSide: true, muscles: ['serratus'], secondary: ['shoulders', 'abdominals'], upper: true, cue: 'Reach long at the end — the shoulder blade wraps forward around the ribs', alts: ['serratusPunch'], steps: ['Anchor a light band behind you at chest height.', 'Hold it in one hand, elbow bent at your side, staggered stance.', 'Punch forward and slightly up until the arm is straight.', 'Keep reaching so the shoulder blade glides forward, hold 1 s, return slowly.'] }),
    E({ id: 'wallSlide', name: 'Band Wall Slide + Lift-off', equip: 'band', muscles: ['serratus'], secondary: ['traps', 'shoulders'], upper: true, cue: 'Keep outward tension on the band; slide up only as far as stays pain-free', alts: ['scaption'], steps: ['Loop a light band around both wrists, forearms on a wall at shoulder height.', 'Press out gently against the band.', 'Slide your forearms up the wall into a Y, letting the shoulder blades rotate upward.', 'At the top, lift the forearms an inch off the wall for 1–2 s.', 'Slide back down with control.'] }),
    E({ id: 'scaption', name: 'DB Scaption', equip: 'dumbbell', pair: true, muscles: ['shoulders', 'serratus'], secondary: ['traps'], img: 'Dumbbell_Scaption', upper: true, cue: 'Thumbs up, arms 30° in front of your sides, stop at shoulder height', alts: ['wallSlide'], basis: { lift: 'ohp', k: 0.07 } }),
    E({ id: 'bandER', name: 'Band External Rotation', equip: 'band', perSide: true, muscles: ['shoulders'], secondary: ['middle back'], img: 'External_Rotation_with_Band', upper: true, cue: 'Towel between elbow and ribs; rotate out slowly, no shrugging', alts: ['facePull'] }),
    E({ id: 'bearHold', name: 'Bear Plank Hold', equip: 'bodyweight', timed: true, muscles: ['serratus', 'abdominals'], secondary: ['shoulders', 'quadriceps'], upper: true, cue: 'Push the floor away, knees 1 inch up, slow breathing', alts: ['scapPushup'], steps: ['On hands and knees, hands under shoulders, knees under hips.', 'Push the floor away so your upper back fills out.', 'Lift your knees 1 inch off the floor.', 'Hold with steady breathing; set down if your shoulder complains.'] }),
    // Core / carries (timed)
    E({ id: 'copenhagen', name: 'Copenhagen Plank', equip: 'bodyweight', perSide: true, timed: true, muscles: ['adductors', 'abdominals'], secondary: ['abductors'], steps: ['Lie on your side, top leg resting on a bench at the knee or ankle.', 'Prop up on your forearm.', 'Lift your hips so your body forms a straight line.', 'Hold, then switch sides.'], upper: false, cue: 'Top leg on bench, hips high, straight line', alts: ['sidePlank'] }),
    E({ id: 'sidePlank', name: 'Side Plank', equip: 'bodyweight', perSide: true, timed: true, muscles: ['abdominals'], secondary: ['abductors', 'shoulders'], img: 'Side_Bridge', upper: false, cue: 'Hips forward and high', alts: ['copenhagen'] }),
    E({ id: 'deadBug', name: 'Dead Bug', equip: 'bodyweight', muscles: ['abdominals'], secondary: [], img: 'Dead_Bug', upper: false, cue: 'Low back glued to the floor, exhale fully', alts: ['sidePlank'] }),
    E({ id: 'suitcaseCarry', name: 'Suitcase Carry', equip: 'kettlebell', perSide: true, timed: true, muscles: ['abdominals', 'forearms'], secondary: ['traps', 'abductors', 'lower back'], img: 'Farmers_Walk', upper: false, cue: 'Tall, no lean, slow steps', alts: ['sidePlank'], basis: { lift: 'deadlift', k: 0.16 } }),
  ].map((e) => [e.id, e]),
);

// ---------- Full catalog (Free Exercise DB, public domain) ----------

interface CatalogEntry {
  id: string;
  name: string;
  equip: Equip;
  category: string;
  level: string;
  primary: string[];
  secondary: string[];
  steps: string[];
  img?: 1;
}

const UPPER = new Set(['chest', 'shoulders', 'triceps', 'biceps', 'lats', 'middle back', 'traps', 'forearms', 'neck']);
const linked = new Set(Object.values(EXERCISES).map((e) => e.img).filter(Boolean));

for (const c of catalog as CatalogEntry[]) {
  if (linked.has(c.id) || EXERCISES[c.id]) continue;
  EXERCISES[c.id] = {
    id: c.id,
    name: c.name,
    equip: c.equip,
    muscles: c.primary as Muscle[],
    secondary: c.secondary as Muscle[],
    upper: UPPER.has(c.primary[0]),
    timed: c.category === 'stretching' || /plank|bridge|hold/i.test(c.name),
    perSide: /one[- ]arm|one[- ]leg|single|alternat|side|lunge/i.test(c.name) && c.category !== 'stretching',
    cue: '',
    alts: [],
    img: c.img ? c.id : undefined,
    steps: c.steps,
    category: c.category,
    level: c.level,
    catalog: true,
  };
}

export const ex = (id: string): ExerciseDef =>
  EXERCISES[id] ?? { id, name: id, equip: 'bodyweight', muscles: [], secondary: [], upper: false, cue: '', alts: [] };

/** Program exercises link to a catalog photo set; catalog-only ones use their own id. */
export const imgUrls = (imgId?: string) => (imgId ? [`./ex/${imgId}/0.jpg`, `./ex/${imgId}/1.jpg`] : []);

/** Steps to show: our own, else the catalog's, else the cue. */
export function howTo(d: ExerciseDef): string[] {
  if (d.steps?.length) return d.steps;
  const c = d.img ? (catalog as CatalogEntry[]).find((x) => x.id === d.img) : undefined;
  return c?.steps.length ? c.steps : d.cue ? [d.cue] : [];
}

export const ALL_MUSCLES: Muscle[] = [
  'chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'lats', 'middle back', 'lower back', 'traps',
  'serratus', 'abdominals', 'glutes', 'quadriceps', 'hamstrings', 'adductors', 'abductors', 'calves', 'neck',
];

// ---------- Mobility ----------

export interface Move {
  id: string;
  name: string;
  sec: number;
  perSide?: boolean;
  cue: string;
  muscles: Muscle[];
  img?: string;
}

export const MOVES: Record<string, Move> = Object.fromEntries(
  [
    { id: 'hipCars', name: 'Hip CARs', sec: 60, perSide: true, cue: 'Slow full circles, keep the pelvis still. 5 each way.', muscles: ['glutes', 'abductors', 'adductors'], img: 'Standing_Hip_Circles' },
    { id: 'catCow', name: 'Cat-cow + T-spine rotation', sec: 120, cue: 'Segment the spine, then thread the needle each side.', muscles: ['lower back', 'middle back'], img: 'Cat_Stretch' },
    { id: 'switch9090', name: '90/90 Switch → Hold', sec: 60, perSide: true, cue: 'Sit tall, chest over the front shin, breathe into the back hip.', muscles: ['glutes', 'abductors', 'adductors'] },
    { id: 'couch', name: 'Couch Stretch', sec: 75, perSide: true, cue: 'Squeeze the glute of the back leg, ribs down, no arching.', muscles: ['quadriceps'], img: 'Kneeling_Hip_Flexor' },
    { id: 'cossackRock', name: 'Cossack Squat (KB counter)', sec: 90, perSide: true, cue: 'Sink slow, heel down, use the bell to sit deeper.', muscles: ['adductors', 'quadriceps', 'glutes'] },
    { id: 'pigeon', name: 'Pigeon → PAILs/RAILs', sec: 120, perSide: true, cue: '2 min hold; press shin down 10 s, then lift 10 s, repeat x2.', muscles: ['glutes', 'abductors'] },
    { id: 'gobletHold', name: 'Deep Goblet Squat Hold', sec: 90, cue: 'Elbows push knees out, shift side to side.', muscles: ['adductors', 'quadriceps', 'glutes'], img: 'Goblet_Squat' },
    { id: 'bandDistraction', name: 'Banded Hip Distraction', sec: 120, perSide: true, cue: 'Band high on the thigh, lean away, small rocks.', muscles: ['glutes', 'adductors'] },
    { id: 'rockBack', name: 'Cossack Rock-backs', sec: 45, perSide: true, cue: 'Wide stance, shift side to side, slow.', muscles: ['adductors', 'glutes'] },
    { id: 'bandWalk', name: 'Band Lateral Walks', sec: 60, cue: 'Band above knees, toes forward, steady tension.', muscles: ['abductors', 'glutes'], img: 'Monster_Walk' },
    { id: 'kneeWall', name: 'Knee-to-wall Ankle Rocks', sec: 45, perSide: true, cue: 'Heel down, knee over little toe.', muscles: ['calves'] },
    { id: 'childPose', name: 'Wide Child’s Pose', sec: 60, cue: 'Knees wide, slow breaths into the low back.', muscles: ['lower back', 'lats'], img: 'Childs_Pose' },
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
