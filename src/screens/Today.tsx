import { useMemo, useState } from 'react';
import { ex, flowMinutes, flowSteps } from '../lib/library';
import {
  addDays, buildSession, DAYS, dayFor, duneTarget, flowName, mondayOf, MOBILITY_GOAL_MIN, outdoorGoal, phaseOf,
  PHASE_LABEL, scheduledDay, todayISO, TOTAL_WEEKS, weekOf, blockOf, clampWeek, DYNAMIC_ROTATION,
} from '../lib/program';
import { fmtTarget, toUnits, unitD, workSets } from '../lib/progression';
import { setState, useStore } from '../lib/store';
import type { AppState } from '../lib/types';
import { Modal, primeAudio, type Go } from '../ui';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function loggedOn(s: AppState, iso: string) {
  return (
    s.workouts.some((w) => w.date === iso && w.endedAt) ||
    s.outdoor.some((o) => o.date === iso) ||
    s.mobility.some((m) => m.date === iso && m.minutes >= 15)
  );
}

export function weekStats(s: AppState, monday: string) {
  const p = s.profile!;
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const inWeek = (d: string) => d >= monday && d <= dates[6];
  const doneSets = s.workouts.filter((w) => inWeek(w.date)).reduce((a, w) => a + w.exercises.reduce((b, e) => b + workSets(e).filter((x) => x.done).length, 0), 0);
  const plannedSets = dates.reduce((a, d) => {
    const day = dayFor(s, d);
    return day.kind === 'lift' ? a + buildSession(s, day.id, d).exercises.reduce((b, e) => b + workSets(e).length, 0) : a;
  }, 0);
  const mobMin = s.mobility.filter((m) => inWeek(m.date)).reduce((a, m) => a + m.minutes, 0);
  const miles = s.outdoor.filter((o) => inWeek(o.date)).reduce((a, o) => a + toUnits(o.distance ?? 0, o.units, p.units), 0);
  return { doneSets, plannedSets, mobMin, miles };
}

