import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ALL_MUSCLES, EXERCISES, ex, howTo, imgUrls, type ExerciseDef } from './lib/library';
import type { Muscle } from './lib/types';
import { Modal, Seg } from './ui';

const PRI = '#0F766E';
const SEC = '#7DD3C4';
const OFF = '#D1D5DB';
const SKIN = '#EEF0F3';

export const muscleLabel = (m: string) => m.charAt(0).toUpperCase() + m.slice(1);

type Shape = { m: Muscle; el: (fill: string, key: string) => ReactNode };
const ell = (m: Muscle, cx: number, cy: number, rx: number, ry: number, mirror = true): Shape[] => {
  const one = (x: number): Shape => ({ m, el: (f, k) => <ellipse key={k} cx={x} cy={cy} rx={rx} ry={ry} fill={f} /> });
  return mirror ? [one(cx), one(100 - cx)] : [one(cx)];
};
const poly = (m: Muscle, pts: [number, number][], mirror = true): Shape[] => {
  const s = (p: [number, number][]): Shape => ({ m, el: (f, k) => <polygon key={k} points={p.map((q) => q.join(',')).join(' ')} fill={f} /> });
  return mirror ? [s(pts), s(pts.map(([x, y]) => [100 - x, y]))] : [s(pts)];
};
const rect = (m: Muscle, x: number, y: number, w: number, h: number, r = 3): Shape[] => [
  { m, el: (f, k) => <rect key={k} x={x} y={y} width={w} height={h} rx={r} fill={f} /> },
];

const FRONT: Shape[] = [
  ...rect('neck', 45, 25, 10, 7, 2),
  ...poly('traps', [[38, 33], [45, 27], [45, 33]]),
  ...ell('shoulders', 31, 40, 7, 7),
  ...poly('chest', [[37, 35], [49, 35], [49, 52], [40, 53], [36, 46]]),
  ...poly('serratus', [[36, 48], [40.5, 53], [41, 62], [36.5, 58]]),
  ...ell('biceps', 26, 56, 4.5, 10),
  ...ell('forearms', 22.5, 80, 4, 11),
  ...rect('abdominals', 42, 55, 16, 31, 5),
  ...ell('abductors', 35, 93, 3.5, 7),
  ...ell('quadriceps', 40, 114, 6.5, 20),
  ...ell('adductors', 46.5, 106, 2.6, 12),
  ...ell('calves', 40, 158, 4.5, 15),
];

const BACK: Shape[] = [
  ...rect('neck', 45, 25, 10, 6, 2),
  ...poly('traps', [[50, 27], [37, 35], [50, 56], [63, 35]], false),
  ...ell('shoulders', 31, 40, 7, 7),
  ...poly('lats', [[37, 44], [45, 52], [45, 72], [38, 64]]),
  ...rect('middle back', 46, 44, 8, 14, 2),
  ...rect('lower back', 43, 64, 14, 20, 4),
  ...poly('serratus', [[35, 50], [37.5, 52], [38, 60], [35.5, 58]]),
  ...ell('triceps', 26, 56, 4.5, 10),
  ...ell('forearms', 22.5, 80, 4, 11),
  ...ell('abductors', 34.5, 92, 3.5, 7),
  ...ell('glutes', 43, 97, 8, 9),
  ...ell('hamstrings', 41, 124, 6.5, 17),
  ...ell('calves', 41, 157, 5, 13),
];

function Figure({ shapes, color, label }: { shapes: Shape[]; color: (m: Muscle) => string; label: string }) {
  return (
    <g>
      <circle cx="50" cy="14" r="9" fill={SKIN} />
      <rect x="34" y="30" width="32" height="60" rx="9" fill={SKIN} />
      <rect x="19" y="34" width="13" height="60" rx="6" fill={SKIN} />
      <rect x="68" y="34" width="13" height="60" rx="6" fill={SKIN} />
      <rect x="33" y="84" width="16" height="96" rx="7" fill={SKIN} />
      <rect x="51" y="84" width="16" height="96" rx="7" fill={SKIN} />
      {shapes.map((s, i) => s.el(color(s.m), `${s.m}${i}`))}
      <text x="50" y="194" fontSize="9" textAnchor="middle" fill="#4B5563">{label}</text>
    </g>
  );
}

