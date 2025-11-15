import { WebClient } from "@slack/web-api";
import { FORMAT, RETRY, SLACK, TIME } from "../constants/index.js";
import type { MessageElement } from "../types/index.js";
import { retryWithExponentialBackoff } from "../utils/retry.js";

export class SlackDataCollector {
  constructor(private client: WebClient) {}

  async collectMessages(
    channelId: string,
    daysAgo: number = SLACK.DAYS_TO_COLLECT
  ): Promise<MessageElement[]> {
    const oldest = this.calculateTimestamp(daysAgo);

    console.log(
      `[SlackDataCollector] Collecting messages from past ${daysAgo} days (since ${new Date(
        Number(oldest) * 1000
      ).toISOString()})`
    );

    // TODO: カスタマイズしてください - チャンネル名を設定可能にする場合は、CUSTOMIZATION.mdを参照
    const messages = await this.fetchChannelMessagesWithRetry(
      channelId,
      oldest,
      "source"
    );

    console.log(
      `[SlackDataCollector] Collected ${messages.length} messages`
    );

    return messages;
  }

  private async fetchChannelMessagesWithRetry(
    channelId: string,
    oldest: string,
    channelName: string
  ): Promise<MessageElement[]> {
    try {
      return await retryWithExponentialBackoff(
        () => this.fetchChannelMessages(channelId, oldest, channelName),
        RETRY.SLACK.MAX_ATTEMPTS,
        RETRY.SLACK.BASE_DELAY_MS
      );
    } catch (error) {
      console.error(
        `[SlackDataCollector] Failed to fetch messages from ${channelName}:`,
        error
      );
      return [];
    }
  }

  private async fetchChannelMessages(
    channelId: string,
    oldest: string,
    channelName: string
  ): Promise<MessageElement[]> {
    const response = await this.client.conversations.history({
      channel: channelId,
      oldest,
      limit: SLACK.MAX_MESSAGES_PER_CHANNEL,
    });

    if (!response.ok) {
      throw new Error(
        `Slack API error for channel ${channelName}: ${
          response.error || "Unknown error"
        }`
      );
    }

    const messages = response.messages || [];

    return messages.map((msg) => ({
      ...msg,
      channelName,
    }));
  }

  private calculateTimestamp(daysAgo: number): string {
    const now = Date.now();
    const timestampMs = now - daysAgo * TIME.MILLISECONDS_PER_DAY;
    // Slack APIはUnix時間（秒）を要求するため、ミリ秒から秒に変換
    return (timestampMs / TIME.MILLISECONDS_PER_SECOND).toFixed(
      FORMAT.DECIMAL_PLACES_TIMESTAMP
    );
  }
}
