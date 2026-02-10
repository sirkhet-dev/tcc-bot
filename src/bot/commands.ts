import { InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import { getProjects, findProject } from '../state/projects.js';
import { getState } from '../state/user-state.js';

export async function startCommand(ctx: Context): Promise<void> {
  const projectList = getProjects().map((p) => `  <b>${p.name}</b> - ${p.desc}`).join('\n');
  await ctx.reply(
    `Hello! Welcome to Claude Code Telegram Bot.\n\n` +
      `Available projects:\n${projectList}\n\n` +
      `Use /project &lt;name&gt; or /projects to select a project.`,
    { parse_mode: 'HTML' },
  );
}

export async function projectsCommand(ctx: Context): Promise<void> {
  const keyboard = new InlineKeyboard();
  for (const p of getProjects()) {
    keyboard.text(`${p.name}`, `select_project:${p.name}`).row();
  }
  await ctx.reply('Select a project:', { reply_markup: keyboard });
}

export async function projectCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const text = ctx.message?.text ?? '';
  const args = text.split(/\s+/).slice(1);
  const name = args[0];

  if (!name) {
    await ctx.reply('Usage: /project &lt;name&gt;\nList projects: /projects', {
      parse_mode: 'HTML',
    });
    return;
  }

  const project = findProject(name);
  if (!project) {
    await ctx.reply(
      `Project not found: <code>${escapeHtml(name)}</code>\nList projects: /projects`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  const state = getState(userId);
  state.activeProject = project.name;
  state.sessionId = null;
  await ctx.reply(`Active project: <b>${project.name}</b>\nYou can now send messages.`, {
    parse_mode: 'HTML',
  });
}

export async function selectProjectCallback(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  const name = data.replace('select_project:', '');
  const project = findProject(name);
  if (!project) {
    await ctx.answerCallbackQuery({ text: 'Project not found' });
    return;
  }

  const state = getState(userId);
  state.activeProject = project.name;
  state.sessionId = null;
  await ctx.answerCallbackQuery({ text: `Project selected: ${project.name}` });
  try {
    await ctx.editMessageText(`Active project: <b>${project.name}</b>\nYou can now send messages.`, {
      parse_mode: 'HTML',
    });
  } catch {
    // Throws if message content is unchanged, ignore
  }
}

export async function newCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);
  state.sessionId = null;
  await ctx.reply('New session started. Session ID reset.');
}

export async function stopCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);

  if (!state.busy || !state.currentProcess) {
    await ctx.reply('No running process.');
    return;
  }

  state.currentProcess.kill('SIGTERM');
  state.busy = false;
  state.currentProcess = null;
  await ctx.reply('Process cancelled.');
}

export async function statusCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);

  const lines = [
    `<b>Status</b>`,
    `Project: ${state.activeProject ? `<code>${state.activeProject}</code>` : 'Not selected'}`,
    `Session: ${state.sessionId ? `<code>${state.sessionId.slice(0, 8)}...</code>` : 'None'}`,
    `Process: ${state.busy ? 'Running' : 'Idle'}`,
  ];
  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
}

export async function helpCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    `<b>Commands</b>\n\n` +
      `/start - Welcome\n` +
      `/projects - Project list (buttons)\n` +
      `/project &lt;name&gt; - Select project\n` +
      `/new - Start new session\n` +
      `/stop - Cancel running process\n` +
      `/status - Status info\n` +
      `/help - This message\n\n` +
      `Regular text messages are sent as Claude Code prompts to the active project.`,
    { parse_mode: 'HTML' },
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
