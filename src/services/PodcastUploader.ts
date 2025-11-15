import { WebClient } from "@slack/web-api";
import { GeneratedAudioFile } from "ai";
import { FORMAT, PODCAST, RETRY, SIZE, TIME } from "../constants/index.js";
import type { PodcastAudio } from "../types/index.js";
import { retryWithExponentialBackoff } from "../utils/retry.js";

export class PodcastUploader {
  constructor(private client: WebClient) {}

  async publishPodcast(
    audio: PodcastAudio,
    channelId: string,
    weekNumber: string
  ): Promise<string> {
    console.log(`[PodcastUploader] Publishing podcast to channel ${channelId}`);

    const filename = `${PODCAST.TITLE}_${weekNumber}.mp3`;
    const title = `${PODCAST.TITLE} ${weekNumber}`;
    const initialComment = this.createInitialComment(audio, weekNumber);

    try {
      const fileUrl = await retryWithExponentialBackoff(
        () =>
          this.uploadToSlack(audio, channelId, filename, title, initialComment),
        RETRY.SLACK.MAX_ATTEMPTS,
        RETRY.SLACK.BASE_DELAY_MS
      );

      console.log(
        `[PodcastUploader] Successfully published podcast: ${fileUrl}`
      );

      return fileUrl;
    } catch (error) {
      console.error("[PodcastUploader] Failed to publish podcast:", error);
      throw new Error(
        `Podcast publishing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async uploadToSlack(
    audio: PodcastAudio,
    channelId: string,
    filename: string,
    title: string,
    initialComment: string
  ): Promise<string> {
    const buffer = this.convertToBuffer(audio.audio);

    const response = await this.client.files.uploadV2({
      channel_id: channelId,
      file: buffer,
      filename,
      title,
      initial_comment: initialComment,
    });

    if (!response.ok) {
      throw new Error(
        `Slack files.uploadV2 error: ${response.error || "Unknown error"}`
      );
    }

    //?: Slack APIのレスポンス型が不完全なため、unknown型で型安全に処理
    const typedResponse = response as unknown as {
      file?: { permalink?: string };
      files?: Array<{
        permalink?: string;
        url_private?: string;
        permalink_public?: string;
      }>;
    };

    if (typedResponse.file) {
      return typedResponse.file.permalink || "";
    }

    if (typedResponse.files) {
      const file = typedResponse.files[0];
      return (
        file?.permalink || file?.url_private || file?.permalink_public || ""
      );
    }

    throw new Error(
      `File URL not found. Response keys: ${Object.keys(response).join(", ")}`
    );
  }

  private convertToBuffer(audio: GeneratedAudioFile) {
    if (audio.uint8Array) {
      return Buffer.from(audio.uint8Array);
    }
    if (audio.base64) {
      return Buffer.from(audio.base64, "base64");
    }
    throw new Error(
      "Audio data is not available in uint8Array or base64 format"
    );
  }

  private createInitialComment(
    audio: PodcastAudio,
    weekNumber: string
  ): string {
    const durationMinutes = Math.floor(
      audio.durationInSeconds / TIME.SECONDS_PER_MINUTE
    );
    const durationSeconds = audio.durationInSeconds % TIME.SECONDS_PER_MINUTE;
    const sizeMB = (audio.sizeInBytes / SIZE.BYTES_PER_MEGABYTE).toFixed(
      FORMAT.DECIMAL_PLACES_SIZE
    );

    const jstTime = audio.generatedAt.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return (
      `🎙️ *${PODCAST.TITLE} ${weekNumber}*\n\n` +
      `今週の活動をポッドキャストでお届けします！\n` +
      `再生時間: 約${durationMinutes}分${durationSeconds}秒\n` +
      `ファイルサイズ: ${sizeMB}MB\n\n` +
      `_自動生成日時: ${jstTime}_`
    );
  }

  static generateWeekNumber(date: Date = new Date()): string {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor(
      (date.getTime() - startOfYear.getTime()) / TIME.MILLISECONDS_PER_DAY
    );
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);

    return `${year}年第${weekNumber}週`;
  }
}
