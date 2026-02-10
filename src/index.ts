import { config } from './config.js';
import { logger } from './logger.js';
import { createBot } from './bot/bot.js';

const bot = createBot();

// Graceful shutdown
function shutdown(signal: string) {
  logger.info({ signal }, 'Kapatiliyor...');
  bot.stop();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('Bot baslatiliyor...');
bot.start({
  onStart: () => {
    logger.info(
      { allowedUser: config.ALLOWED_USER_ID },
      'Bot calisiyor (long polling)',
    );
  },
});