/** Front + back body diagram; primary muscles dark, secondary light. */
export function MuscleMap({ primary, secondary = [], height = 200 }: { primary: string[]; secondary?: string[]; height?: number }) {
  const color = (m: Muscle) => (primary.includes(m) ? PRI : secondary.includes(m) ? SEC : OFF);
  const all = [...primary, ...secondary];
  return (
    <svg viewBox="0 0 210 200" style={{ height, width: 'auto', maxWidth: '100%' }} role="img"
      aria-label={`Muscles worked: ${primary.join(', ')}${secondary.length ? `; assisting: ${secondary.join(', ')}` : ''}`}>
      <Figure shapes={FRONT} color={color} label="Front" />
      <g transform="translate(110 0)"><Figure shapes={BACK} color={color} label="Back" /></g>
      {all.length === 0 && <text x="105" y="100" textAnchor="middle" fontSize="10" fill="#4B5563">No muscle data</text>}
    </svg>
  );
}

export function MuscleChips({ d, small }: { d: Pick<ExerciseDef, 'muscles' | 'secondary'>; small?: boolean }) {
  const sz = small ? { minHeight: 24, fontSize: 12, padding: '0 8px' } : {};
  return (
    <div className="row wrap" style={{ gap: 6 }}>
      {d.muscles.map((m) => <span key={m} className="chip" style={{ background: PRI, color: '#fff', borderColor: PRI, ...sz }}>{muscleLabel(m)}</span>)}
      {d.secondary.map((m) => <span key={m} className="chip" style={{ background: '#E6F7F4', color: '#134E4A', borderColor: SEC, ...sz }}>{muscleLabel(m)}</span>)}
    </div>
  );
}

/** Start/finish photos that alternate to show the movement. Tap to pause. */
export function ExercisePhotos({ imgId, height = 220 }: { imgId?: string; height?: number }) {
  const urls = imgUrls(imgId);
  const [frame, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!urls.length || paused) return;
    const t = setInterval(() => setFrame((f) => 1 - f), 1300);
    return () => clearInterval(t);
  }, [imgId, paused]);
  if (!urls.length) return null;
  return (
    <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Play movement' : 'Pause movement'}
      style={{ position: 'relative', border: 0, padding: 0, background: '#fff', borderRadius: 12, overflow: 'hidden', height, width: '100%' }}>
      {urls.map((u, i) => (
        <img key={u} src={u} alt={i === 0 ? 'Start position' : 'End position'} loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: frame === i ? 1 : 0, transition: 'opacity .35s' }} />
      ))}
      <span className="chip" style={{ position: 'absolute', left: 8, bottom: 8, minHeight: 26, fontSize: 12 }}>
        {paused ? '❚❚ ' : ''}{frame === 0 ? 'Start' : 'Finish'}
      </span>
    </button>
  );
}

export function ExerciseInfo({ id, action }: { id: string; action?: ReactNode }) {
  const d = ex(id);
  const steps = howTo(d);
  return (
    <div className="col" style={{ gap: 14 }}>
      {d.img ? <ExercisePhotos imgId={d.img} /> : <div className="tip small">No photo for this one yet — follow the steps and the muscle map below.</div>}
      <div className="row wrap" style={{ alignItems: 'center', gap: 16 }}>
        <MuscleMap primary={d.muscles} secondary={d.secondary} height={170} />
        <div className="col grow" style={{ gap: 8, minWidth: 180 }}>
          <span className="lbl">Muscles worked</span>
          <MuscleChips d={d} />
          <span className="small muted">Dark = main target · light = assisting</span>
          <span className="small muted" style={{ textTransform: 'capitalize' }}>{d.equip}{d.level ? ` · ${d.level}` : ''}{d.category ? ` · ${d.category}` : ''}</span>
        </div>
      </div>
      {d.cue && <div className="tip"><strong>Key cue:</strong> {d.cue}</div>}
      {steps.length > 0 && (
        <div className="col" style={{ gap: 6 }}>
          <span className="lbl">How to do it</span>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, lineHeight: 1.45 }}>
            {steps.map((st, i) => <li key={i}>{st}</li>)}
          </ol>
        </div>
      )}
      {action}
    </div>
  );
}

export function ExerciseInfoModal({ id, onClose, action }: { id: string; onClose: () => void; action?: ReactNode }) {
  return (
    <Modal title={ex(id).name} onClose={onClose}>
      <ExerciseInfo id={id} action={action} />
    </Modal>
  );
}

const EQUIPS = [
  { v: 'all', t: 'All' }, { v: 'barbell', t: 'Barbell' }, { v: 'dumbbell', t: 'Dumbbell' },
  { v: 'kettlebell', t: 'Kettlebell' }, { v: 'band', t: 'Band' }, { v: 'bodyweight', t: 'Body' },
];
const KINDS = [{ v: 'all', t: 'All types' }, { v: 'strength', t: 'Strength' }, { v: 'stretching', t: 'Stretch' }, { v: 'power', t: 'Power' }];

