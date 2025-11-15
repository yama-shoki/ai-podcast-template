import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { OPENAI, RETRY, SCRIPT } from "../constants/index.js";
import { createPodcastScriptPrompt } from "../constants/prompts.js";
import type { MessageElement } from "../types/index.js";
import { retryWithExponentialBackoff } from "../utils/retry.js";

export class ScriptGenerator {
  private openai: ReturnType<typeof createOpenAI>;

  constructor(apiKey: string) {
    this.openai = createOpenAI({ apiKey });
  }

  async generateScript(messages: MessageElement[]): Promise<string> {
    console.log(
      `[ScriptGenerator] Generating script from ${messages.length} messages`
    );

    const prompt = createPodcastScriptPrompt(messages);

    try {
      const result = await retryWithExponentialBackoff(
        () => this.callOpenAIAPI(prompt),
        RETRY.OPENAI.MAX_ATTEMPTS,
        RETRY.OPENAI.BASE_DELAY_MS
      );

      const script = result.text;

      console.log(
        `[ScriptGenerator] Generated script: ${script.length} characters (target: ${SCRIPT.TARGET_LENGTH})`
      );

      return script;
    } catch (error) {
      console.error("[ScriptGenerator] Failed to generate script:", error);
      throw new Error(
        `Script generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private async callOpenAIAPI(
    prompt: string
  ): Promise<Awaited<ReturnType<typeof generateText>>> {
    const model = this.openai(OPENAI.CHAT.MODEL);

    const result = await generateText({
      model,
      prompt,
      temperature: OPENAI.CHAT.TEMPERATURE,
      maxTokens: OPENAI.CHAT.MAX_TOKENS,
    });

    if (!result.text) {
      throw new Error("OpenAI API returned empty response");
    }

    return result;
  }
}
