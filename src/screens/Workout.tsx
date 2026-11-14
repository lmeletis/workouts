import { useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISES, ex, flowMinutes, flowSteps } from '../lib/library';
import { buildExercise, flowName, plates, stepLoad } from '../lib/program';
import { fmtLoad, fmtTarget, unitW, workSets } from '../lib/progression';
import { setState, uid, useStore } from '../lib/store';
import type { AppState, LoggedExercise, Role, WorkoutLog } from '../lib/types';
import { beep, mmss, Modal, NumInput, primeAudio, useNow, useWakeLock, type Go } from '../ui';

const ROLE_LABEL: Record<Role, string> = { anchor: 'Anchor lift', accessory: 'Accessory', dynamic: 'Dynamic slot', core: 'Core' };

function lastPerformance(s: AppState, exId: string) {
  for (let i = s.workouts.length - 1; i >= 0; i--) {
    const le = s.workouts[i].exercises.find((e) => e.exId === exId && workSets(e).some((x) => x.done));
    if (le) return { log: s.workouts[i], le };
  }
  return undefined;
}

function update(fn: (w: WorkoutLog) => void) {
  setState((st) => {
    if (!st.active) return st;
    const w = structuredClone(st.active);
    fn(w);
    return { ...st, active: w };
  });
}

const firstOpenSet = (le?: LoggedExercise) => (le ? Math.max(0, le.sets.findIndex((x) => !x.done)) : 0);
const exDone = (le: LoggedExercise) => (le.flowId ? !!le.flowDone : le.sets.length > 0 && le.sets.every((x) => x.done));

