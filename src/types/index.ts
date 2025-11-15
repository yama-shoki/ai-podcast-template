import type { ConversationsHistoryResponse } from "@slack/web-api";
import type { GeneratedAudioFile } from "ai";

export type MessageElement = NonNullable<
  ConversationsHistoryResponse["messages"]
>[number];

export type PodcastAudio = {
  audio: GeneratedAudioFile;
  sizeInBytes: number;
  durationInSeconds: number;
  generatedAt: Date;
};

export type ErrorInfo = {
  type: "slack_api" | "openai_api" | "other";
  message: string;
  stack?: string;
  timestamp: Date;
  context: ErrorContext;
  retryCount: number;
};

export type ErrorContext = {
  phase: string;
  channelId?: string;
  additionalInfo?: Record<string, unknown>;
};

export type Phase =
  | "data-collection"
  | "script-generation"
  | "audio-generation"
  | "slack-publish";

export type PerformanceReport = {
  totalDuration: number;
  phases: Record<Phase, number>;
  warnings: string[];
};

export type PodcastGenerationResult = {
  success: boolean;
  podcastId: string;
  stats: {
    messagesCollected: number;
    scriptLength: number;
    audioSize: number;
    totalDuration: number;
  };
  errors?: ErrorInfo[];
};