/** Searchable list of every exercise, with photo thumbnails and muscles. */
export function ExercisePicker({ onSelect, initialMuscle = 'all', highlight }: {
  onSelect: (id: string) => void; initialMuscle?: string; highlight?: Set<string>;
}) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState(initialMuscle);
  const [equip, setEquip] = useState('all');
  const [kind, setKind] = useState('all');
  const [limit, setLimit] = useState(40);

  const list = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return Object.values(EXERCISES)
      .filter((d) => (muscle === 'all' ? true : d.muscles.includes(muscle as Muscle) || (muscle.startsWith('+') && d.secondary.includes(muscle.slice(1) as Muscle))))
      .filter((d) => equip === 'all' || d.equip === equip)
      .filter((d) => {
        if (kind === 'all') return true;
        const c = d.category ?? (d.timed ? 'strength' : 'strength');
        return kind === 'power' ? /plyometrics|olympic/.test(c) || ['kbSnatch', 'kbCleanPress', 'jumpSquat', 'latBound', 'kbSwingDyn'].includes(d.id) : c === kind;
      })
      .filter((d) => words.every((w) => `${d.name} ${d.muscles.join(' ')} ${d.secondary.join(' ')} ${d.equip}`.toLowerCase().includes(w)))
      .sort((a, b) => Number(!!a.catalog) - Number(!!b.catalog) || a.name.localeCompare(b.name));
  }, [q, muscle, equip, kind]);

  return (
    <div className="col" style={{ gap: 12 }}>
      <input className="inp" type="search" placeholder="Search exercises or muscles" aria-label="Search exercises" value={q}
        onChange={(e) => { setQ(e.target.value); setLimit(40); }} />
      <div className="row wrap" style={{ gap: 8 }}>
        <select className="inp" style={{ width: 'auto', minWidth: 180, fontSize: 15 }} aria-label="Muscle" value={muscle} onChange={(e) => { setMuscle(e.target.value); setLimit(40); }}>
          <option value="all">All muscles</option>
          {ALL_MUSCLES.map((m) => <option key={m} value={m}>{muscleLabel(m)}</option>)}
        </select>
        <div style={{ flex: '1 1 360px' }}><Seg label="Equipment" value={equip} options={EQUIPS} onChange={(v) => { setEquip(v); setLimit(40); }} /></div>
        <div style={{ flex: '1 1 300px' }}><Seg label="Type" value={kind} options={KINDS} onChange={(v) => { setKind(v); setLimit(40); }} /></div>
      </div>
      <span className="small muted">{list.length} exercises</span>
      <div className="col" style={{ gap: 8 }}>
        {list.slice(0, limit).map((d) => (
          <button key={d.id} className="optrow" style={{ justifyContent: 'flex-start', gap: 14 }} onClick={() => onSelect(d.id)}>
            {d.img ? (
              <img src={imgUrls(d.img)[0]} alt="" loading="lazy" style={{ width: 84, height: 56, objectFit: 'cover', borderRadius: 8, flex: 'none', background: 'var(--bg)' }} />
            ) : (
              <span style={{ width: 84, height: 56, flex: 'none', display: 'flex', justifyContent: 'center' }}><MuscleMap primary={d.muscles} secondary={d.secondary} height={56} /></span>
            )}
            <span className="grow" style={{ minWidth: 0 }}>
              <strong>{d.name}</strong>
              {highlight?.has(d.id) && <span className="lbl ac" style={{ marginLeft: 8 }}>In program</span>}
              <br />
              <span className="small muted">{d.muscles.map(muscleLabel).join(', ')}{d.secondary.length ? ` · also ${d.secondary.map(muscleLabel).join(', ')}` : ''}</span>
            </span>
            <span className="small muted" style={{ textTransform: 'capitalize', flex: 'none' }}>{d.equip}</span>
          </button>
        ))}
        {list.length > limit && <button className="btn2" onClick={() => setLimit((l) => l + 60)}>Show more ({list.length - limit} left)</button>}
      </div>
    </div>
  );
}

/** Fetch every exercise photo once so the service worker keeps them for offline use. */
export async function cacheAllPhotos(onProgress: (done: number, total: number) => void) {
  const urls = [...new Set(Object.values(EXERCISES).flatMap((d) => imgUrls(d.img)))];
  let done = 0;
  for (let i = 0; i < urls.length; i += 12) {
    await Promise.all(urls.slice(i, i + 12).map((u) => fetch(u).catch(() => undefined)));
    done = Math.min(urls.length, i + 12);
    onProgress(done, urls.length);
  }
}
