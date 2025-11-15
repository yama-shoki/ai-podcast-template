import { WebClient } from "@slack/web-api";
import { AudioGenerator } from "../services/AudioGenerator.js";
import { PodcastUploader } from "../services/PodcastUploader.js";
import { ScriptGenerator } from "../services/ScriptGenerator.js";
import { SlackDataCollector } from "../services/SlackDataCollector.js";
import type { PodcastGenerationResult } from "../types/index.js";
import { ConfigurationManager } from "../utils/ConfigurationManager.js";
import { ErrorHandler } from "../utils/ErrorHandler.js";
import { PerformanceMonitor } from "../utils/PerformanceMonitor.js";

/**
 * Cron実行ハンドラー
 * 週刊ポッドキャスト自動生成のメイン処理を統合
 */
export class CronTriggerHandler {
  private config: ConfigurationManager;
  private errorHandler: ErrorHandler;
  private performanceMonitor: PerformanceMonitor;

  constructor() {
    this.config = new ConfigurationManager();
    this.errorHandler = new ErrorHandler();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * メイン実行処理
   * Vercel Cron Jobから呼び出される
   */
  async execute(): Promise<PodcastGenerationResult> {
    console.log("========================================");
    console.log("ポッドキャスト生成開始");
    console.log("========================================");

    try {
      this.config.validate();

      const slackClient = new WebClient(this.config.getSlackBotToken());

      this.errorHandler.enableSlackNotification(
        slackClient,
        this.config.getPodcastChannelId()
      );

      // Phase 1: データ収集
      this.performanceMonitor.startPhase("data-collection");
      const collector = new SlackDataCollector(slackClient);
      const messages = await collector.collectMessages(
        this.config.getSourceChannelId()
      );
      this.performanceMonitor.endPhase("data-collection");

      if (messages.length === 0) {
        console.warn(
          "[CronTriggerHandler] No messages collected. Skipping podcast generation."
        );
        return {
          success: false,
          podcastId: "",
          stats: {
            messagesCollected: 0,
            scriptLength: 0,
            audioSize: 0,
            totalDuration: this.performanceMonitor.getElapsedTime(),
          },
        };
      }

      // Phase 2: 原稿生成
      this.performanceMonitor.startPhase("script-generation");
      const scriptGenerator = new ScriptGenerator(
        this.config.getOpenAIApiKey()
      );
      const script = await scriptGenerator.generateScript(messages);
      this.performanceMonitor.endPhase("script-generation");

      // Phase 3: 音声生成
      this.performanceMonitor.startPhase("audio-generation");
      const audioGenerator = new AudioGenerator(this.config.getOpenAIApiKey());
      const audio = await audioGenerator.generateAudio(script);
      this.performanceMonitor.endPhase("audio-generation");

      // Phase 4: Slack配信
      this.performanceMonitor.startPhase("slack-publish");
      const uploader = new PodcastUploader(slackClient);
      const weekNumber = PodcastUploader.generateWeekNumber();
      await uploader.publishPodcast(
        audio,
        this.config.getPodcastChannelId(),
        weekNumber
      );
      this.performanceMonitor.endPhase("slack-publish");

      this.performanceMonitor.logReport();

      console.log("========================================");
      console.log("✅ ポッドキャスト生成完了");
      console.log("========================================");

      return {
        success: true,
        podcastId: weekNumber,
        stats: {
          messagesCollected: messages.length,
          scriptLength: script.length,
          audioSize: audio.sizeInBytes,
          totalDuration: this.performanceMonitor.getElapsedTime(),
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      await this.errorHandler.handleError(err, {
        phase: "unknown",
        additionalInfo: {
          timestamp: new Date().toISOString(),
        },
      });

      this.performanceMonitor.logReport();

      console.error("========================================");
      console.error("❌ ポッドキャスト生成失敗");
      console.error("========================================");

      //?: エラーを再スロー（Vercel Functionsでエラーステータスを返すため）
      throw err;
    }
  }
}
