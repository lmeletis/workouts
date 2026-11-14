import { useMemo, useState } from 'react';
import { ex } from '../lib/library';
import { applyFeedback, bestE1rm, fmtLoad, unitW, workSets } from '../lib/progression';
import { setState, useStore } from '../lib/store';
import type { Rating, WorkoutLog } from '../lib/types';
import { Seg, type Go } from '../ui';

const RATINGS: { v: Rating; t: string }[] = [{ v: 'easy', t: 'Too easy' }, { v: 'right', t: 'Just right' }, { v: 'hard', t: 'Too hard' }];
const TONE = { up: 'var(--accent)', hold: 'var(--text2)', down: 'var(--warn)', info: 'var(--text2)' };

export default function Feedback({ go, id }: { go: Go; id: string }) {
  const s = useStore();
  const original = s.workouts.find((w) => w.id === id);
  const [log, setLog] = useState<WorkoutLog | undefined>(() => original && structuredClone({
    ...original,
    exercises: original.exercises.map((e) => ({ ...e, rating: e.rating ?? 'right', pain: e.pain ?? false })),
    hips: original.hips ?? 'ok',
  }));

  const result = useMemo(() => (log ? applyFeedback(s, log) : undefined), [s, log]);
  if (!log || !result) {
    return <div className="full"><div className="body"><button className="btn" onClick={() => go({ name: 'today' })}>Back</button></div></div>;
  }

  const lifts = log.exercises.map((e, i) => ({ e, i })).filter(({ e }) => !e.flowId && workSets(e).some((x) => x.done));
  const sets = lifts.reduce((a, { e }) => a + workSets(e).filter((x) => x.done).length, 0);
  const volume = lifts.reduce((a, { e }) => a + workSets(e).filter((x) => x.done).reduce((b, x) => b + x.weight * x.reps * (ex(e.exId).pair ? 2 : 1), 0), 0);
  const prs = lifts.filter(({ e }) => {
    const prev = s.exState[e.exId]?.e1rm;
    return prev && bestE1rm(e) > prev + 0.5;
  }).length;
  const minutes = Math.round(((log.endedAt ?? Date.now()) - log.startedAt) / 60000);

  const edit = (fn: (l: WorkoutLog) => void) => setLog((l) => { const c = structuredClone(l!); fn(c); return c; });

  const save = () => {
    setState((st) => ({
      ...st,
      workouts: st.workouts.map((w) => (w.id === id ? { ...log, changes: result.changes } : w)),
      exState: result.exState,
      hipFocusUntil: result.hipFocusUntil,
    }));
    go({ name: 'today' });
  };

  return (
    <div className="full">
      <header className="topbar">
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>Workout complete — how did it feel?</div>
          <div className="small muted">{log.name} · {minutes} min · {sets} sets · {Math.round(volume).toLocaleString()} {unitW(log.units)} volume{prs ? ` · ${prs} PR${prs > 1 ? 's' : ''}` : ''}</div>
        </div>
        {original?.changes && <span className="chip">Feedback saved earlier — saving again re-plans</span>}
      </header>

      <div className="body">
        <div className="split">
          <div className="grow col" style={{ gap: 16 }}>
            <section className="card">
              <p className="lbl">Overall session effort (RPE)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, minmax(0, 1fr))', gap: 6 }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`pick${log.sessionRpe === n ? ' on' : ''}`} aria-pressed={log.sessionRpe === n} onClick={() => edit((l) => (l.sessionRpe = n))}>{n}</button>
                ))}
              </div>
            </section>

            <section className="card" style={{ gap: 4 }}>
              <div className="between" style={{ marginBottom: 6 }}><p className="lbl">Per exercise</p><p className="lbl">Pain?</p></div>
              {lifts.length === 0 && <p className="muted">No sets were logged.</p>}
              {lifts.map(({ e, i }) => {
                const done = workSets(e).filter((x) => x.done);
                return (
                  <div key={i} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--bg)', flexWrap: 'wrap' }}>
                    <div className="grow">
                      <div style={{ fontWeight: 600 }}>{ex(e.exId).name}</div>
                      <div className="small muted">{done.length} × {done.map((x) => x.reps).join('/')} {ex(e.exId).equip !== 'bodyweight' && ex(e.exId).equip !== 'band' ? `@ ${fmtLoad(e.exId, Math.max(...done.map((x) => x.weight)), log.units)}` : ''}{done.some((x) => x.rpe) ? ` · RPE ${done.map((x) => x.rpe ?? '–').join('/')}` : ''}</div>
                    </div>
                    <div style={{ width: 330 }}>
                      <Seg label={`How ${ex(e.exId).name} felt`} value={e.rating ?? 'right'} options={RATINGS} onChange={(v) => edit((l) => (l.exercises[i].rating = v))} />
                    </div>
                    <button className="pick" style={{ width: 72, ...(e.pain ? { background: 'var(--warn-bg)', color: 'var(--warn)', borderColor: '#FDBA74' } : {}) }} aria-pressed={!!e.pain} onClick={() => edit((l) => (l.exercises[i].pain = !l.exercises[i].pain))}>{e.pain ? 'Pain' : 'No'}</button>
                  </div>
                );
              })}
            </section>

            <section className="card">
              <div className="row wrap" style={{ alignItems: 'flex-start', gap: 20 }}>
                <div className="col" style={{ gap: 8, flex: 1, minWidth: 240 }}>
                  <p className="lbl">Hips today</p>
                  <Seg label="Hips today" value={log.hips ?? 'ok'} options={[{ v: 'tight', t: 'Tight' }, { v: 'ok', t: 'OK' }, { v: 'loose', t: 'Loose' }]} onChange={(v) => edit((l) => (l.hips = v))} />
                </div>
                <div className="col" style={{ gap: 8, flex: 1.4, minWidth: 260 }}>
                  <label className="lbl" htmlFor="notes">Notes</label>
                  <textarea id="notes" className="inp" placeholder="Anything worth remembering next time" value={log.notes ?? ''} onChange={(ev) => { const v = ev.target.value; edit((l) => (l.notes = v)); }} />
                </div>
              </div>
            </section>
          </div>

          <aside className="aside" style={{ width: 380 }}>
            <section className="card accent">
              <p className="lbl ac">What changes next time</p>
              {result.changes.length === 0 && <p className="small muted">Nothing to adjust.</p>}
              {result.changes.map((c, i) => (
                <div key={i} style={{ paddingBottom: 10, borderBottom: '1px solid var(--bg)' }}>
                  <div className="between"><span style={{ fontWeight: 600 }}>{c.name}</span><span style={{ fontWeight: 700, color: TONE[c.tone], textAlign: 'right' }}>{c.change}</span></div>
                  <span className="small muted">{c.why}</span>
                </div>
              ))}
              <span className="small muted">Updates live as you rate. You can always change the weight during a set.</span>
            </section>
            <section className="card">
              <p className="lbl">Recovery now</p>
              <div className="small">Steam sauna, then the cold lake — end warm if you want max muscle gain today.</div>
              <button className="link" style={{ alignSelf: 'flex-start' }} onClick={() => { save(); go({ name: 'outdoor', recovery: true }); }}>Save & log recovery →</button>
            </section>
            <button className="btn" onClick={save}>Save feedback</button>
          </aside>
        </div>
      </div>
    </div>
  );
}
