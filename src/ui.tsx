import { useEffect, useRef, useState, type ReactNode } from 'react';

export type Screen =
  | { name: 'today' }
  | { name: 'program' }
  | { name: 'library' }
  | { name: 'outdoor'; type?: string; recovery?: boolean }
  | { name: 'progress' }
  | { name: 'setup' }
  | { name: 'workout' }
  | { name: 'feedback'; id: string }
  | { name: 'mobility'; flowId: string; back: Screen; workoutItem?: number };

export type Go = (s: Screen) => void;

const ICONS: Record<string, ReactNode> = {
  today: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  program: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  library: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
  outdoor: <path d="M2 16c3-3 5-3 8 0s5 3 8 0 3-2 4-1M5 9l4-5 4 5 3-3 4 4" />,
  progress: <path d="M4 20V11M10 20V5M16 20v-7M21 20H3" />,
  setup: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" /></>,
};

const NAV: [Screen['name'], string][] = [
  ['today', 'Today'], ['program', 'Program'], ['library', 'Exercises'], ['outdoor', 'Outdoor'], ['progress', 'Progress'], ['setup', 'Profile'],
];

export function SideNav({ current, go }: { current: string; go: Go }) {
  return (
    <nav className="side" aria-label="Main">
      {NAV.map(([id, label]) => (
        <button key={id} className={`nav${current === id ? ' on' : ''}`} onClick={() => go({ name: id } as Screen)} aria-current={current === id ? 'page' : undefined}>
          <svg aria-hidden="true" viewBox="0 0 24 24">{ICONS[id]}</svg>
          {label}
        </button>
      ))}
    </nav>
  );
}

export function Seg<T extends string | number>({ value, options, onChange, label }: {
  value: T; options: { v: T; t: string }[]; onChange: (v: T) => void; label?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.v)} type="button" className={o.v === value ? 'on' : ''} aria-pressed={o.v === value} onClick={() => onChange(o.v)}>
          {o.t}
        </button>
      ))}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <div className="h2">{title}</div>
          <button className="btn2" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function NumInput({ value, onChange, label, step = 1, className = 'inp', style }: {
  value: number | undefined; onChange: (n: number | undefined) => void; label: string; step?: number; className?: string; style?: React.CSSProperties;
}) {
  const [text, setText] = useState(value === undefined || Number.isNaN(value) ? '' : String(value));
  useEffect(() => {
    if (Number(text) !== value) setText(value === undefined ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      className={className}
      style={style}
      inputMode="decimal"
      aria-label={label}
      value={text}
      step={step}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
    />
  );
}

/** Ticks once a second while mounted. */
export function useNow(active = true) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export const mmss = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

let audio: AudioContext | undefined;
/** Short beeps — iPad has no vibration, so sound is the cue. */
export function beep(times = 2) {
  try {
    audio ??= new AudioContext();
    for (let i = 0; i < times; i++) {
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = 880;
      o.connect(g).connect(audio.destination);
      const t = audio.currentTime + i * 0.3;
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t);
      o.stop(t + 0.22);
    }
  } catch {
    /* audio unavailable */
  }
}

/** Unlock audio on a user gesture (iOS requires it). */
export function primeAudio() {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume();
  } catch {
    /* ignore */
  }
}

/** Keep the screen on during a session. */
export function useWakeLock(active: boolean) {
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    const req = () => navigator.wakeLock.request('screen').then((l) => (lock.current = l)).catch(() => undefined);
    req();
    const onVis = () => document.visibilityState === 'visible' && req();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      lock.current?.release().catch(() => undefined);
    };
  }, [active]);
}

export function Toast({ msg }: { msg: string | null }) {
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

export function useToast(): [string | null, (m: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const t = useRef<number>();
  return [msg, (m: string) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = window.setTimeout(() => setMsg(null), 2600);
  }];
}

/** Minimal line chart: x = index, y = value. */
export function LineChart({ points, label, unit, height = 220 }: {
  points: { x: string; y: number }[]; label: string; unit: string; height?: number;
}) {
  const W = 600, H = height, L = 44, R = 12, T = 14, B = 26;
  if (points.length === 0) {
    return <div className="muted small" style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No data yet — log a session to start the chart.</div>;
  }
  const ys = points.map((p) => p.y);
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const pad = Math.max(5, (hi - lo) * 0.15);
  lo = Math.floor((lo - pad) / 5) * 5;
  hi = Math.ceil((hi + pad) / 5) * 5;
  const x = (i: number) => (points.length === 1 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (points.length - 1));
  const y = (v: number) => T + ((hi - v) * (H - T - B)) / (hi - lo || 1);
  const ticks = [0, 1, 2, 3].map((i) => lo + ((hi - lo) * i) / 3);
  const step = Math.ceil(points.length / 6);
  return (
    <svg role="img" aria-label={`${label}: ${points[0].y.toFixed(0)} to ${points.at(-1)!.y.toFixed(0)} ${unit}`} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#E5E7EB" />
          <text x={4} y={y(t) + 4} fontSize="11" fill="#4B5563">{Math.round(t)}</text>
        </g>
      ))}
      <polyline fill="none" stroke="#0F766E" strokeWidth="3" strokeLinejoin="round" points={points.map((p, i) => `${x(i)},${y(p.y)}`).join(' ')} />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.y)} r={i === points.length - 1 ? 6 : 4.5} fill="#0F766E"><title>{`${p.x}: ${p.y.toFixed(1)} ${unit}`}</title></circle>
          {i % step === 0 || i === points.length - 1 ? <text x={x(i)} y={H - 6} fontSize="11" fill="#4B5563" textAnchor="middle">{p.x}</text> : null}
        </g>
      ))}
    </svg>
  );
}
