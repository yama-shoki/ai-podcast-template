/**
 * OpenAI API 設定
 * 原稿生成（GPT-4o）と音声生成（TTS）に使用
 * カスタマイズ方法: examples/CUSTOMIZATION.md 参照
 */
export const OPENAI = {
  CHAT: {
    MODEL: "gpt-4o", // 原稿生成に使用するモデル
    TEMPERATURE: 0.9, // 0.0-2.0: 高いほど創造的、低いほど決定論的
    MAX_TOKENS: 2000, // 生成する最大トークン数（約1500文字の原稿に対応）
  },
  TTS: {
    MODEL: "tts-1", // 音声生成モデル（高品質版: "tts-1-hd"）
    VOICE: "alloy", // 声の種類（alloy, echo, fable, onyx, nova, shimmer）
    SPEED: 1.0, // 再生速度（0.25 〜 4.0、1.0が通常速度）
  },
} as const satisfies Record<string, Record<string, string | number>>;

/**
 * Vercel Functions タイムアウト設定
 * 無料プランは60秒、有料プランは最大300秒まで延長可能
 */
export const VERCEL = {
  FUNCTION_TIMEOUT_MS: 60000, // 関数の最大実行時間（60秒）
  WARNING_THRESHOLD_MS: 50000, // タイムアウト警告の閾値（50秒）
} as const satisfies Record<string, number>;

/**
 * API呼び出しのリトライ設定
 * 一時的なネットワークエラーに対応するための指数バックオフ
 */
export const RETRY = {
  SLACK: {
    MAX_ATTEMPTS: 3, // Slack API の最大リトライ回数
    BASE_DELAY_MS: 1000, // 初回リトライまでの待機時間（1秒）
  },
  OPENAI: {
    MAX_ATTEMPTS: 2, // OpenAI API の最大リトライ回数
    BASE_DELAY_MS: 1000, // 初回リトライまでの待機時間（1秒）
  },
  CONFIG: {
    EXPONENTIAL_BASE: 2, // 指数バックオフの基数 (遅延 = BASE_DELAY_MS * 2^試行回数)
  },
} as const satisfies Record<string, Record<string, number>>;

export const SLACK = {
  DAYS_TO_COLLECT: 7, // 過去何日分のメッセージを収集するか
  MAX_MESSAGES_PER_CHANNEL: 50, // 1チャンネルあたりの最大メッセージ数
} as const satisfies Record<string, number>;

/**
 * ポッドキャスト原稿生成設定
 */
export const SCRIPT = {
  TARGET_LENGTH: 1500, // 目標文字数（±200文字の範囲内）
} as const satisfies Record<string, number>;

/**
 * ポッドキャストメタデータ
 */
export const PODCAST = {
  // TODO: カスタマイズしてください - ポッドキャストのタイトルを設定してください
  TITLE: "Weekly Podcast", // ポッドキャストのタイトル（Slack投稿時に表示）
  AUDIO_BITRATE_PER_SECOND: 16000, // 音声ビットレート（16kbps、再生時間の推定に使用）
} as const satisfies Record<string, string | number>;

/**
 * エラーハンドリング設定
 */
export const ERROR = {
  STACK_TRACE_MAX_LENGTH: 2000, // Slackに通知するスタックトレースの最大文字数
} as const satisfies Record<string, number>;

/**
 * 時間変換定数
 */
export const TIME = {
  SECONDS_PER_MINUTE: 60, // 1分あたりの秒数
  MILLISECONDS_PER_DAY: 86400000, // 1日あたりのミリ秒数（24 * 60 * 60 * 1000）
  MILLISECONDS_PER_SECOND: 1000, // 1秒あたりのミリ秒数
} as const satisfies Record<string, number>;

/**
 * サイズ変換定数
 */
export const SIZE = {
  BYTES_PER_MEGABYTE: 1048576, // 1MBあたりのバイト数（1024 * 1024）
  BASE64_DECODE_RATIO: 0.75, // Base64デコード時の実データ比率（3/4）
} as const satisfies Record<string, number>;

/**
 * フォーマット精度設定
 */
export const FORMAT = {
  DECIMAL_PLACES_SIZE: 2, // ファイルサイズ表示の小数点以下桁数
  DECIMAL_PLACES_TIMESTAMP: 0, // タイムスタンプの小数点以下桁数
} as const satisfies Record<string, number>;
