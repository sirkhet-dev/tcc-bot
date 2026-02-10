import type { Context } from 'grammy';
import { getState } from '../state/user-state.js';
import { findProject } from '../state/projects.js';
import { runPrompt } from './runner.js';
import { formatForTelegram, splitMessage } from '../bot/formatter.js';
import { logger } from '../logger.js';

export async function enqueuePrompt(ctx: Context, prompt: string): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);

  if (!state.activeProject) {
    await ctx.reply('Select a project first: /projects');
    return;
  }

  if (state.busy) {
    await ctx.reply('Previous operation in progress. Wait or /stop to cancel.');
    return;
  }

  const project = findProject(state.activeProject);
  if (!project) {
    await ctx.reply('Active project not found. Select again: /projects');
    return;
  }

  state.busy = true;
  const statusMsg = await ctx.reply('Processing...');

  try {
    const { promise, process: child } = runPrompt(prompt, project.path, state.sessionId);
    state.currentProcess = child;

    const result = await promise;

    state.currentProcess = null;
    state.busy = false;

    if (result.sessionId) {
      state.sessionId = result.sessionId;
    }

    // Delete "Processing..." message
    try {
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
    } catch {
      // Ignore if can't delete
    }

    const formatted = formatForTelegram(result.result);
    const parts = splitMessage(formatted);

    for (let i = 0; i < parts.length; i++) {
      const text = parts.length > 1 ? `${parts[i]}\n\n<i>[${i + 1}/${parts.length}]</i>` : parts[i];
      try {
        await ctx.reply(text, { parse_mode: 'HTML' });
      } catch {
        // HTML parse error fallback to plain text
        await ctx.reply(parts[i]);
      }
    }

    if (result.costUsd !== null) {
      logger.info({ costUsd: result.costUsd, sessionId: result.sessionId }, 'Claude Code completed');
    }
  } catch (err) {
    state.currentProcess = null;
    state.busy = false;

    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ err }, 'Claude Code error');

    try {
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
    } catch {
      // Ignore if can't delete
    }

    await ctx.reply(`Error: ${message}`);
  }
}
