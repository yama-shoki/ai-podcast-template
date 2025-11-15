# カスタマイズガイド

このドキュメントでは、AIポッドキャスト生成システムをカスタマイズする方法を説明します。

## 目次

1. [複数チャンネル対応](#1-複数チャンネル対応)
2. [ポッドキャストタイトルのカスタマイズ](#2-ポッドキャストタイトルのカスタマイズ)
3. [プロンプトのカスタマイズ](#3-プロンプトのカスタマイズ)
4. [音声設定のカスタマイズ](#4-音声設定のカスタマイズ)

## 1. 複数チャンネル対応

### 概要
デフォルトでは1つのSlackチャンネルからデータを収集しますが、複数のチャンネルから収集することも可能です。

### 手順

#### 1.1 環境変数スキーマの変更

`src/schemas/env.schema.ts` を編集：

```typescript
export const envSchema = z.object({
  SLACK_BOT_TOKEN: z.string().startsWith("xoxb-"),
  // 複数チャンネル用の環境変数を追加
  SLACK_CHANNEL_TECH: z.string().min(1),
  SLACK_CHANNEL_GENERAL: z.string().min(1),
  SLACK_CHANNEL_RANDOM: z.string().min(1),
  SLACK_PODCAST_CHANNEL: z.string().min(1),
  OPENAI_API_KEY: z.string().startsWith("sk-"),
  CRON_SECRET: z.string().min(32),
});
```

#### 1.2 ConfigurationManager の変更

`src/utils/ConfigurationManager.ts` を編集：

```typescript
getChannelIds() {
  return {
    tech: this.env.SLACK_CHANNEL_TECH,
    general: this.env.SLACK_CHANNEL_GENERAL,
    random: this.env.SLACK_CHANNEL_RANDOM,
  };
}
```

#### 1.3 SlackDataCollector の変更

`src/services/SlackDataCollector.ts` を編集：

```typescript
async collectMessages(
  channels: { tech: string; general: string; random: string },
  daysAgo: number = SLACK.DAYS_TO_COLLECT
): Promise<{ tech: MessageElement[]; general: MessageElement[]; random: MessageElement[] }> {
  const oldest = this.calculateTimestamp(daysAgo);

  const [techMessages, generalMessages, randomMessages] = await Promise.all([
    this.fetchChannelMessagesWithRetry(channels.tech, oldest, "tech"),
    this.fetchChannelMessagesWithRetry(channels.general, oldest, "general"),
    this.fetchChannelMessagesWithRetry(channels.random, oldest, "random"),
  ]);

  return { tech: techMessages, general: generalMessages, random: randomMessages };
}
```

#### 1.4 型定義の追加

`src/types/index.ts` に戻り値の型を追加：

```typescript
export interface CollectedMessages {
  tech: MessageElement[];
  general: MessageElement[];
  random: MessageElement[];
}
```

#### 1.5 CronTriggerHandler の変更

`src/handlers/CronTriggerHandler.ts` を編集：

```typescript
const channelIds = this.config.getChannelIds();
const messages = await collector.collectMessages(channelIds);
```

#### 1.6 プロンプトの調整

`src/constants/prompts.ts` で、チャンネル別のメッセージを処理するようにプロンプトを調整：

```typescript
export function createPodcastScriptPrompt(
  techMessages: MessageElement[],
  generalMessages: MessageElement[],
  randomMessages: MessageElement[]
): string {
  const tech = formatMessages(techMessages) || "今週は投稿がありませんでした。";
  const general = formatMessages(generalMessages) || "今週は投稿がありませんでした。";
  const random = formatMessages(randomMessages) || "今週は投稿がありませんでした。";

  return `あなたは明るく楽しいラジオDJです。以下のSlackチャンネルから収集した今週（過去7日間）の活動をもとに、約1500文字のポッドキャスト原稿を生成してください。

## 収集データ

### #tech（技術的な話題）
${tech}

### #general（一般的な話題）
${general}

### #random（雑談）
${random}

// ... 残りのプロンプト
`;
}
```

#### 1.7 ScriptGenerator の変更

`src/services/ScriptGenerator.ts` を編集：

```typescript
async generateScript(messages: CollectedMessages): Promise<string> {
  console.log(
    `[ScriptGenerator] Generating script from ${
      messages.tech.length + messages.general.length + messages.random.length
    } messages`
  );

  const prompt = createPodcastScriptPrompt(
    messages.tech,
    messages.general,
    messages.random
  );
  // ... 残りの処理
}
```

#### 1.8 環境変数の設定

`.env` ファイルに新しいチャンネルIDを追加：

```bash
SLACK_CHANNEL_TECH=C0XXXXXXXXX
SLACK_CHANNEL_GENERAL=C0YYYYYYYYY
SLACK_CHANNEL_RANDOM=C0ZZZZZZZZZ
```

## 2. ポッドキャストタイトルのカスタマイズ

`src/constants/index.ts` を編集：

```typescript
export const PODCAST = {
  TITLE: "あなたのポッドキャスト名",  // ここを変更
  AUDIO_BITRATE_PER_SECOND: 16000,
} as const satisfies Record<string, string | number>;
```

## 3. プロンプトのカスタマイズ

### プロンプトの場所

プロンプトは `src/constants/prompts.ts` に定義されています。

### カスタマイズ例

#### 3.1 原稿の長さを変更

```typescript
// src/constants/index.ts
export const SCRIPT = {
  TARGET_LENGTH: 2000,  // 1500文字から2000文字に変更
} as const satisfies Record<string, number>;
```

プロンプトも合わせて変更：

```typescript
// src/constants/prompts.ts
return `あなたは明るく楽しいラジオDJです。以下のSlackチャンネルから収集した今週（過去7日間）の活動をもとに、約2000文字のポッドキャスト原稿を生成してください。

// ...

以下の構成で原稿を作成してください（合計約2000文字、±200文字の範囲内）：
// ...
`;
```

#### 3.2 トーンやスタイルを変更

プロンプトの「重要なガイドライン」セクションを変更：

```typescript
## 重要なガイドライン

- **トーン**: 落ち着いた、プロフェッショナルな雰囲気を維持
- **文体**: 丁寧語（「〜です」「〜ます」など）
- **専門用語**: 技術用語を積極的に使用し、詳細な説明を含める
```

#### 3.3 構成を変更

原稿の構成セクションを自由に変更できます：

```typescript
1. **オープニング（約150文字）**
   - 週のサマリー

2. **技術トピック詳細（約1000文字）**
   - 技術的な内容を深掘り

3. **コミュニティ活動（約600文字）**
   - チーム活動やイベント

4. **エンディング（約250文字）**
   - 次週の予告
```

## 4. 音声設定のカスタマイズ

`src/constants/index.ts` で音声設定を変更できます：

### 利用可能な声

```typescript
export const OPENAI = {
  TTS: {
    MODEL: "tts-1",  // または "tts-1-hd" (高品質版)
    VOICE: "alloy",  // 以下から選択
    // - alloy: 中性的でバランスの取れた声
    // - echo: 男性的で落ち着いた声
    // - fable: 英国英語風の声
    // - onyx: 深みのある男性的な声
    // - nova: 明るく若々しい女性的な声
    // - shimmer: 優しく穏やかな女性的な声
    SPEED: 1.1,      // 0.25 〜 4.0 (1.0が通常速度)
  },
} as const satisfies Record<string, Record<string, string | number>>;
```

### カスタマイズ例

#### 4.1 高品質な音声で生成

```typescript
VOICE: "nova",    // 明るい声
MODEL: "tts-1-hd", // 高品質モデル
SPEED: 1.0,       // 通常速度
```

#### 4.2 落ち着いたプロフェッショナルな雰囲気

```typescript
VOICE: "onyx",    // 深みのある声
MODEL: "tts-1-hd",
SPEED: 0.95,      // やや遅め
```

#### 4.3 テンポの良いカジュアルな雰囲気

```typescript
VOICE: "nova",    // 明るい声
MODEL: "tts-1",
SPEED: 1.2,       // やや速め
```

## トラブルシューティング

### カスタマイズ後の確認事項

1. **型チェック**
   ```bash
   bun run type-check
   ```

2. **ビルド**
   ```bash
   bun run build
   ```

3. **Lint**
   ```bash
   bun run lint
   ```

### よくある問題

**Q: 複数チャンネル対応後、型エラーが出る**

A: すべての関連ファイル（ConfigurationManager、SlackDataCollector、ScriptGenerator、CronTriggerHandler）が正しく変更されているか確認してください。

**Q: プロンプトを変更したが、期待通りの原稿が生成されない**

A: プロンプトの構成セクションと、実際の文字数配分が一致しているか確認してください。また、temperatureパラメータ（`src/constants/index.ts`の`OPENAI.CHAT.TEMPERATURE`）を調整することで、生成結果の創造性を変更できます。

**Q: 音声が速すぎる/遅すぎる**

A: `OPENAI.TTS.SPEED`の値を調整してください。0.25〜4.0の範囲で設定可能です。1.0が通常速度です。

## さらに詳しく

- [OpenAI TTS API ドキュメント](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI Chat API ドキュメント](https://platform.openai.com/docs/guides/text-generation)
- [Slack API ドキュメント](https://api.slack.com/docs)
