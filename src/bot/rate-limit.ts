import { config } from '../config.js';

interface UserRateState {
  count: number;
  resetAt: number;
}

const store = new Map<number, UserRateState>();

export function checkMessageRateLimit(userId: number): { ok: boolean; retryInMs: number } {
  const now = Date.now();
  const state = store.get(userId);

  if (!state || now >= state.resetAt) {
    store.set(userId, {
      count: 1,
      resetAt: now + config.MESSAGE_RATE_LIMIT_WINDOW_MS,
    });
    return { ok: true, retryInMs: 0 };
  }

  if (state.count >= config.MESSAGE_RATE_LIMIT_MAX) {
    return { ok: false, retryInMs: Math.max(0, state.resetAt - now) };
  }

  state.count += 1;
  store.set(userId, state);
  return { ok: true, retryInMs: 0 };
}
