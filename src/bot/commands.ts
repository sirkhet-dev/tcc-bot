import { InlineKeyboard } from 'grammy';
import type { Context } from 'grammy';
import { getProjects, findProject } from '../state/projects.js';
import { getState } from '../state/user-state.js';

export async function startCommand(ctx: Context): Promise<void> {
  const projectList = getProjects().map((p) => `  <b>${p.name}</b> - ${p.desc}`).join('\n');
  await ctx.reply(
    `Merhaba! Claude Code Telegram Bot'a hosgeldiniz.\n\n` +
      `Kullanilabilir projeler:\n${projectList}\n\n` +
      `Proje secmek icin /project &lt;isim&gt; veya /projects yazin.`,
    { parse_mode: 'HTML' },
  );
}

export async function projectsCommand(ctx: Context): Promise<void> {
  const keyboard = new InlineKeyboard();
  for (const p of getProjects()) {
    keyboard.text(`${p.name}`, `select_project:${p.name}`).row();
  }
  await ctx.reply('Proje secin:', { reply_markup: keyboard });
}

export async function projectCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const text = ctx.message?.text ?? '';
  const args = text.split(/\s+/).slice(1);
  const name = args[0];

  if (!name) {
    await ctx.reply('Kullanim: /project &lt;isim&gt;\nProjeleri gormek icin: /projects', {
      parse_mode: 'HTML',
    });
    return;
  }

  const project = findProject(name);
  if (!project) {
    await ctx.reply(
      `Proje bulunamadi: <code>${escapeHtml(name)}</code>\nProjeleri gormek icin: /projects`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  const state = getState(userId);
  state.activeProject = project.name;
  state.sessionId = null;
  await ctx.reply(`Aktif proje: <b>${project.name}</b>\nArtik mesaj gonderebilirsiniz.`, {
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
    await ctx.answerCallbackQuery({ text: 'Proje bulunamadi' });
    return;
  }

  const state = getState(userId);
  state.activeProject = project.name;
  state.sessionId = null;
  await ctx.answerCallbackQuery({ text: `Proje secildi: ${project.name}` });
  try {
    await ctx.editMessageText(`Aktif proje: <b>${project.name}</b>\nArtik mesaj gonderebilirsiniz.`, {
      parse_mode: 'HTML',
    });
  } catch {
    // Mesaj zaten ayni icerige sahipse hata verir, yoksay
  }
}

export async function newCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);
  state.sessionId = null;
  await ctx.reply('Yeni oturum baslatildi. Session ID sifirlandi.');
}

export async function stopCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);

  if (!state.busy || !state.currentProcess) {
    await ctx.reply('Calisan bir islem yok.');
    return;
  }

  state.currentProcess.kill('SIGTERM');
  state.busy = false;
  state.currentProcess = null;
  await ctx.reply('Islem iptal edildi.');
}

export async function statusCommand(ctx: Context): Promise<void> {
  const userId = ctx.from!.id;
  const state = getState(userId);

  const lines = [
    `<b>Durum</b>`,
    `Proje: ${state.activeProject ? `<code>${state.activeProject}</code>` : 'Secilmedi'}`,
    `Oturum: ${state.sessionId ? `<code>${state.sessionId.slice(0, 8)}...</code>` : 'Yok'}`,
    `Islem: ${state.busy ? 'Devam ediyor' : 'Bos'}`,
  ];
  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
}

export async function helpCommand(ctx: Context): Promise<void> {
  await ctx.reply(
    `<b>Komutlar</b>\n\n` +
      `/start - Karsilama\n` +
      `/projects - Proje listesi (butonlu)\n` +
      `/project &lt;isim&gt; - Proje sec\n` +
      `/new - Yeni oturum baslat\n` +
      `/stop - Calisan islemi iptal et\n` +
      `/status - Durum bilgisi\n` +
      `/help - Bu mesaj\n\n` +
      `Normal metin mesajlari aktif projeye Claude Code prompt olarak gonderilir.`,
    { parse_mode: 'HTML' },
  );
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
