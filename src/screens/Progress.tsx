import { useMemo, useState } from 'react';
import { ex } from '../lib/library';
import { addDays, anchorE1rm, mondayOf, todayISO } from '../lib/program';
import { bestE1rm, toUnits, unitD, unitL, unitW, workSets } from '../lib/progression';
import { useStore } from '../lib/store';
import type { Muscle } from '../lib/types';
import { LineChart, mmss, Seg } from '../ui';

const LIFTS = ['squat', 'bench', 'deadlift', 'ohp'];
const MUSCLES: Muscle[] = ['quads', 'hamstrings', 'glutes', 'chest', 'back', 'shoulders', 'arms', 'core'];

export default function Progress() {
  const s = useStore();
  const p = s.profile!;
  const u = p.units;
  const [range, setRange] = useState<'block' | 'cycle' | 'all'>('cycle');
  const [lift, setLift] = useState('squat');
  const today = todayISO();

  const from = range === 'all' ? '0000' : range === 'cycle' ? p.startDate : addDays(mondayOf(today), -21);
  const logs = s.workouts.filter((w) => w.endedAt && w.date >= from);

  const series = useMemo(() => Object.fromEntries(LIFTS.map((l) => [l, logs
    .map((w) => ({ w, le: w.exercises.find((e) => e.exId === l) }))
    .filter((x) => x.le && bestE1rm(x.le) > 0)
    .map(({ w, le }) => ({ x: w.date.slice(5).replace('-', '/'), y: toUnits(bestE1rm(le!), w.units, u) }))])), [logs, u]);

  const monday = mondayOf(today);
  const weekSets = useMemo(() => {
    const out = Object.fromEntries(MUSCLES.map((m) => [m, 0])) as Record<Muscle, number>;
    s.workouts.filter((w) => w.date >= monday).forEach((w) => w.exercises.forEach((e) => {
      const n = workSets(e).filter((x) => x.done).length;
      ex(e.exId).muscles.forEach((m, i) => (out[m] += i === 0 ? n : n * 0.5));
    }));
    return out;
  }, [s.workouts, monday]);

  const outdoorIn = s.outdoor.filter((o) => o.date >= from);
  const dunes = outdoorIn.filter((o) => o.type === 'dunes' && o.reps?.length);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const rucks = outdoorIn.filter((o) => o.type === 'ruck');
  const rom = s.rom.filter((r) => r.date >= from);
  const romFirst = rom[0], romLast = rom.at(-1);
  const pair = (a?: number, b?: number) => (a === undefined && b === undefined ? '—' : `${a ?? '—'} / ${b ?? '—'}`);

  return (
    <main className="main">
      <header className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <p className="lbl">{logs.length} workouts · {outdoorIn.length} outdoor sessions</p>
          <h1 className="h1" style={{ marginTop: 4 }}>Progress</h1>
        </div>
        <div style={{ width: 380 }}>
          <Seg label="Range" value={range} options={[{ v: 'block', t: 'Last 4 weeks' }, { v: 'cycle', t: 'This cycle' }, { v: 'all', t: 'All time' }]} onChange={setRange} />
        </div>
      </header>

      <div className="grid4">
        {LIFTS.map((l) => {
          const pts = series[l];
          const cur = pts.at(-1)?.y ?? anchorE1rm(s, l);
          const delta = pts.length > 1 ? pts.at(-1)!.y - pts[0].y : 0;
          const on = l === lift;
          return (
            <button key={l} onClick={() => setLift(l)} aria-pressed={on} style={{
              textAlign: 'left', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4,
              background: on ? 'var(--accent)' : '#fff', color: on ? '#fff' : 'var(--text)', border: on ? 0 : '1px solid var(--line)',
            }}>
              <span className="small" style={{ fontWeight: 600 }}>{ex(l).name} · est. max</span>
              <span style={{ fontWeight: 700, fontSize: 26 }}>{cur ? `${Math.round(cur)} ${unitW(u)}` : '—'}</span>
              <span className="small">{pts.length > 1 ? `${delta >= 0 ? '+' : ''}${Math.round(delta)} ${unitW(u)} in range` : pts.length ? 'log more sessions' : 'from your setup'}</span>
            </button>
          );
        })}
      </div>

      <div className="split">
        <section className="card grow">
          <div className="between"><p className="lbl">{ex(lift).name} · estimated 1-rep max per session</p><span className="small muted">from your best set</span></div>
          <LineChart points={series[lift]} label={`${ex(lift).name} estimated max`} unit={unitW(u)} />
        </section>

        <div className="aside" style={{ width: 380 }}>
          <section className="card" style={{ gap: 8 }}>
            <p className="lbl">This week’s sets by muscle · aim 12–20</p>
            {MUSCLES.map((m) => (
              <div key={m} className="row small" style={{ gap: 10 }}>
                <span style={{ width: 86, textTransform: 'capitalize' }}>{m}</span>
                <div className="bar grow" style={{ height: 10 }}><div style={{ width: `${Math.min(100, (weekSets[m] / 20) * 100)}%`, background: weekSets[m] >= 12 ? 'var(--accent)' : '#5EAAA3' }} /></div>
                <span style={{ width: 28, textAlign: 'right', fontWeight: 600 }}>{Math.round(weekSets[m])}</span>
              </div>
            ))}
          </section>
          <section className="card" style={{ gap: 6 }}>
            <p className="lbl">Mobility & outdoor</p>
            {[
              [`Knee-to-wall L / R (${unitL(u)})`, romFirst ? `${pair(romFirst.kneeWallL, romFirst.kneeWallR)} → ${pair(romLast!.kneeWallL, romLast!.kneeWallR)}` : '—'],
              ['Hip IR L / R (°)', romFirst ? `${pair(romFirst.hipIrL, romFirst.hipIrR)} → ${pair(romLast!.hipIrL, romLast!.hipIrR)}` : '—'],
              ['90/90 sit L / R', romFirst ? `${pair(romFirst.sit9090L, romFirst.sit9090R)} → ${pair(romLast!.sit9090L, romLast!.sit9090R)}` : '—'],
              ['Mobility minutes', String(s.mobility.filter((m) => m.date >= from).reduce((a, m) => a + m.minutes, 0))],
              ['Dune repeat avg', dunes.length ? `${mmss(avg(dunes[0].reps!))} → ${mmss(avg(dunes.at(-1)!.reps!))}` : '—'],
              ['Ruck', rucks.length ? `${rucks.at(-1)!.load ?? '—'} ${unitW(u)} · ${Math.round(rucks.reduce((a, r) => a + toUnits(r.distance ?? 0, r.units, u), 0) * 10) / 10} ${unitD(u)} total` : '—'],
              ['Sauna / cold sessions', String(s.recovery.filter((r) => r.date >= from).length)],
            ].map(([k, v]) => (
              <div key={k} className="between small" style={{ padding: '5px 0', borderTop: '1px solid var(--bg)' }}><span>{k}</span><strong style={{ textAlign: 'right' }}>{v}</strong></div>
            ))}
          </section>
        </div>
      </div>

      <section className="card">
        <p className="lbl">Recent workouts</p>
        {logs.length === 0 ? <p className="muted small">Nothing yet.</p> : (
          <table className="simple">
            <thead><tr><th>Date</th><th>Session</th><th>Sets</th><th>Effort</th><th>Notes</th></tr></thead>
            <tbody>
              {[...logs].reverse().slice(0, 12).map((w) => (
                <tr key={w.id}>
                  <td>{w.date}</td>
                  <td>{w.name}</td>
                  <td>{w.exercises.reduce((a, e) => a + workSets(e).filter((x) => x.done).length, 0)}</td>
                  <td>{w.sessionRpe ? `RPE ${w.sessionRpe}` : '—'}</td>
                  <td className="muted">{w.notes ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
