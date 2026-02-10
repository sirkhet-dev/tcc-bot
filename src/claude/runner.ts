import { spawn } from 'node:child_process';
import { config } from '../config.js';
import { logger } from '../logger.js';

export interface ClaudeResult {
  result: string;
  sessionId: string | null;
  costUsd: number | null;
  isError: boolean;
}

export function runPrompt(
  prompt: string,
  projectPath: string,
  resumeSessionId?: string | null,
): { promise: Promise<ClaudeResult>; process: import('node:child_process').ChildProcess } {
  const args = [
    '-p', prompt,
    '--output-format', 'json',
    '--dangerously-skip-permissions',
  ];

  if (resumeSessionId) {
    args.push('--resume', resumeSessionId);
  }

  logger.info({ projectPath, resume: !!resumeSessionId }, 'Starting Claude Code');

  const child = spawn(config.CLAUDE_BIN, args, {
    cwd: projectPath,
    env: { ...process.env, FORCE_COLOR: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const promise = new Promise<ClaudeResult>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout!.on('data', (chunk: Buffer) => chunks.push(chunk));
    child.stderr!.on('data', (chunk: Buffer) => stderrChunks.push(chunk));

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Timeout: Claude Code did not respond'));
    }, config.RESPONSE_TIMEOUT_MS);

    child.on('close', (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(chunks).toString('utf-8').trim();
      const stderr = Buffer.concat(stderrChunks).toString('utf-8').trim();

      if (code !== 0 && !stdout) {
        resolve({
          result: stderr || `Claude Code exited with error (code: ${code})`,
          sessionId: null,
          costUsd: null,
          isError: true,
        });
        return;
      }

      try {
        const json = JSON.parse(stdout);
        resolve({
          result: json.result ?? json.text ?? stdout,
          sessionId: json.session_id ?? null,
          costUsd: json.cost_usd ?? null,
          isError: json.is_error ?? false,
        });
      } catch {
        // JSON parse failed, return raw text
        resolve({
          result: stdout || stderr || 'Empty response',
          sessionId: null,
          costUsd: null,
          isError: false,
        });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  return { promise, process: child };
}
