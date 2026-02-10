import { Bot } from 'grammy';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { authMiddleware } from './middleware.js';
import {
  startCommand,
  projectsCommand,
  projectCommand,
  selectProjectCallback,
  newCommand,
  stopCommand,
  statusCommand,
  helpCommand,
} from './commands.js';
import { handleMessage } from './message-handler.js';

export function createBot(): Bot {
  const bot = new Bot(config.BOT_TOKEN);

  bot.use(authMiddleware);

  bot.command('start', startCommand);
  bot.command('projects', projectsCommand);
  bot.command('project', projectCommand);
  bot.command('new', newCommand);
  bot.command('stop', stopCommand);
  bot.command('status', statusCommand);
  bot.command('help', helpCommand);

  bot.callbackQuery(/^select_project:/, selectProjectCallback);

  bot.on('message:text', handleMessage);

  bot.catch((err) => {
    logger.error({ err: err.error, ctx: err.ctx?.update?.update_id }, 'Bot error');
  });

  return bot;
}
