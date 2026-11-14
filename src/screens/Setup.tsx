import { useRef, useState } from 'react';
import { cacheAllPhotos } from '../exercise-ui';
import { mondayOf, todayISO } from '../lib/program';
import { convertUnits, unitW } from '../lib/progression';
import { emptyState, exportBackup, getState, importBackup, setState, useStore } from '../lib/store';
import type { AnchorLift, Profile } from '../lib/types';
import { Modal, NumInput, Seg, Toast, useToast, type Go } from '../ui';

const DEFAULT: Omit<Profile, 'startDate' | 'cycle'> = {
  experience: 'intermediate', days: 4, sessionMin: 60, units: 'imperial', coldExperience: 'some',
  startLifts: {}, priorities: ['Build muscle', 'Hip mobility', 'Strength', 'Conditioning'],
  kettlebells: [25, 35, 45, 53], dumbbellMax: 75, limitations: '',
};

const LIFTS: [AnchorLift, string][] = [['squat', 'Back squat'], ['bench', 'Bench press'], ['deadlift', 'Deadlift'], ['ohp', 'Overhead press']];
const EQUIP = ['Barbell + rack', 'Bench', 'Dumbbells', 'Kettlebells', 'Resistance bands', 'Pull-up bar', 'Beach + dunes', 'Steam sauna', 'Cold lake', 'Ruck pack'];

