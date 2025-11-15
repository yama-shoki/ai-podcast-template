import * as z from "zod";

export const envSchema = z.object({
  SLACK_BOT_TOKEN: z.string().startsWith("xoxb-", {
    message: "SLACK_BOT_TOKEN must start with 'xoxb-'",
  }),
  // TODO: カスタマイズしてください - 複数チャンネルから収集する場合は、CUSTOMIZATION.mdを参照
  SLACK_CHANNEL_SOURCE: z.string().min(1, {
    message: "SLACK_CHANNEL_SOURCE is required",
  }),
  SLACK_PODCAST_CHANNEL: z.string().min(1, {
    message: "SLACK_PODCAST_CHANNEL is required",
  }),
  OPENAI_API_KEY: z.string().startsWith("sk-", {
    message: "OPENAI_API_KEY must start with 'sk-'",
  }),
  CRON_SECRET: z.string().min(32, {
    message: "CRON_SECRET must be at least 32 characters for security",
  }),
});

export type Env = z.infer<typeof envSchema>;
