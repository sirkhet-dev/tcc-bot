interface Metrics {
  promptsTotal: number;
  promptsSuccess: number;
  promptsError: number;
  promptsTimeout: number;
}

const metrics: Metrics = {
  promptsTotal: 0,
  promptsSuccess: 0,
  promptsError: 0,
  promptsTimeout: 0,
};

export function recordPromptStart(): void {
  metrics.promptsTotal += 1;
}

export function recordPromptSuccess(): void {
  metrics.promptsSuccess += 1;
}

export function recordPromptError(isTimeout: boolean): void {
  metrics.promptsError += 1;
  if (isTimeout) {
    metrics.promptsTimeout += 1;
  }
}

export function getMetrics(): Metrics {
  return { ...metrics };
}
