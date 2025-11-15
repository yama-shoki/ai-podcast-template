import { WebClient } from "@slack/web-api";
import { ERROR } from "../constants/index.js";
import type { ErrorContext, ErrorInfo } from "../types/index.js";

export class ErrorHandler {
  private slackClient: WebClient | null = null;
  private notificationChannelId: string | null = null;

  enableSlackNotification(client: WebClient, channelId: string): void {
    this.slackClient = client;
    this.notificationChannelId = channelId;
  }

  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const errorInfo: ErrorInfo = {
      type: this.categorizeError(error, context),
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      context,
      retryCount: 0,
    };

    this.logError(errorInfo);

    try {
      await this.notifySlack(errorInfo);
    } catch (notifyError) {
      console.error("Failed to send Slack notification:", notifyError);
      this.logError({
        ...errorInfo,
        message: `Original error: ${errorInfo.message}. Slack notification failed: ${notifyError}`,
      });
    }
  }

  private categorizeError(
    error: Error,
    context: ErrorContext
  ): ErrorInfo["type"] {
    const message = error.message.toLowerCase();

    if (
      message.includes("slack") ||
      context.phase === "data-collection" ||
      context.phase === "slack-publish"
    ) {
      return "slack_api";
    }
    if (
      message.includes("openai") ||
      message.includes("tts") ||
      context.phase === "script-generation" ||
      context.phase === "audio-generation"
    ) {
      return "openai_api";
    }

    return "other";
  }

  private logError(errorInfo: ErrorInfo): void {
    const logMessage = this.maskSensitiveData(
      JSON.stringify(
        {
          type: errorInfo.type,
          message: errorInfo.message,
          timestamp: errorInfo.timestamp.toISOString(),
          context: errorInfo.context,
          stack: errorInfo.stack,
        },
        null,
        2
      )
    );

    console.error(`[ERROR] ${errorInfo.type}:`, logMessage);
  }

  private maskSensitiveData(text: string): string {
    return (
      text
        // APIキー・トークンをマスキング
        .replace(/xoxb-[a-zA-Z0-9-]+/g, "xoxb-***")
        .replace(/xapp-[a-zA-Z0-9-]+/g, "xapp-***")
        .replace(/(sk-|key-)[a-zA-Z0-9-_]+/gi, "$1***")
        // メールアドレスをマスキング
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]")
        // 電話番号をマスキング
        .replace(/\d{2,4}-?\d{2,4}-?\d{4}/g, "[PHONE]")
    );
  }

  private async notifySlack(errorInfo: ErrorInfo): Promise<void> {
    if (!this.slackClient || !this.notificationChannelId) {
      console.warn("Slack notification is not enabled");
      return;
    }

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "⚠️ ポッドキャスト生成でエラーが発生しました",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*発生時刻:*\n${errorInfo.timestamp.toLocaleString("ja-JP")}`,
          },
          {
            type: "mrkdwn",
            text: `*エラー種別:*\n${errorInfo.type}`,
          },
          {
            type: "mrkdwn",
            text: `*フェーズ:*\n${errorInfo.context.phase}`,
          },
          {
            type: "mrkdwn",
            text: `*リトライ回数:*\n${errorInfo.retryCount}`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*エラーメッセージ:*\n\`\`\`${this.maskSensitiveData(
            errorInfo.message
          )}\`\`\``,
        },
      },
    ];

    if (errorInfo.stack) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*スタックトレース:*\n\`\`\`${this.maskSensitiveData(
            errorInfo.stack.slice(0, ERROR.STACK_TRACE_MAX_LENGTH)
          )}\`\`\``,
        },
      });
    }

    await this.slackClient.chat.postMessage({
      channel: this.notificationChannelId,
      text: `⚠️ ポッドキャスト生成エラー: ${errorInfo.type}`,
      blocks,
    });
  }
}
