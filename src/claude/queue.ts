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
    await ctx.reply('Once bir proje secin: /projects');
    return;
  }

  if (state.busy) {
    await ctx.reply('Onceki islem devam ediyor. Bekleyin veya /stop ile iptal edin.');
    return;
  }

  const project = findProject(state.activeProject);
  if (!project) {
    await ctx.reply('Aktif proje bulunamadi. /projects ile yeniden secin.');
    return;
  }

  state.busy = true;
  const statusMsg = await ctx.reply('Isleniyor...');

  try {
    const { promise, process: child } = runPrompt(prompt, project.path, state.sessionId);
    state.currentProcess = child;

    const result = await promise;

    state.currentProcess = null;
    state.busy = false;

    if (result.sessionId) {
      state.sessionId = result.sessionId;
    }

    // "Isleniyor..." mesajini sil
    try {
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
    } catch {
      // Silinemezse devam et
    }

    const formatted = formatForTelegram(result.result);
    const parts = splitMessage(formatted);

    for (let i = 0; i < parts.length; i++) {
      const text = parts.length > 1 ? `${parts[i]}\n\n<i>[${i + 1}/${parts.length}]</i>` : parts[i];
      try {
        await ctx.reply(text, { parse_mode: 'HTML' });
      } catch {
        // HTML parse hatasi olursa plain text gonder
        await ctx.reply(parts[i]);
      }
    }

    if (result.costUsd !== null) {
      logger.info({ costUsd: result.costUsd, sessionId: result.sessionId }, 'Claude Code tamamlandi');
    }
  } catch (err) {
    state.currentProcess = null;
    state.busy = false;

    const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
    logger.error({ err }, 'Claude Code hatasi');

    try {
      await ctx.api.deleteMessage(ctx.chat!.id, statusMsg.message_id);
    } catch {
      // Silinemezse devam et
    }

    await ctx.reply(`Hata: ${message}`);
  }
}
