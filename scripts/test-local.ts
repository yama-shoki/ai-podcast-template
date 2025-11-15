#!/usr/bin/env bun

/**
 * ローカルテスト用スクリプト
 * CronTriggerHandlerを直接実行して、システム全体の動作を確認します
 */

import { CronTriggerHandler } from "../src/handlers/CronTriggerHandler.js";

async function main() {
  console.log("========================================");
  console.log("ローカルテストを開始します");
  console.log("========================================\n");

  console.log("⚠️  注意: このテストは実際にOpenAI APIを呼び出し、課金が発生します（約 $0.10 〜 $0.20）\n");

  try {
    const handler = new CronTriggerHandler();
    const result = await handler.execute();

    console.log("\n========================================");
    console.log("テスト結果:");
    console.log("========================================");
    console.log(`成功: ${result.success}`);
    console.log(`ポッドキャストID: ${result.podcastId}`);
    console.log(`収集メッセージ数: ${result.stats.messagesCollected}`);
    console.log(`原稿文字数: ${result.stats.scriptLength}`);
    console.log(`音声サイズ: ${(result.stats.audioSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`実行時間: ${(result.stats.totalDuration / 1000).toFixed(2)} 秒`);

    if (result.success) {
      console.log("\n✅ ローカルテスト成功！");
      console.log("Slackチャンネルでポッドキャストを確認してください。");
      process.exit(0);
    } else {
      console.log("\n❌ ローカルテスト失敗");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n========================================");
    console.error("❌ ローカルテストでエラーが発生しました:");
    console.error("========================================");
    console.error(error);
    process.exit(1);
  }
}

main();