export default function Today({ go }: { go: Go }) {
  const s = useStore();
  const p = s.profile!;
  const today = todayISO();
  const rawWeek = weekOf(p, today);
  const week = clampWeek(rawWeek);
  const phase = phaseOf(week);
  const day = dayFor(s, today);
  const [swapOpen, setSwapOpen] = useState(false);
  const preview = useMemo(() => (day.kind === 'lift' ? buildSession(s, day.id, today) : null), [s, day.id, today]);
  const monday = mondayOf(today);
  const stats = useMemo(() => weekStats(s, monday), [s, monday]);
  const doneToday = loggedOn(s, today);
  const hipFocus = !!s.hipFocusUntil && s.hipFocusUntil >= today;

  const lastWhy = useMemo(() => {
    if (!preview) return [];
    const ids = new Set(preview.exercises.map((e) => e.exId));
    const last = [...s.workouts].reverse().find((w) => w.dayId === day.id && w.changes?.length);
    return (last?.changes ?? []).filter((c) => ids.has(c.exId)).slice(0, 3);
  }, [preview, s.workouts, day.id]);

  const painSwaps = Object.entries(s.exState).filter(([, st]) => st.painFlags >= 2).map(([id]) => ex(id).name);

  const start = (short: boolean) => {
    primeAudio();
    setState((st) => ({ ...st, active: buildSession(st, day.id, today, short) }));
    go({ name: 'workout' });
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <main className="main">
      <header className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <p className="lbl">{dateLabel} · Week {week} of {TOTAL_WEEKS} · {PHASE_LABEL[phase]}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{greet} — {day.kind === 'lift' ? day.name.split(' — ')[0] : day.name} today</h1>
        </div>
        <div className="row wrap">
          <span className="chip">Cycle {p.cycle}</span>
          <span className="chip">{phase === 'deload' ? 'Deload week — go lighter' : `Next deload · Week ${week <= 4 ? 4 : week <= 8 ? 8 : 12}`}</span>
        </div>
      </header>

      {rawWeek > TOTAL_WEEKS && (
        <div className="tip between">
          <span><strong>12-week cycle complete.</strong> Your latest numbers carry into the next cycle.</span>
          <button className="btn2" onClick={() => setState((st) => ({ ...st, profile: { ...st.profile!, startDate: mondayOf(today), cycle: st.profile!.cycle + 1 }, dayOverrides: {} }))}>Start cycle {p.cycle + 1}</button>
        </div>
      )}

      {s.active && (
        <div className="tip between">
          <span><strong>Workout in progress:</strong> {s.active.name}</span>
          <button className="btn2" onClick={() => go({ name: 'workout' })}>Resume</button>
        </div>
      )}

      <div className="split">
        <div className="grow col" style={{ gap: 20 }}>
          <section className="card" style={{ gap: 16 }}>
            <div className="between" style={{ alignItems: 'flex-start' }}>
              <div>
                <p className="lbl ac">Today’s session{doneToday ? ' · done ✓' : ''}</p>
                <h2 className="h2" style={{ marginTop: 6, fontSize: 26 }}>{day.name}</h2>
                <p className="muted small" style={{ marginTop: 4 }}>{day.detail}</p>
              </div>
              <button className="btn2" onClick={() => setSwapOpen(true)}>Swap day</button>
            </div>

            {preview && (
              <div className="grid2">
                {preview.exercises.map((e, i) => (
                  <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
                    <div className="between"><span className="lbl">{e.flowId ? 'Mobility' : e.role === 'anchor' ? 'Anchor lift' : e.role === 'dynamic' ? 'Dynamic slot' : e.role === 'core' ? 'Core' : 'Accessory'}</span>
                      {e.flowId && <span className="small muted">{flowMinutes(e.flowId, hipFocus)} min</span>}</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{e.flowId ? flowName(e.flowId) : ex(e.exId).name}</div>
                    <div className="small muted">{e.flowId ? flowSteps(e.flowId, hipFocus).filter((x) => x.side !== 'Right').map((x) => x.move.name).join(' · ') : `${fmtTarget(e, p.units)}${e.rpeTarget ? ` · RPE ${e.rpeTarget}` : ''}`}</div>
                  </div>
                ))}
              </div>
            )}

            {day.flow && (
              <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
                <div className="between"><span className="lbl">Mobility</span><span className="small muted">{flowMinutes(day.flow, hipFocus)} min</span></div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{flowName(day.flow)}</div>
                <div className="small muted">{flowSteps(day.flow, hipFocus).filter((x) => x.side !== 'Right').map((x) => x.move.name).join(' · ')}</div>
              </div>
            )}
            {day.outdoor && (
              <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px' }}>
                <span className="lbl">Outdoor</span>
                <div style={{ fontWeight: 600, marginTop: 4 }}>
                  {day.outdoor === 'dunes' ? `Dune hill repeats · ${duneTarget(week)} × 20–40 s uphill` : day.outdoor === 'ruck' ? 'Ruck · 60–90 min' : 'Beach walk · 45–60 min easy'}
                </div>
                <div className="small muted">{day.outdoor === 'dunes' ? 'Hard effort up, walk down as recovery. Stop if times slow >15%.' : day.outdoor === 'ruck' ? 'Conversational pace. Load goes up when pace holds two rucks in a row.' : 'Zone 2: you can talk in full sentences.'}</div>
              </div>
            )}

            {lastWhy.length > 0 && (
              <div className="tip">
                <strong>Why these numbers:</strong> {lastWhy.map((c) => `${c.name} ${c.change} (${c.why.charAt(0).toLowerCase()}${c.why.slice(1)})`).join('; ')}.
              </div>
            )}
            {hipFocus && <div className="tip">Hip focus on until {s.hipFocusUntil}: primer includes couch stretch and ankle rocks.</div>}

            <div className="row wrap" style={{ marginTop: 4 }}>
              {day.kind === 'lift' && (
                <>
                  <button className={doneToday ? 'btn2' : 'btn'} onClick={() => start(false)} disabled={!!s.active}>{doneToday ? 'Do it again' : 'Start workout'}</button>
                  <button className="btn2" onClick={() => start(true)} disabled={!!s.active}>Short on time</button>
                </>
              )}
              {day.flow && day.kind !== 'lift' && (
                <button className={day.kind === 'mobility' ? 'btn' : 'btn2'} onClick={() => { primeAudio(); go({ name: 'mobility', flowId: day.flow!, back: { name: 'today' } }); }}>Start {flowName(day.flow).toLowerCase()}</button>
              )}
              {day.outdoor && (
                <button className={day.kind === 'outdoor' ? 'btn' : 'btn2'} onClick={() => go({ name: 'outdoor', type: day.outdoor })}>Log {day.outdoor === 'dunes' ? 'dune hills' : day.outdoor}</button>
              )}
            </div>
          </section>

          <section className="card">
            <p className="lbl">This week</p>
            <div className="week">
              {WEEKDAYS.map((wd, i) => {
                const d = addDays(monday, i);
                const dd = dayFor(s, d);
                const cls = d === today ? 'today' : dd.kind === 'outdoor' ? 'out' : dd.kind === 'mobility' ? 'mob' : '';
                return (
                  <div key={wd} className={`day ${cls}`}>
                    <b>{wd}</b>
                    <span className="nm">{dd.short}</span>
                    {loggedOn(s, d) && <span className="ck">✓ done</span>}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="aside">
          {painSwaps.length > 0 && (
            <section className="warnbox">
              <strong>Pain flagged twice:</strong> {painSwaps.join(', ')}. Use “Swap” in the workout to try an alternative.
            </section>
          )}
          {day.recovery && (
            <section className="card">
              <p className="lbl">Recovery after</p>
              <div className="between"><span>Steam sauna</span><strong>{p.coldExperience === 'new' ? '2 × 10 min' : '3 × 12 min'}</strong></div>
              <div className="between"><span>Cold lake</span><strong>{p.coldExperience === 'new' ? '2 × 30–60 s' : p.coldExperience === 'some' ? '3 × 1–2 min' : '3 × 2–3 min'}</strong></div>
              <p className="small muted">{day.kind === 'lift' && phase !== 'strength' ? 'On muscle-building days, wait 4+ h after lifting before the cold plunge — or end on sauna.' : 'Never go in cold water alone.'}</p>
              <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => go({ name: 'outdoor', recovery: true })}>Log recovery →</button>
            </section>
          )}
          <section className="card">
            <p className="lbl">Weekly targets</p>
            {[
              ['Working sets', stats.doneSets, stats.plannedSets, ''],
              ['Mobility minutes', stats.mobMin, MOBILITY_GOAL_MIN, ''],
              [`Outdoor ${unitD(p.units) === 'mi' ? 'miles' : 'km'}`, Math.round(stats.miles * 10) / 10, outdoorGoal(p.units), ''],
            ].map(([name, v, goal]) => (
              <div key={name as string} className="col" style={{ gap: 6 }}>
                <div className="between small"><span>{name}</span><span className="muted">{v} / {goal}</span></div>
                <div className="bar"><div style={{ width: `${Math.min(100, ((v as number) / ((goal as number) || 1)) * 100)}%` }} /></div>
              </div>
            ))}
          </section>
          <section className="card">
            <p className="lbl">Block {blockOf(week) + 1} dynamic moves</p>
            <p className="small">{DYNAMIC_ROTATION[blockOf(week)].map((id) => ex(id).name).join(' · ')}</p>
            <p className="small muted">Rotates every block to keep things athletic while the anchor lifts stay constant.</p>
          </section>
        </aside>
      </div>

      {swapOpen && (
        <Modal title="Swap today’s session" onClose={() => setSwapOpen(false)}>
          <p className="small muted">Scheduled: {DAYS[scheduledDay(p, today)].name}</p>
          {Object.values(DAYS).map((d) => (
            <button key={d.id} className="optrow" onClick={() => {
              setState((st) => ({ ...st, dayOverrides: { ...st.dayOverrides, [today]: d.id } }));
              setSwapOpen(false);
            }}>
              <span><strong>{d.name}</strong><br /><span className="small muted">{d.detail}</span></span>
              {d.id === day.id && <span className="lbl ac">Current</span>}
            </button>
          ))}
        </Modal>
      )}
    </main>
  );
}
