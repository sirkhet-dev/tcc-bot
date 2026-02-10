import type { Context, NextFunction } from 'grammy';
import { config } from '../config.js';
import { logger } from '../logger.js';

export async function authMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  const userId = ctx.from?.id;
  if (userId !== config.ALLOWED_USER_ID) {
    logger.warn({ userId, username: ctx.from?.username }, 'Unauthorized access attempt');
    return;
  }
  await next();
}
