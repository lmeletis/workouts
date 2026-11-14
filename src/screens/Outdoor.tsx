import { useEffect, useMemo, useRef, useState } from 'react';
import { clampWeek, duneTarget, todayISO, weekOf } from '../lib/program';
import { unitD, unitT, unitW } from '../lib/progression';
import { setState, uid, useStore } from '../lib/store';
import type { OutdoorLog, OutdoorType } from '../lib/types';
import { beep, mmss, Modal, NumInput, primeAudio, Seg, Toast, useNow, useToast, useWakeLock, type Go } from '../ui';

const TYPES: { v: OutdoorType; t: string }[] = [
  { v: 'dunes', t: 'Dune hills' }, { v: 'ruck', t: 'Ruck' }, { v: 'walk', t: 'Beach walk' }, { v: 'sprints', t: 'Sand sprints' }, { v: 'other', t: 'Other' },
];

export default function Outdoor({ go, initialType }: { go: Go; initialType?: string }) {
  const s = useStore();
  const p = s.profile!;
  const u = p.units;
  const today = todayISO();
  const week = clampWeek(weekOf(p, today));
  const [type, setType] = useState<OutdoorType>((initialType as OutdoorType) ?? 'dunes');
  const [log, setLog] = useState<Partial<OutdoorLog>>({ reps: [] });
  const [repStart, setRepStart] = useState<number | null>(null);
  const [rounds, setRounds] = useState<{ saunaMin: number; coldSec: number }[]>([]);
  const [lakeTemp, setLakeTemp] = useState<number | undefined>(s.recovery.at(-1)?.lakeTemp);
  const [saunaTemp, setSaunaTemp] = useState<number | undefined>(s.recovery.at(-1)?.saunaTemp);
  const [timer, setTimer] = useState<{ kind: 'sauna' | 'cold'; end: number; total: number } | null>(null);
  const [coldCheck, setColdCheck] = useState(false);
  const [toast, showToast] = useToast();
  const now = useNow(repStart !== null || timer !== null);
  const fired = useRef(false);
  useWakeLock(repStart !== null || timer !== null);

  const timerLeft = timer ? (timer.end - now) / 1000 : 0;
  useEffect(() => {
    if (timer && timerLeft <= 0 && !fired.current) {
      fired.current = true;
      beep(3);
      const done = timer;
      setTimer(null);
      setRounds((r) => {
        const c = [...r];
        const last = c.at(-1);
        if (done.kind === 'sauna') c.push({ saunaMin: Math.round(done.total / 60), coldSec: 0 });
        else if (last && last.coldSec === 0) c[c.length - 1] = { ...last, coldSec: done.total };
        else c.push({ saunaMin: 0, coldSec: done.total });
        return c;
      });
      if (done.kind === 'cold') setColdCheck(true);
    }
  }, [timerLeft, timer]);

  const startTimer = (kind: 'sauna' | 'cold') => {
    primeAudio();
    fired.current = false;
    const total = kind === 'sauna' ? (p.coldExperience === 'new' ? 600 : 720) : p.coldExperience === 'new' ? 45 : p.coldExperience === 'some' ? 90 : 150;
    setTimer({ kind, end: Date.now() + total * 1000, total });
  };

  const lastRucks = s.outdoor.filter((o) => o.type === 'ruck').slice(-2);
  const ruckSuggest = useMemo(() => {
    const l = lastRucks.at(-1);
    if (!l?.load) return undefined;
    const bump = lastRucks.length === 2 && lastRucks.every((r) => r.load === l.load && (r.rpe ?? 10) <= 7);
    return l.load + (bump ? (u === 'imperial' ? 5 : 2) : 0);
  }, [lastRucks, u]);

  const reps = log.reps ?? [];
  const timed = type === 'dunes' || type === 'sprints';
  const target = type === 'dunes' ? duneTarget(week) : 6;

  const hasOutdoor = timed ? reps.length > 0 : !!(log.distance || log.minutes);
  const canSave = hasOutdoor || rounds.length > 0;

  const save = () => {
    setState((st) => ({
      ...st,
      outdoor: hasOutdoor ? [...st.outdoor, { id: uid('o'), date: today, type, units: u, ...log, reps: timed ? reps : undefined }] : st.outdoor,
      recovery: rounds.length ? [...st.recovery, { id: uid('c'), date: today, units: u, lakeTemp, saunaTemp, rounds }] : st.recovery,
    }));
    setLog({ reps: [] });
    setRounds([]);
    showToast('Saved');
    setTimeout(() => go({ name: 'today' }), 600);
  };

  const field = (k: keyof OutdoorLog, label: string) => (
    <div className="col" style={{ gap: 6 }}>
      <span className="lbl">{label}</span>
      <NumInput label={label} value={log[k] as number | undefined} onChange={(n) => setLog((l) => ({ ...l, [k]: n }))} />
    </div>
  );

  return (
    <main className="main">
      <header className="between" style={{ flexWrap: 'wrap' }}>
        <div>
          <p className="lbl">Week {week} · {new Date().toLocaleDateString(undefined, { weekday: 'long' })}</p>
          <h1 className="h1" style={{ marginTop: 4 }}>Log outdoor session</h1>
        </div>
        <div style={{ minWidth: 520, maxWidth: '100%' }}>
          <Seg label="Activity type" value={type} options={TYPES} onChange={(v) => { setType(v); setRepStart(null); }} />
        </div>
      </header>

      <div className="split">
        <section className="card grow" style={{ gap: 14 }}>
          {timed ? (
            <>
              <div className="between">
                <h2 className="h2">{type === 'dunes' ? 'Dune hill repeats' : 'Sand sprints'}</h2>
                <span className="small muted">Target {target} × {type === 'dunes' ? '20–40 s · walk down' : '10–20 s · walk back'}</span>
              </div>
              <div className="grid4">
                {Array.from({ length: Math.max(target, reps.length + (repStart ? 1 : 0)) }, (_, i) => {
                  const t = reps[i];
                  const running = i === reps.length && repStart !== null;
                  return (
                    <div key={i} style={{
                      borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 4,
                      ...(t !== undefined ? { background: 'var(--bg)' } : running ? { background: 'var(--accent)', color: '#fff' } : { border: '1px dashed var(--line2)', color: 'var(--muted)' }),
                    }}>
                      <span className="small" style={{ fontWeight: 600 }}>Rep {i + 1}</span>
                      <span style={{ fontWeight: 700, fontSize: 22 }}>{t !== undefined ? mmss(t) : running ? mmss((now - repStart!) / 1000) : '—'}</span>
                    </div>
                  );
                })}
              </div>
              <div className="entry" style={{ alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 44, color: 'var(--accent)', width: 130, fontVariantNumeric: 'tabular-nums' }}>{repStart ? mmss((now - repStart) / 1000) : '0:00'}</div>
                <div className="grow small" style={{ color: '#134E4A' }}>
                  {repStart ? `Rep ${reps.length + 1} running — tap at the top` : reps.length >= target ? 'Target reached. Extra reps are optional.' : `Tap Start at the bottom of the ${type === 'dunes' ? 'dune' : 'sprint'}`}
                  {reps.length >= 3 && Math.max(...reps.slice(-2)) > Math.min(...reps) * 1.15 && <div style={{ color: 'var(--warn)', marginTop: 4 }}>Times slowing more than 15% — good place to stop.</div>}
                </div>
                {repStart ? (
                  <button className="btn" onClick={() => { setLog((l) => ({ ...l, reps: [...(l.reps ?? []), Math.round((Date.now() - repStart) / 1000)] })); setRepStart(null); }}>Top reached</button>
                ) : (
                  <button className="btn" onClick={() => setRepStart(Date.now())}>Start rep {reps.length + 1}</button>
                )}
                {reps.length > 0 && !repStart && <button className="btn2" onClick={() => setLog((l) => ({ ...l, reps: (l.reps ?? []).slice(0, -1) }))}>Undo</button>}
              </div>
              <div className="grid3">
                <div className="col" style={{ gap: 6 }}>
                  <span className="lbl">Sand</span>
                  <Seg label="Sand" value={log.sand ?? 'soft'} options={[{ v: 'soft', t: 'Soft' }, { v: 'packed', t: 'Packed' }, { v: 'wet', t: 'Wet' }]} onChange={(v) => setLog((l) => ({ ...l, sand: v }))} />
                </div>
                {field('rpe', 'Effort (RPE 1–10)')}
                {field('avgHr', 'Avg HR (optional)')}
              </div>
            </>
          ) : (
            <>
              <div className="between">
                <h2 className="h2">{type === 'ruck' ? 'Ruck' : type === 'walk' ? 'Beach walk' : 'Other activity'}</h2>
                {type === 'ruck' && <span className="small muted">{lastRucks.length ? `Last: ${lastRucks.at(-1)!.load ?? '—'} ${unitW(u)} · ${lastRucks.at(-1)!.distance ?? '—'} ${unitD(u)}` : 'First ruck — start light (~10% body weight)'}</span>}
              </div>
              {type === 'ruck' && ruckSuggest !== undefined && <div className="tip">Suggested load today: <strong>{ruckSuggest} {unitW(u)}</strong>{ruckSuggest > (lastRucks.at(-1)?.load ?? 0) ? ' — up from last time since the last two felt easy.' : ''}</div>}
              <div className="grid3">
                {type === 'ruck' && field('load', `Load ${unitW(u)}`)}
                {field('distance', unitD(u) === 'mi' ? 'Miles' : 'Km')}
                {field('minutes', 'Minutes')}
                {field('rpe', 'Effort (RPE 1–10)')}
                {field('avgHr', 'Avg HR (optional)')}
              </div>
              {log.distance && log.minutes ? <div className="small muted">Pace {mmss((log.minutes * 60) / log.distance)} per {unitD(u)}</div> : null}
            </>
          )}
          <div className="col" style={{ gap: 6 }}>
            <label className="lbl" htmlFor="onotes">Notes</label>
            <textarea id="onotes" className="inp" value={log.notes ?? ''} onChange={(e) => { const v = e.target.value; setLog((l) => ({ ...l, notes: v })); }} />
          </div>
        </section>

        <div className="aside" style={{ width: 420 }}>
          <section className="card">
            <div className="between"><p className="lbl">Recovery · contrast</p></div>
            <div className="grid2">
              <div className="col" style={{ gap: 6 }}><span className="lbl">Lake {unitT(u)}</span><NumInput label="Lake temperature" value={lakeTemp} onChange={setLakeTemp} /></div>
              <div className="col" style={{ gap: 6 }}><span className="lbl">Sauna {unitT(u)}</span><NumInput label="Sauna temperature" value={saunaTemp} onChange={setSaunaTemp} /></div>
            </div>
            <table className="simple">
              <thead><tr><th>Round</th><th>Sauna min</th><th>Cold sec</th><th /></tr></thead>
              <tbody>
                {rounds.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{i + 1}</td>
                    <td><NumInput style={{ minHeight: 40, width: 80 }} label={`Round ${i + 1} sauna minutes`} value={r.saunaMin} onChange={(n) => setRounds((rs) => rs.map((x, j) => (j === i ? { ...x, saunaMin: n ?? 0 } : x)))} /></td>
                    <td><NumInput style={{ minHeight: 40, width: 80 }} label={`Round ${i + 1} cold seconds`} value={r.coldSec} onChange={(n) => setRounds((rs) => rs.map((x, j) => (j === i ? { ...x, coldSec: n ?? 0 } : x)))} /></td>
                    <td><button className="link" style={{ color: 'var(--muted)' }} onClick={() => setRounds((rs) => rs.filter((_, j) => j !== i))} aria-label={`Remove round ${i + 1}`}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => setRounds((r) => [...r, { saunaMin: 12, coldSec: 90 }])}>+ Add round manually</button>
            {timer ? (
              <div className="entry" style={{ alignItems: 'center', background: timer.kind === 'cold' ? '#EFF6FF' : 'var(--out-bg)', borderColor: timer.kind === 'cold' ? '#1D4ED8' : '#C2410C' }}>
                <div><div className="lbl">{timer.kind === 'cold' ? 'Cold lake' : 'Sauna'}</div><div style={{ fontWeight: 700, fontSize: 36, fontVariantNumeric: 'tabular-nums' }}>{mmss(timerLeft)}</div></div>
                <button className="btn2" style={{ marginLeft: 'auto' }} onClick={() => setTimer((t) => t && { ...t, end: Date.now(), total: Math.round((Date.now() - (t.end - t.total * 1000)) / 1000) })}>Done early</button>
              </div>
            ) : (
              <div className="row">
                <button className="btn2 grow" onClick={() => startTimer('sauna')}>Start sauna timer</button>
                <button className="btn2 grow" onClick={() => startTimer('cold')}>Start cold timer</button>
              </div>
            )}
            <span className="small muted">Safety: never cold-water alone. Get out if you’re shivering hard or numb.</span>
          </section>
          <button className="btn" disabled={!canSave} onClick={save}>Save session</button>
        </div>
      </div>

      {coldCheck && (
        <Modal title="Out of the water?" onClose={() => setColdCheck(false)}>
          <p>Cold round logged. Dry off and warm up — sauna next, or towel + layers if you’re done.</p>
          <button className="btn" onClick={() => setColdCheck(false)}>I’m out and OK</button>
        </Modal>
      )}
      <Toast msg={toast} />
    </main>
  );
}
