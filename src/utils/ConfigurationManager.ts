import { envSchema, type Env } from "../schemas/env.schema.js";

class ConfigurationManagerClass {
  private env: Env;

  constructor() {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      console.error("❌ Environment validation failed:");
      result.error.issues.forEach((issue) => {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      });
      throw new Error(
        "Invalid environment configuration. Please check your .env file."
      );
    }

    this.env = result.data;
    console.log("✅ Environment variables validated successfully");
  }

  getSlackBotToken() {
    return this.env.SLACK_BOT_TOKEN;
  }

  // TODO: カスタマイズしてください - 複数チャンネルから収集する場合は、CUSTOMIZATION.mdを参照
  getSourceChannelId() {
    return this.env.SLACK_CHANNEL_SOURCE;
  }

  getPodcastChannelId() {
    return this.env.SLACK_PODCAST_CHANNEL;
  }

  getOpenAIApiKey() {
    return this.env.OPENAI_API_KEY;
  }

  getCronSecret() {
    return this.env.CRON_SECRET;
  }

  validate() {
    console.log("✅ All required environment variables are set");
  }
}

export const ConfigurationManager = ConfigurationManagerClass;
export type ConfigurationManager = ConfigurationManagerClass;