export default function Workout({ go }: { go: Go }) {
  const s = useStore();
  const w = s.active;
  const p = s.profile!;
  const [cur, setCur] = useState(() => (w ? Math.max(0, w.exercises.findIndex((e) => !exDone(e))) : 0));
  const le = w?.exercises[cur];
  const [setIdx, setSetIdx] = useState(() => firstOpenSet(le));
  const [entry, setEntry] = useState({ weight: 0, reps: 0, rpe: undefined as number | undefined });
  const [rest, setRest] = useState<{ end: number; total: number } | null>(null);
  const [modal, setModal] = useState<null | 'history' | 'swap' | 'add' | 'finish'>(null);
  const now = useNow(true);
  const beeped = useRef(false);
  useWakeLock(true);

  // Load the selected set into the entry panel.
  useEffect(() => {
    const st = le?.sets[setIdx];
    if (st) setEntry({ weight: st.weight, reps: st.reps, rpe: st.rpe });
  }, [cur, setIdx, le?.exId, le?.sets.length]);

  const restLeft = rest ? (rest.end - now) / 1000 : 0;
  useEffect(() => {
    if (rest && restLeft <= 0 && !beeped.current) {
      beeped.current = true;
      beep(3);
    }
  }, [rest, restLeft]);

  const last = useMemo(() => (le && !le.flowId ? lastPerformance(s, le.exId) : undefined), [s.workouts, le?.exId]);

  if (!w) {
    return (
      <div className="full">
        <div className="body col" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <p>No workout in progress.</p>
          <button className="btn" onClick={() => go({ name: 'today' })}>Back to Today</button>
        </div>
      </div>
    );
  }

  const allSets = w.exercises.flatMap((e) => workSets(e));
  const doneCount = allSets.filter((x) => x.done).length;
  const def = le && !le.flowId ? ex(le.exId) : undefined;
  const loadless = def ? def.equip === 'bodyweight' || def.equip === 'band' : true;

  const selectEx = (i: number) => {
    setCur(i);
    setSetIdx(firstOpenSet(w.exercises[i]));
  };

  const logSet = () => {
    primeAudio();
    if (!le) return;
    const st = le.sets[setIdx];
    update((x) => {
      const t = x.exercises[cur].sets[setIdx];
      t.weight = loadless ? 0 : entry.weight;
      t.reps = entry.reps;
      t.rpe = entry.rpe;
      t.done = true;
      // Carry a changed weight forward to the remaining work sets.
      if (st.kind === 'work') x.exercises[cur].sets.slice(setIdx + 1).forEach((n) => !n.done && n.kind === 'work' && (n.weight = t.weight));
    });
    const restSec = st.kind === 'warmup' ? 60 : le.restSec;
    beeped.current = false;
    setRest({ end: Date.now() + restSec * 1000, total: restSec });
    const next = le.sets.findIndex((n, i) => i > setIdx && !n.done);
    if (next !== -1) setSetIdx(next);
    else setSetIdx(le.sets.length);
  };

  const finish = () => {
    const id = w.id;
    setState((st) => ({ ...st, active: undefined, workouts: [...st.workouts, { ...w, endedAt: Date.now() }] }));
    go({ name: 'feedback', id });
  };

  const elapsed = (now - w.startedAt) / 1000;
  const curSet = le?.sets[setIdx];
  const nextIdx = w.exercises.findIndex((e, i) => i > cur && !exDone(e));

  return (
    <div className="full">
      <header className="topbar">
        <div className="row">
          <button className="btn2" onClick={() => go({ name: 'today' })}>Back</button>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{w.name}{w.short ? ' · short' : ''}</div>
            <div className="small muted">Exercise {cur + 1} of {w.exercises.length} · {doneCount} of {allSets.length} sets done</div>
          </div>
        </div>
        <div className="row">
          <div style={{ textAlign: 'right' }}><div className="lbl">Elapsed</div><div style={{ fontWeight: 700, fontSize: 22 }}>{mmss(elapsed)}</div></div>
          <button className="btn2" onClick={() => (doneCount < allSets.length ? setModal('finish') : finish())}>Finish workout</button>
        </div>
      </header>

      <div className="body">
        <div className="split wlayout">
          <nav className="exlist" aria-label="Exercises">
            {w.exercises.map((e, i) => {
              const d = exDone(e);
              const cls = i === cur ? 'cur' : d ? 'done' : '';
              return (
                <button key={i} className={`exitem ${cls}`} onClick={() => selectEx(i)}>
                  <span className="dot">{d && i !== cur ? '✓' : i + 1}</span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: 15 }}>{e.flowId ? flowName(e.flowId) : ex(e.exId).name}</span>
                    <span className="sub">{e.flowId ? `${flowMinutes(e.flowId)} min` : `${e.role === 'dynamic' ? 'Dynamic · ' : e.role === 'anchor' ? 'Anchor · ' : ''}${fmtTarget(e, w.units)}`}</span>
                  </span>
                </button>
              );
            })}
            <button className="btn2" onClick={() => setModal('add')}>+ Add exercise</button>
          </nav>

          <section className="card grow" style={{ gap: 16 }}>
            {le?.flowId ? (
              <>
                <div>
                  <p className="lbl ac">Mobility · {flowMinutes(le.flowId)} min</p>
                  <h1 className="h1" style={{ marginTop: 4 }}>{flowName(le.flowId)}</h1>
                </div>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {flowSteps(le.flowId, !!s.hipFocusUntil && s.hipFocusUntil >= w.date).filter((x) => x.side !== 'Right').map((x, i) => (
                    <li key={i}><strong>{x.move.name}</strong> <span className="muted small">· {x.move.sec}s{x.move.perSide ? ' /side' : ''} — {x.move.cue}</span></li>
                  ))}
                </ol>
                <div className="row wrap" style={{ marginTop: 'auto' }}>
                  <button className="btn" onClick={() => { primeAudio(); go({ name: 'mobility', flowId: le.flowId!, back: { name: 'workout' }, workoutItem: cur }); }}>Start guided flow</button>
                  <button className="btn2" onClick={() => {
                    update((x) => (x.exercises[cur].flowDone = !x.exercises[cur].flowDone));
                    if (!le.flowDone) {
                      setState((st) => ({ ...st, mobility: [...st.mobility, { id: uid('m'), date: w.date, flowId: le.flowId!, minutes: flowMinutes(le.flowId!) }] }));
                      if (nextIdx !== -1) selectEx(nextIdx);
                    }
                  }}>{le.flowDone ? 'Mark not done' : 'Mark done'}</button>
                </div>
              </>
            ) : le && def ? (
              <>
                <div className="between" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <p className="lbl ac">{ROLE_LABEL[le.role]} · target {fmtTarget(le, w.units)}{le.rpeTarget ? ` @ RPE ${le.rpeTarget}` : ''}</p>
                    <h1 className="h1" style={{ marginTop: 4 }}>{def.name}</h1>
                    <p className="small muted" style={{ marginTop: 4 }}>Cue: {def.cue}</p>
                  </div>
                  <div className="row">
                    <a className="btn2" style={{ textDecoration: 'none' }} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(def.name + ' exercise form')}`} target="_blank" rel="noreferrer">Demo</a>
                    <button className="btn2" onClick={() => setModal('history')}>History</button>
                    <button className="btn2" onClick={() => setModal('swap')}>Swap</button>
                  </div>
                </div>

                <div className="sets" role="table" aria-label="Sets">
                  {['Set', 'Last time', 'Target', loadless ? '—' : unitW(w.units), def.timed ? 'Sec' : 'Reps', 'RPE', 'Done'].map((h, i) => (
                    <div key={h + i} className={`hd${i === 1 ? ' prevc' : ''}`} role="columnheader">{h}</div>
                  ))}
                  {le.sets.map((st, i) => {
                    const wi = le.sets.filter((x, j) => j < i && x.kind === 'work').length;
                    const prev = st.kind === 'work' ? last && workSets(last.le)[wi] : undefined;
                    const rowCls = `${st.kind === 'warmup' ? 'wu ' : ''}${i === setIdx ? 'curRow' : ''}`;
                    const cell = (c: React.ReactNode, extra = '') => <div className={`${rowCls} ${extra}`}><button className="cell" onClick={() => setSetIdx(i)}>{c}</button></div>;
                    return (
                      <div key={i} style={{ display: 'contents' }} role="row">
                        {cell(st.kind === 'warmup' ? `W${i + 1}` : wi + 1)}
                        {cell(prev ? `${loadless ? '' : `${prev.weight} × `}${prev.reps}` : '—', 'prevc')}
                        {cell(`${loadless ? '' : `${st.targetWeight} × `}${st.targetReps}`)}
                        {cell(st.done ? (loadless ? '—' : st.weight) : '—')}
                        {cell(st.done ? st.reps : '—')}
                        {cell(st.done && st.rpe ? st.rpe : '—')}
                        {cell(st.done ? '✓' : '', st.done ? 'ok' : '')}
                      </div>
                    );
                  })}
                </div>
                <div className="row">
                  <button className="link" onClick={() => update((x) => { const e = x.exercises[cur]; const lastW = [...e.sets].reverse().find((z) => z.kind === 'work'); if (lastW) e.sets.push({ ...lastW, done: false, rpe: undefined }); })}>+ Add set</button>
                  {le.sets.length > 1 && !le.sets.at(-1)!.done && <button className="link" style={{ color: 'var(--muted)' }} onClick={() => { update((x) => { x.exercises[cur].sets.pop(); }); setSetIdx((i) => Math.min(i, le.sets.length - 2)); }}>− Remove last set</button>}
                </div>

                {curSet ? (
                  <div className="entry" style={{ marginTop: 'auto' }}>
                    <div className="lbl" style={{ color: 'var(--accent-dark)', flexBasis: '100%' }}>{curSet.kind === 'warmup' ? 'Warm-up' : `Set ${le.sets.filter((x, j) => j <= setIdx && x.kind === 'work').length}`}{curSet.done ? ' (edit)' : ''}</div>
                    {!loadless && (
                      <div className="col" style={{ gap: 6 }}>
                        <span className="lbl">Weight ({unitW(w.units)}){def.pair ? ' per hand' : ''}</span>
                        <div className="row" style={{ gap: 8 }}>
                          <button className="step" aria-label="Lighter" onClick={() => setEntry((e) => ({ ...e, weight: stepLoad(e.weight, -1, le.exId, p) }))}>−</button>
                          <NumInput className="big" label={`Weight in ${unitW(w.units)}`} value={entry.weight} onChange={(n) => setEntry((e) => ({ ...e, weight: n ?? 0 }))} />
                          <button className="step" aria-label="Heavier" onClick={() => setEntry((e) => ({ ...e, weight: stepLoad(e.weight, 1, le.exId, p) }))}>+</button>
                        </div>
                      </div>
                    )}
                    <div className="col" style={{ gap: 6 }}>
                      <span className="lbl">{def.timed ? 'Seconds' : 'Reps'}{def.perSide ? ' /side' : ''}</span>
                      <div className="row" style={{ gap: 8 }}>
                        <button className="step" aria-label="Fewer" onClick={() => setEntry((e) => ({ ...e, reps: Math.max(0, e.reps - (def.timed ? 5 : 1)) }))}>−</button>
                        <NumInput className="big" style={{ width: 80 }} label="Reps" value={entry.reps} onChange={(n) => setEntry((e) => ({ ...e, reps: n ?? 0 }))} />
                        <button className="step" aria-label="More" onClick={() => setEntry((e) => ({ ...e, reps: e.reps + (def.timed ? 5 : 1) }))}>+</button>
                      </div>
                    </div>
                    {curSet.kind === 'work' && (
                      <div className="col" style={{ gap: 6 }}>
                        <span className="lbl">RPE</span>
                        <div className="row" style={{ gap: 6 }}>
                          {[6, 7, 8, 9, 10].map((r) => (
                            <button key={r} className={`rpe${entry.rpe === r ? ' on' : ''}`} aria-pressed={entry.rpe === r} onClick={() => setEntry((e) => ({ ...e, rpe: e.rpe === r ? undefined : r }))}>{r}</button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button className="btn" style={{ marginLeft: 'auto', minWidth: 140 }} onClick={logSet}>{curSet.done ? 'Update set' : 'Log set'}</button>
                  </div>
                ) : (
                  <div className="entry" style={{ marginTop: 'auto', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600 }}>All sets logged for {def.name}.</span>
                    {nextIdx !== -1 ? (
                      <button className="btn" style={{ marginLeft: 'auto' }} onClick={() => selectEx(nextIdx)}>Next: {w.exercises[nextIdx].flowId ? flowName(w.exercises[nextIdx].flowId!) : ex(w.exercises[nextIdx].exId).name}</button>
                    ) : (
                      <button className="btn" style={{ marginLeft: 'auto' }} onClick={finish}>Finish & give feedback</button>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </section>

          <aside className="aside" style={{ width: 240 }}>
            <section className="card" style={{ alignItems: 'center' }}>
              <p className="lbl">Rest timer</p>
              {(() => {
                const total = rest?.total ?? le?.restSec ?? 90;
                const left = rest ? Math.max(0, restLeft) : 0;
                const pct = rest ? (left / total) * 100 : 0;
                return (
                  <>
                    <div className="timer" style={{ background: `conic-gradient(${left > 0 ? 'var(--accent)' : '#F97316'} ${pct}%, var(--line) 0)`, padding: 10 }}>
                      <div className="timer" style={{ width: 130, height: 130, background: '#fff', color: rest && left <= 0 ? '#C2410C' : 'inherit' }}>{rest ? (left > 0 ? mmss(left) : 'Go') : mmss(total)}</div>
                    </div>
                    <div className="small muted">{rest ? `of ${mmss(total)} target` : 'Starts when you log a set'}</div>
                    {rest && (
                      <div className="row" style={{ gap: 8 }}>
                        <button className="btn2" onClick={() => setRest((r) => r && { ...r, end: r.end - 15000 })}>−15 s</button>
                        <button className="btn2" onClick={() => { beeped.current = false; setRest((r) => r && { ...r, end: Math.max(r.end, Date.now()) + 15000, total: r.total + 15 }); }}>+15 s</button>
                      </div>
                    )}
                    {rest && <button className="link" onClick={() => setRest(null)}>Skip rest</button>}
                  </>
                );
              })()}
            </section>
            {def?.equip === 'barbell' && entry.weight > 0 && (
              <section className="card">
                <p className="lbl">Plate math · {entry.weight} {unitW(w.units)}</p>
                <div>Bar {w.units === 'imperial' ? 45 : 20} {unitW(w.units)} + per side:</div>
                <div style={{ fontWeight: 600 }}>{plates(entry.weight, w.units).join(' · ') || 'empty bar'}</div>
              </section>
            )}
            {le && !le.flowId && (
              <section className="card">
                <p className="lbl">Between sets</p>
                <p className="small" style={{ color: 'var(--text2)' }}>{def?.upper ? 'Optional: band pull-aparts × 10 or hip CARs × 3/side' : 'Optional: 90/90 hip switches × 5/side'}</p>
              </section>
            )}
          </aside>
        </div>
      </div>

      {modal === 'history' && le && (
        <Modal title={`${ex(le.exId).name} — history`} onClose={() => setModal(null)}>
          <HistoryList s={s} exId={le.exId} />
        </Modal>
      )}
      {modal === 'swap' && le && (
        <SwapModal s={s} le={le} week={w.week} onClose={() => setModal(null)} onPick={(id, keep) => {
          const fresh = buildExercise(s, id, le.role, w.week, le.slotKey);
          update((x) => { x.exercises[cur] = fresh; });
          if (keep && le.slotKey) setState((st) => ({ ...st, swaps: { ...st.swaps, [le.slotKey!]: id } }));
          setSetIdx(firstOpenSet(fresh));
          setModal(null);
        }} />
      )}
      {modal === 'add' && (
        <Modal title="Add exercise" onClose={() => setModal(null)}>
          {Object.values(EXERCISES).map((d) => (
            <button key={d.id} className="optrow" onClick={() => {
              const fresh = buildExercise(s, d.id, d.timed ? 'core' : 'accessory', w.week);
              update((x) => { x.exercises.push(fresh); });
              setModal(null);
              selectEx(w.exercises.length);
            }}>
              <span><strong>{d.name}</strong><br /><span className="small muted">{d.muscles.join(', ')} · {d.equip}</span></span>
            </button>
          ))}
        </Modal>
      )}
      {modal === 'finish' && (
        <Modal title="Finish early?" onClose={() => setModal(null)}>
          <p>{allSets.length - doneCount} sets aren’t logged. Unlogged sets count as skipped — progression only uses what you completed.</p>
          <div className="row">
            <button className="btn" onClick={finish}>Finish workout</button>
            <button className="btn2" onClick={() => setModal(null)}>Keep going</button>
            <button className="btn2 danger" style={{ marginLeft: 'auto' }} onClick={() => { setState((st) => ({ ...st, active: undefined })); go({ name: 'today' }); }}>Discard workout</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HistoryList({ s, exId }: { s: AppState; exId: string }) {
  const rows = s.workouts
    .filter((w) => w.exercises.some((e) => e.exId === exId))
    .slice(-8)
    .reverse()
    .map((w) => ({ w, le: w.exercises.find((e) => e.exId === exId)! }));
  if (!rows.length) return <p className="muted">Nothing logged yet.</p>;
  return (
    <table className="simple">
      <thead><tr><th>Date</th><th>Sets</th><th>Felt</th></tr></thead>
      <tbody>
        {rows.map(({ w, le }) => (
          <tr key={w.id}>
            <td>{w.date}</td>
            <td>{workSets(le).filter((x) => x.done).map((x) => (x.weight ? `${x.weight}×${x.reps}` : `${x.reps}`)).join(', ') || '—'}</td>
            <td>{le.rating === 'easy' ? 'Too easy' : le.rating === 'hard' ? 'Too hard' : le.rating === 'right' ? 'Just right' : '—'}{le.pain ? ' · pain' : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SwapModal({ s, le, onClose, onPick }: { s: AppState; le: LoggedExercise; week: number; onClose: () => void; onPick: (id: string, keep: boolean) => void }) {
  const def = ex(le.exId);
  const [keep, setKeep] = useState(true);
  const alts = [...new Set([...def.alts, ...Object.values(EXERCISES).filter((d) => d.id !== def.id && d.muscles[0] === def.muscles[0]).map((d) => d.id)])];
  return (
    <Modal title={`Swap ${def.name}`} onClose={onClose}>
      {le.slotKey && (
        <label className="row small" style={{ gap: 8 }}>
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} style={{ width: 22, height: 22 }} />
          Keep this swap for future sessions
        </label>
      )}
      {alts.map((id) => {
        const d = ex(id);
        const st = s.exState[id];
        return (
          <button key={id} className="optrow" onClick={() => onPick(id, keep)}>
            <span><strong>{d.name}</strong><br /><span className="small muted">{d.muscles.join(', ')} · {d.equip}</span></span>
            {st?.weight ? <span className="small muted">last {fmtLoad(id, st.weight, s.profile!.units)}</span> : null}
          </button>
        );
      })}
      {le.slotKey && s.swaps[le.slotKey] && (
        <button className="btn2" onClick={() => { setState((st) => { const sw = { ...st.swaps }; delete sw[le.slotKey!]; return { ...st, swaps: sw }; }); onClose(); }}>Restore program default from next session</button>
      )}
    </Modal>
  );
}
