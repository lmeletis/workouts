import { useSyncExternalStore } from 'react';
import type { AppState } from './types';

const KEY = 'train.v1';

export const emptyState = (): AppState => ({
  version: 1,
  exState: {},
  workouts: [],
  mobility: [],
  rom: [],
  outdoor: [],
  recovery: [],
  dayOverrides: {},
  swaps: {},
});

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    /* fall through to a fresh state */
  }
  return emptyState();
}

let state: AppState = load();
const listeners = new Set<() => void>();

export function getState() {
  return state;
}

export function setState(update: AppState | ((s: AppState) => AppState)) {
  state = typeof update === 'function' ? update(state) : update;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Could not save', e);
  }
  listeners.forEach((l) => l());
}

export function useStore(): AppState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `train-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function importBackup(file: File) {
  const data = JSON.parse(await file.text());
  if (data?.version !== 1 || !Array.isArray(data.workouts)) throw new Error('Not a Train backup file');
  setState({ ...emptyState(), ...data });
}

/** Ask the browser not to evict our data under storage pressure. */
export function requestPersistence() {
  navigator.storage?.persist?.().catch(() => undefined);
}
