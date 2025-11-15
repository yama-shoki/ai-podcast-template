import { createOpenAI } from "@ai-sdk/openai";
import {
  GeneratedAudioFile,
  experimental_generateSpeech as generateSpeech,
} from "ai";
import { OPENAI, PODCAST, RETRY, SIZE } from "../constants/index.js";
import type { PodcastAudio } from "../types/index.js";
import { retryWithExponentialBackoff } from "../utils/retry.js";

export class AudioGenerator {
  private openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string) {
    this.openai = createOpenAI({ apiKey });
  }

  async generateAudio(script: string): Promise<PodcastAudio> {
    console.log(
      `[AudioGenerator] Generating audio from ${script.length} character script`
    );

    try {
      const result = await retryWithExponentialBackoff(
        () => this.callOpenAITTS(script),
        RETRY.OPENAI.MAX_ATTEMPTS,
        RETRY.OPENAI.BASE_DELAY_MS
      );

      const audio = result.audio;

      const sizeInBytes = this.calculateAudioSize(audio);

      const durationInSeconds = this.estimateDuration(sizeInBytes);

      console.log(
        `[AudioGenerator] Generated audio: ${sizeInBytes} bytes, ~${durationInSeconds}s`
      );

      return {
        audio,
        sizeInBytes,
        durationInSeconds,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error("[AudioGenerator] Failed to generate audio:", error);
      throw new Error(
        `Audio generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async callOpenAITTS(
    script: string
  ): Promise<Awaited<ReturnType<typeof generateSpeech>>> {
    const result = await generateSpeech({
      model: this.openai.speech(OPENAI.TTS.MODEL),
      voice: OPENAI.TTS.VOICE,
      text: script,
      speed: OPENAI.TTS.SPEED,
    });

    if (!result.audio) {
      throw new Error("OpenAI TTS API returned empty audio");
    }

    return result;
  }

  private calculateAudioSize(audio: GeneratedAudioFile) {
    if (audio.uint8Array) {
      return audio.uint8Array.length;
    }
    if (audio.base64) {
      // Base64文字列からデコード後のバイト数を推定
      return Math.floor(audio.base64.length * SIZE.BASE64_DECODE_RATIO);
    }
    throw new Error(
      "Audio data is not available in uint8Array or base64 format"
    );
  }

  private estimateDuration(sizeInBytes: number) {
    return Math.round(sizeInBytes / PODCAST.AUDIO_BITRATE_PER_SECOND);
  }
}
