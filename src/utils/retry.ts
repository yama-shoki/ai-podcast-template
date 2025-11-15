import { RETRY } from "../constants/index.js";

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      // 指数バックオフで待機時間を計算
      const delay =
        baseDelay * Math.pow(RETRY.CONFIG.EXPONENTIAL_BASE, attempt);

      console.log(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${
          lastError.message
        }`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error("Max retries exceeded");
}
