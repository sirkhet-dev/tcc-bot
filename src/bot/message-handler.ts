import type { Context } from 'grammy';
import { enqueuePrompt } from '../claude/queue.js';

export async function handleMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  await enqueuePrompt(ctx, text);
}
