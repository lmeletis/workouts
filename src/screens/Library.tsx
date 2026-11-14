import { useMemo, useState } from 'react';
import { ExerciseInfoModal, ExercisePicker } from '../exercise-ui';
import { ex } from '../lib/library';
import { buildExercise, clampWeek, DAYS, resolveSlotEx, SCHEDULES, todayISO, weekOf } from '../lib/program';
import { setState, useStore } from '../lib/store';
import { Toast, useToast, type Go } from '../ui';

export default function Library({ go }: { go: Go }) {
  const s = useStore();
  const p = s.profile!;
  const [open, setOpen] = useState<string | null>(null);
  const [toast, showToast] = useToast();
  const week = clampWeek(weekOf(p, todayISO()));

  const inProgram = useMemo(
    () => new Set(SCHEDULES[p.days].flatMap((d) => (DAYS[d].slots ?? []).map((slot, i) => resolveSlotEx(s, d, i, slot, week)))),
    [s, p.days, week],
  );

  const addToWorkout = (id: string) => {
    const fresh = buildExercise(s, id, ex(id).timed ? 'core' : 'accessory', s.active!.week);
    setState((st) => (st.active ? { ...st, active: { ...st.active, exercises: [...st.active.exercises, fresh] } } : st));
    setOpen(null);
    showToast('Added to your workout');
  };

  return (
    <main className="main">
      <header className="between" style={{ flexWrap: 'wrap' }}>
        <div>
          <p className="lbl">Photos, steps and muscles for every exercise</p>
          <h1 className="h1" style={{ marginTop: 4 }}>Exercises</h1>
        </div>
        {s.active && <button className="btn2" onClick={() => go({ name: 'workout' })}>Back to workout</button>}
      </header>
      <section className="card">
        <ExercisePicker onSelect={setOpen} highlight={inProgram} />
      </section>
      {open && (
        <ExerciseInfoModal
          id={open}
          onClose={() => setOpen(null)}
          action={s.active ? <button className="btn" onClick={() => addToWorkout(open)}>Add to current workout</button> : undefined}
        />
      )}
      <Toast msg={toast} />
    </main>
  );
}
