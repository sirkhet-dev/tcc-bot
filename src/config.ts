import 'dotenv/config';
import { z } from 'zod';

const commaSeparatedNames = z
  .string()
  .optional()
  .default('')
  .transform((val) => {
    if (!val.trim()) return [];
    return val.split(',').map((name) => name.trim()).filter(Boolean);
  });

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  ALLOWED_USER_ID: z.coerce.number().int().positive('A valid Telegram user ID is required'),
  CLAUDE_BIN: z.string().default('claude'),
  CLAUDE_SKIP_PERMISSIONS: z.coerce.boolean().default(false),
  WORKSPACE_ROOT: z.string().default('./projects'),
  PROJECT_ALLOWLIST: commaSeparatedNames,
  RESPONSE_TIMEOUT_MS: z.coerce.number().int().positive().default(300_000),
  STOP_GRACE_MS: z.coerce.number().int().positive().default(5_000),
  MAX_PROMPT_CHARS: z.coerce.number().int().positive().default(6_000),
  MESSAGE_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  MESSAGE_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Env validation error:', parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
