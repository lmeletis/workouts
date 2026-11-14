import { useState } from 'react';
import { useStore } from './lib/store';
import Feedback from './screens/Feedback';
import Mobility from './screens/Mobility';
import Outdoor from './screens/Outdoor';
import Program from './screens/Program';
import Progress from './screens/Progress';
import Setup from './screens/Setup';
import Today from './screens/Today';
import Workout from './screens/Workout';
import { SideNav, type Screen } from './ui';

export default function App() {
  const s = useStore();
  const [screen, setScreen] = useState<Screen>(() => (s.active ? { name: 'workout' } : { name: 'today' }));
  const go = (next: Screen) => {
    setScreen(next);
    document.querySelector('.main, .body')?.scrollTo({ top: 0 });
  };

  if (!s.profile) return <div className="app"><Setup go={go} firstRun /></div>;

  switch (screen.name) {
    case 'workout':
      return <div className="app"><Workout go={go} /></div>;
    case 'feedback':
      return <div className="app"><Feedback go={go} id={screen.id} /></div>;
    case 'mobility':
      return <div className="app"><Mobility go={go} flowId={screen.flowId} back={screen.back} workoutItem={screen.workoutItem} /></div>;
  }

  return (
    <div className="app">
      <SideNav current={screen.name} go={go} />
      {screen.name === 'today' && <Today go={go} />}
      {screen.name === 'program' && <Program go={go} />}
      {screen.name === 'outdoor' && <Outdoor go={go} initialType={screen.type} />}
      {screen.name === 'progress' && <Progress />}
      {screen.name === 'setup' && <Setup go={go} />}
    </div>
  );
}
