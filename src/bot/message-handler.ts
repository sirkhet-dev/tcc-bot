import type { Context } from 'grammy';
import { config } from '../config.js';
import { enqueuePrompt } from '../claude/queue.js';
import { checkMessageRateLimit } from './rate-limit.js';

export async function handleMessage(ctx: Context): Promise<void> {
  const text = ctx.message?.text;
  if (!text) return;

  const userId = ctx.from?.id;
  if (!userId) return;

  const limit = checkMessageRateLimit(userId);
  if (!limit.ok) {
    const retrySec = Math.ceil(limit.retryInMs / 1000);
    await ctx.reply(`Rate limit exceeded. Try again in ${retrySec}s.`);
    return;
  }

  if (text.length > config.MAX_PROMPT_CHARS) {
    await ctx.reply(`Message too long (${text.length} chars). Max allowed: ${config.MAX_PROMPT_CHARS}.`);
    return;
  }

  await enqueuePrompt(ctx, text);
}
