import { ex } from '../lib/library';
import {
  addDays, clampWeek, DAYS, DYNAMIC_ROTATION, SHOULDER_BLOCK, PHASE_LABEL, PHASES, SCHEDULES, todayISO, TOTAL_WEEKS, weekOf, resolveSlotEx,
} from '../lib/program';
import { unitW } from '../lib/progression';
import { useStore } from '../lib/store';
import type { Go } from '../ui';

const WD = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DOT = { lift: '#0F766E', mobility: '#6366F1', outdoor: '#EA580C', rest: '#9CA3AF' };

export default function Program({ go }: { go: Go }) {
  const s = useStore();
  const p = s.profile!;
  const week = clampWeek(weekOf(p, todayISO()));
  const sched = SCHEDULES[p.days];
  const u = unitW(p.units);
  const anchors = [...new Set(sched.flatMap((d) => (DAYS[d].slots ?? []).filter((x) => x.role === 'anchor').map((x) => x.ex as string)))];
  const lifting = sched.filter((d) => DAYS[d].kind === 'lift').length;
  const style = (i: number) => {
    const ph = PHASES[i];
    const base = ph === 'accumulate' ? { background: '#CCFBF1', color: '#134E4A' } : ph === 'build' ? { background: '#99F6E4', color: '#134E4A' } : ph === 'strength' ? { background: '#0F766E', color: '#fff' } : { background: '#fff', color: '#4B5563', border: '1px dashed #9CA3AF' };
    return { ...base, ...(i + 1 === week ? { outline: '3px solid #111827', outlineOffset: 1 } : {}) };
  };

  return (
    <main className="main">
      <header className="between" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <p className="lbl">Your program · cycle {p.cycle} · started {p.startDate}</p>
          <h1 className="h1" style={{ marginTop: 4 }}>12-Week Hypertrophy + Hip Mobility</h1>
        </div>
        <button className="btn2" onClick={() => go({ name: 'setup' })}>Edit profile</button>
      </header>

      <section className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 4 }}>
          {PHASES.map((ph, i) => (
            <div key={i} style={{ height: 48, borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, ...style(i) }}>
              <span>W{i + 1}</span><span style={{ fontWeight: 500, fontSize: 11 }}>{ph === 'accumulate' ? 'Acc' : ph === 'strength' ? 'Str' : PHASE_LABEL[ph]}</span>
            </div>
          ))}
        </div>
        <div className="grid3 small" style={{ color: 'var(--text2)', gap: 12 }}>
          <div><strong>Block 1 · Accumulate</strong> — anchors 3–4 × 8, accessories 10–12 reps, RPE 7–8</div>
          <div><strong>Block 2 · Build</strong> — anchors 4–5 × 6, accessories 8–10, RPE 7–9</div>
          <div><strong>Block 3 · Strength</strong> — anchors 4–5 × 4, accessories 8–12, test week {TOTAL_WEEKS}</div>
        </div>
      </section>

      <div className="split">
        <section className="card grow" style={{ gap: 6 }}>
          <div className="between"><p className="lbl">Weekly template · {lifting} lifting days</p><span className="small muted">Week {week}</span></div>
          {sched.map((id, i) => {
            const d = DAYS[id];
            const date = addDays(p.startDate, (week - 1) * 7 + i);
            const exNames = (d.slots ?? []).map((slot, j) => ex(resolveSlotEx(s, id, j, slot, week)).name);
            return (
              <div key={i} className="row" style={{ padding: '10px 0', borderTop: '1px solid var(--bg)', alignItems: 'flex-start' }}>
                <span style={{ width: 40, fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{WD[i]}</span>
                <span style={{ width: 10, height: 10, borderRadius: '50%', flex: 'none', background: DOT[d.kind], marginTop: 5 }} />
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{d.name}{s.dayOverrides[date] ? ' (swapped this week)' : ''}</div>
                  <div className="small muted">{exNames.length ? exNames.join(' · ') : d.detail}</div>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="aside" style={{ width: 420 }}>
          <section className="card">
            <p className="lbl">Anchor lifts · stay all 12 weeks</p>
            {anchors.map((a) => (
              <div key={a} className="between small">
                <span style={{ fontSize: 15 }}>{ex(a).name}</span>
                <span className="muted">{s.exState[a]?.weight ? `next ${s.exState[a].weight} ${u}` : s.exState[a]?.repTarget ? `next ${s.exState[a].repTarget} reps` : 'not logged yet'}</span>
              </div>
            ))}
            <span className="small muted">Same movements every week → clean progress data and steady overload.</span>
          </section>
          <section className="card">
            <p className="lbl">Dynamic slot · rotates each block</p>
            {DYNAMIC_ROTATION.map((ids, b) => (
              <div key={b} className="small" style={{ fontWeight: week <= 4 ? (b === 0 ? 600 : 400) : week <= 8 ? (b === 1 ? 600 : 400) : b === 2 ? 600 : 400 }}>
                <strong>B{b + 1}</strong> <span style={{ color: 'var(--text2)' }}>{ids.map((i) => ex(i).name).join(' · ')}</span>
              </div>
            ))}
          </section>
          {p.shoulderBlock !== false && (
            <section className="card">
              <p className="lbl">Shoulder · serratus block · every lifting day</p>
              {Object.entries(SHOULDER_BLOCK).filter(([d]) => sched.includes(d)).map(([d, ids]) => (
                <div key={d} className="small"><strong>{DAYS[d].name.split(' — ')[0]}</strong> <span style={{ color: 'var(--text2)' }}>{ids.map((i) => ex(s.swaps[`${d}:sh${ids.indexOf(i)}`] ?? i).name).join(' · ')}</span></div>
              ))}
              <span className="small muted">2–3 sets of 10–15, slow and light (RPE 5–6). Skip or swap anything that hurts, and follow your PT’s plan first.</span>
            </section>
          )}
          <section className="card">
            <p className="lbl">Progression rules</p>
            <ul className="small" style={{ margin: 0, paddingLeft: 18, color: 'var(--text2)', lineHeight: 1.55 }}>
              <li>Anchors: all reps at “Just right” → +{p.units === 'imperial' ? '5 lb upper, +10 lb lower' : '2.5 kg upper, +5 kg lower'}. “Too easy” → double jump.</li>
              <li>Missed reps or “Too hard” → hold. Twice in a row → 5% reset.</li>
              <li>Accessories: add reps to the top of the range, then add weight and drop back.</li>
              <li>Pain flagged → lighter next time + extra hip prep for 2 weeks. Twice → swap suggested.</li>
              <li>Deload weeks: ~40% fewer sets, same weights. New block → anchor weights re-set from your estimated max.</li>
              <li>Ruck load +{p.units === 'imperial' ? '5 lb' : '2 kg'} when two rucks in a row felt RPE ≤ 7.</li>
            </ul>
          </section>
        </aside>
      </div>
    </main>
  );
}
