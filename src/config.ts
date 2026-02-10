import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN gerekli'),
  ALLOWED_USER_ID: z.coerce.number().int().positive('Gecerli bir Telegram user ID gerekli'),
  CLAUDE_BIN: z.string().default('claude'),
  WORKSPACE_ROOT: z.string().default('./projects'),
  RESPONSE_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Env validation hatasi:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
