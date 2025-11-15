import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CronTriggerHandler } from "../src/handlers/CronTriggerHandler.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[API] CRON_SECRET is not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[API] Unauthorized cron job attempt", {
      hasAuthHeader: !!authHeader,
      ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  console.log("[API] Cron job triggered");

  try {
    const handler = new CronTriggerHandler();
    const result = await handler.execute();

    res.status(200).json({
      success: result.success,
      message: "Podcast generation completed",
    });
  } catch (error) {
    console.error("[API] Cron job failed:", error);

    res.status(500).json({
      success: false,
      message: "Podcast generation failed",
    });
  }
}