export default function Setup({ go, firstRun }: { go: Go; firstRun?: boolean }) {
  const s = useStore();
  const [d, setD] = useState<Omit<Profile, 'startDate' | 'cycle'>>(() => s.profile ?? DEFAULT);
  const [kbText, setKbText] = useState(d.kettlebells.join(', '));
  const [confirm, setConfirm] = useState<null | 'restart' | 'reset'>(null);
  const [photos, setPhotos] = useState<number | null>(null);
  const [toast, showToast] = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));
  const u = unitW(d.units);

  const save = () => {
    const kettlebells = kbText.split(/[,\s]+/).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
    if (firstRun || !s.profile) {
      setState((st) => ({ ...st, profile: { ...d, kettlebells, startDate: mondayOf(todayISO()), cycle: 1 } }));
      go({ name: 'today' });
      return;
    }
    setState((st) => {
      const converted = convertUnits(st, d.units);
      const unitsChanged = st.profile!.units !== d.units;
      return {
        ...converted,
        profile: { ...converted.profile!, ...d, kettlebells: unitsChanged ? converted.profile!.kettlebells : kettlebells, startLifts: unitsChanged ? converted.profile!.startLifts : d.startLifts },
      };
    });
    showToast('Profile saved — program updated');
  };

  const move = (i: number, dir: -1 | 1) => {
    const p = [...d.priorities];
    const j = i + dir;
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j], p[i]];
    set('priorities', p);
  };

  const content = (
    <main className="main">
      <header className="between" style={{ flexWrap: 'wrap' }}>
        <div>
          <p className="lbl">{firstRun ? 'First run · you can change all of this later' : 'Profile'}</p>
          <h1 className="h1" style={{ marginTop: 4 }}>Tailor your program</h1>
        </div>
        <button className="btn" onClick={save}>{firstRun ? 'Generate my program' : 'Save changes'}</button>
      </header>

      <div className="grid3" style={{ alignItems: 'start' }}>
        <section className="card" style={{ gap: 14 }}>
          {[
            ['Training experience', <Seg key="e" label="Experience" value={d.experience} onChange={(v) => set('experience', v)} options={[{ v: 'novice', t: '< 1 yr' }, { v: 'intermediate', t: '1–3 yrs' }, { v: 'advanced', t: '3+ yrs' }]} />],
            ['Lifting days / week', <Seg key="d" label="Days" value={d.days} onChange={(v) => set('days', v)} options={[{ v: 3, t: '3' }, { v: 4, t: '4' }, { v: 5, t: '5' }]} />],
            ['Session length', <Seg key="l" label="Session length" value={d.sessionMin} onChange={(v) => set('sessionMin', v)} options={[{ v: 45, t: '45 min' }, { v: 60, t: '60 min' }, { v: 75, t: '75 min' }]} />],
            ['Units', <Seg key="u" label="Units" value={d.units} onChange={(v) => set('units', v)} options={[{ v: 'imperial', t: 'lb · mi · °F' }, { v: 'metric', t: 'kg · km · °C' }]} />],
            ['Cold exposure experience', <Seg key="c" label="Cold exposure" value={d.coldExperience} onChange={(v) => set('coldExperience', v)} options={[{ v: 'new', t: 'New' }, { v: 'some', t: 'Some' }, { v: 'regular', t: 'Regular' }]} />],
          ].map(([label, el]) => (
            <div key={label as string} className="col" style={{ gap: 6 }}><span className="lbl">{label}</span>{el}</div>
          ))}
        </section>

        <section className="card">
          <p className="lbl">Starting strength</p>
          <span className="small muted">A weight you can lift for ~5 good reps. Unsure? Leave blank and enter weights during week 1 — the app learns from what you log.</span>
          {LIFTS.map(([k, name]) => (
            <div key={k} className="between">
              <label htmlFor={k} style={{ fontWeight: 500 }}>{name}</label>
              <div className="row" style={{ gap: 6 }}>
                <NumInput style={{ width: 100 }} label={`${name} 5-rep weight`} value={d.startLifts[k]} onChange={(n) => set('startLifts', { ...d.startLifts, [k]: n })} />
                <span className="small muted" style={{ width: 20 }}>{u}</span>
              </div>
            </div>
          ))}
          <div className="between">
            <label style={{ fontWeight: 500 }}>Pull-ups (max reps)</label>
            <div className="row" style={{ gap: 6 }}><NumInput style={{ width: 100 }} label="Max pull-ups" value={d.pullupReps} onChange={(n) => set('pullupReps', n)} /><span style={{ width: 20 }} /></div>
          </div>
          <p className="lbl" style={{ marginTop: 6 }}>Priorities</p>
          {d.priorities.map((pr, i) => (
            <div key={pr} className="row" style={{ minHeight: 44, padding: '0 6px 0 12px', border: '1px solid var(--line)', borderRadius: 10 }}>
              <strong style={{ color: 'var(--accent)' }}>{i + 1}</strong><span className="grow">{pr}</span>
              <button className="btn2" style={{ minHeight: 36, padding: '0 10px' }} aria-label={`Move ${pr} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
              <button className="btn2" style={{ minHeight: 36, padding: '0 10px' }} aria-label={`Move ${pr} down`} disabled={i === d.priorities.length - 1} onClick={() => move(i, 1)}>↓</button>
            </div>
          ))}
        </section>

        <section className="card">
          <p className="lbl">Equipment & places</p>
          <div className="row wrap" style={{ gap: 6 }}>
            {EQUIP.map((e) => <span key={e} className="chip" style={{ background: 'var(--accent-soft2)', color: 'var(--accent-dark)', borderColor: 'transparent' }}>✓ {e}</span>)}
          </div>
          <label className="lbl" htmlFor="kb" style={{ marginTop: 6 }}>Kettlebells you have ({u})</label>
          <input id="kb" className="inp" value={kbText} onChange={(e) => setKbText(e.target.value)} inputMode="decimal" />
          <span className="small muted">Kettlebell exercises progress through these bells.</span>
          <label className="lbl" htmlFor="lim" style={{ marginTop: 6 }}>Injuries / limitations</label>
          <textarea id="lim" className="inp" value={d.limitations} onChange={(e) => set('limitations', e.target.value)} placeholder="e.g. tight hip flexors" />
        </section>
      </div>

      {!firstRun && (
        <div className="grid3" style={{ alignItems: 'start' }}>
          <section className="card">
            <p className="lbl">Backup</p>
            <span className="small muted">Your data lives only on this iPad. Export a backup now and then (save it to Files or iCloud Drive).</span>
            <div className="row wrap">
              <button className="btn2" onClick={exportBackup}>Export backup</button>
              <button className="btn2" onClick={() => fileRef.current?.click()}>Import backup</button>
              <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try { await importBackup(f); showToast('Backup restored'); } catch (err) { showToast((err as Error).message); }
                e.target.value = '';
              }} />
            </div>
          </section>
          <section className="card">
            <p className="lbl">Program</p>
            <span className="small muted">Cycle {s.profile?.cycle}, started {s.profile?.startDate}. Restarting keeps your history and weights.</span>
            <button className="btn2" onClick={() => setConfirm('restart')}>Restart at week 1</button>
          </section>
          <section className="card">
            <p className="lbl">Install on iPad</p>
            <span className="small">In Safari tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. It then opens full-screen and works offline.</span>
            <button className="btn2" disabled={photos !== null && photos < 100} onClick={() => {
              setPhotos(0);
              cacheAllPhotos((d, t) => setPhotos(Math.round((d / t) * 100))).then(() => showToast('All exercise photos saved for offline'));
            }}>{photos === null ? 'Save all exercise photos offline (~19 MB)' : photos < 100 ? `Saving photos… ${photos}%` : 'Photos saved ✓'}</button>
            <button className="btn2 danger" onClick={() => setConfirm('reset')}>Erase all data…</button>
          </section>
        </div>
      )}

      {confirm && (
        <Modal title={confirm === 'restart' ? 'Restart program?' : 'Erase everything?'} onClose={() => setConfirm(null)}>
          <p>{confirm === 'restart' ? 'Week 1 starts this Monday. Your logged history and current weights are kept.' : 'This deletes every workout, setting and measurement on this iPad. Export a backup first if you might want it back.'}</p>
          <div className="row">
            <button className={confirm === 'reset' ? 'btn2 danger' : 'btn'} onClick={() => {
              if (confirm === 'restart') setState((st) => ({ ...st, profile: { ...st.profile!, startDate: mondayOf(todayISO()), cycle: st.profile!.cycle + 1 }, dayOverrides: {} }));
              else setState(emptyState());
              setConfirm(null);
              showToast(confirm === 'restart' ? 'Program restarted' : 'Data erased');
              if (confirm === 'reset' && !getState().profile) go({ name: 'today' });
            }}>{confirm === 'restart' ? 'Restart' : 'Erase all data'}</button>
            <button className="btn2" onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </Modal>
      )}
      <Toast msg={toast} />
    </main>
  );
  return content;
}
