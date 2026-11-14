import { useEffect, useMemo, useRef, useState } from 'react';
import { FLOWS, flowSteps } from '../lib/library';
import { daysBetween, todayISO } from '../lib/program';
import { unitL } from '../lib/progression';
import { setState, uid, useStore } from '../lib/store';
import type { RomTest } from '../lib/types';
import { beep, mmss, NumInput, useNow, useWakeLock, type Go, type Screen } from '../ui';

export default function Mobility({ go, flowId, back, workoutItem }: { go: Go; flowId: string; back: Screen; workoutItem?: number }) {
  const s = useStore();
  const today = todayISO();
  const hipFocus = !!s.hipFocusUntil && s.hipFocusUntil >= today;
  const steps = useMemo(() => flowSteps(flowId, hipFocus), [flowId, hipFocus]);
  const [idx, setIdx] = useState(0);
  const [end, setEnd] = useState<number | null>(null); // running → timestamp
  const [paused, setPaused] = useState<number>(steps[0].move.sec); // remaining secs while paused
  const [doneSecs, setDoneSecs] = useState(0);
  const now = useNow(end !== null);
  const fired = useRef(false);
  useWakeLock(true);

  const step = steps[idx];
  const remaining = end !== null ? Math.max(0, (end - now) / 1000) : paused;
  const total = steps.reduce((a, x) => a + x.move.sec, 0);

  const goTo = (i: number, autostart: boolean) => {
    if (i >= steps.length) return finish(true);
    setIdx(i);
    fired.current = false;
    if (autostart) setEnd(Date.now() + steps[i].move.sec * 1000);
    else { setEnd(null); setPaused(steps[i].move.sec); }
  };

  useEffect(() => {
    if (end !== null && remaining <= 0 && !fired.current) {
      fired.current = true;
      beep(2);
      setDoneSecs((d) => d + step.move.sec);
      setTimeout(() => goTo(idx + 1, true), 1200);
    }
  }, [remaining, end]);

  const finish = (completed: boolean) => {
    const secs = completed ? total : doneSecs;
    if (secs >= 60) {
      setState((st) => {
        const next = { ...st, mobility: [...st.mobility, { id: uid('m'), date: today, flowId, minutes: Math.round(secs / 60) }] };
        if (workoutItem !== undefined && st.active?.exercises[workoutItem]) {
          const a = structuredClone(st.active);
          a.exercises[workoutItem].flowDone = true;
          next.active = a;
        }
        return next;
      });
    }
    go(back);
  };

  const lastRom = s.rom.at(-1);
  const romDue = !lastRom || daysBetween(lastRom.date, today) >= 14;
  const [rom, setRom] = useState<Partial<RomTest>>({});
  const u = s.profile!.units;
  const tests: [keyof RomTest, keyof RomTest | null, string][] = [
    ['kneeWallL', 'kneeWallR', `Knee-to-wall (${unitL(u)})`],
    ['sit9090L', 'sit9090R', '90/90 sit (1–5)'],
    ['hipIrL', 'hipIrR', 'Hip IR seated (°)'],
    ['deepSquatSec', null, 'Deep squat hold (s)'],
  ];

  return (
    <div className="full">
      <header className="topbar">
        <div className="row">
          <button className="btn2" onClick={() => finish(false)}>Done</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{FLOWS[flowId].name} · {Math.round(total / 60)} min</div>
            <div className="small muted">Step {idx + 1} of {steps.length}{hipFocus ? ' · hip focus on' : ''}</div>
          </div>
        </div>
        <span className="chip" style={{ background: 'var(--mob-bg)', color: 'var(--mob)', borderColor: '#C7D2FE' }}>Sound cues on</span>
      </header>

      <div className="body">
        <div className="split">
          <section className="card grow" style={{ gap: 18, minHeight: 520 }}>
            <div style={{ flex: 1, minHeight: 220, borderRadius: 12, background: 'var(--mob-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' }}>
              <div className="lbl" style={{ color: 'var(--mob)' }}>{step.side ? `${step.side} side` : 'Both sides'}</div>
              <div style={{ fontSize: 96, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{mmss(remaining)}</div>
              <div style={{ fontSize: 15, color: 'var(--mob)' }}>{end === null ? (remaining === step.move.sec ? 'Tap Start when you’re in position' : 'Paused') : 'Breathe slow — 4 s in, 6 s out'}</div>
            </div>
            <div>
              <h1 className="h1">{step.move.name}</h1>
              <p style={{ color: 'var(--text2)', marginTop: 6 }}>{step.move.cue}</p>
            </div>
            <div className="bar"><div style={{ width: `${((step.move.sec - remaining) / step.move.sec) * 100}%` }} /></div>
            <div className="row wrap">
              <button className="btn2" style={{ minHeight: 56 }} disabled={idx === 0} onClick={() => goTo(idx - 1, false)}>Previous</button>
              {end === null ? (
                <button className="btn2" style={{ minHeight: 56 }} onClick={() => { fired.current = false; setEnd(Date.now() + remaining * 1000); }}>Start</button>
              ) : (
                <button className="btn2" style={{ minHeight: 56 }} onClick={() => { setPaused(remaining); setEnd(null); }}>Pause</button>
              )}
              <button className="btn2" style={{ minHeight: 56 }} onClick={() => (end !== null ? setEnd(end + 15000) : setPaused(paused + 15))}>+15 s</button>
              <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => { setDoneSecs((d) => d + (step.move.sec - remaining)); goTo(idx + 1, end !== null); }}>
                {idx + 1 < steps.length ? `Next: ${steps[idx + 1].move.name}${steps[idx + 1].side ? ` (${steps[idx + 1].side})` : ''}` : 'Finish'}
              </button>
            </div>
          </section>

          <aside className="aside" style={{ width: 360 }}>
            <section className="card" style={{ gap: 4 }}>
              <p className="lbl" style={{ marginBottom: 6 }}>Sequence</p>
              {steps.map((x, i) => (
                <button key={i} onClick={() => goTo(i, false)} className="between" style={{
                  padding: '8px 10px', borderRadius: 8, border: 0, fontSize: 14, textAlign: 'left',
                  background: i === idx ? 'var(--accent)' : 'transparent', color: i === idx ? '#fff' : i < idx ? 'var(--muted)' : 'var(--text)',
                  textDecoration: i < idx ? 'line-through' : 'none', fontWeight: i === idx ? 600 : 400,
                }}>
                  <span>{x.move.name}{x.side ? ` · ${x.side[0]}` : ''}</span><span className="small">{x.move.sec}s</span>
                </button>
              ))}
            </section>

            <section className="card">
              <div className="between"><p className="lbl">ROM check-in</p><span className="small" style={{ color: romDue ? 'var(--warn)' : 'var(--muted)' }}>{romDue ? 'Due now' : `Next in ${14 - daysBetween(lastRom!.date, today)} days`}</span></div>
              {tests.map(([l, r, name]) => (
                <div key={l} className="between">
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                    <div className="small muted">Last: {lastRom?.[l] ?? '—'}{r ? ` / ${lastRom?.[r] ?? '—'}` : ''}</div></div>
                  <div className="row" style={{ gap: 6 }}>
                    <NumInput style={{ width: 64, textAlign: 'center' }} label={`${name} ${r ? 'left' : ''}`} value={rom[l] as number | undefined} onChange={(n) => setRom((x) => ({ ...x, [l]: n }))} />
                    {r ? <NumInput style={{ width: 64, textAlign: 'center' }} label={`${name} right`} value={rom[r] as number | undefined} onChange={(n) => setRom((x) => ({ ...x, [r]: n }))} /> : <span style={{ width: 64 }} />}
                  </div>
                </div>
              ))}
              <div className="small muted">Left / right</div>
              <button className="btn2" disabled={Object.values(rom).every((v) => v === undefined)} onClick={() => {
                setState((st) => ({ ...st, rom: [...st.rom, { id: uid('r'), date: today, ...rom }] }));
                setRom({});
              }}>Save check-in</button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
