import type { ChildProcess } from 'node:child_process';

export interface UserState {
  activeProject: string | null;
  sessionId: string | null;
  busy: boolean;
  currentProcess: ChildProcess | null;
}

const states = new Map<number, UserState>();

export function getState(userId: number): UserState {
  let state = states.get(userId);
  if (!state) {
    state = {
      activeProject: null,
      sessionId: null,
      busy: false,
      currentProcess: null,
    };
    states.set(userId, state);
  }
  return state;
}
