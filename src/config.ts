import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  ALLOWED_USER_ID: z.coerce.number().int().positive('A valid Telegram user ID is required'),
  CLAUDE_BIN: z.string().default('claude'),
  WORKSPACE_ROOT: z.string().default('./projects'),
  RESPONSE_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Env validation error:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
