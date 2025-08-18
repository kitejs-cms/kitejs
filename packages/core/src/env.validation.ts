import { z } from "zod";

const envSchema = z.object({
  API_PORT: z.coerce.number().default(3000),
  API_DB_URL: z.string().url(),
  API_SECRET: z.string().min(1),
  API_CORS: z.string().default("http://localhost:5173"),
});

export function validate(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Config validation error: ${formatted}`);
  }
  return parsed.data;
}
