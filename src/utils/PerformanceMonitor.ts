import { VERCEL } from "../constants/index.js";
import type { PerformanceReport, Phase } from "../types/index.js";

export class PerformanceMonitor {
  private startTime = Date.now();
  private phaseStartTimes = new Map<Phase, number>();
  private phaseDurations = new Map<Phase, number>();
  private warnings: string[] = [];

  startPhase(phase: Phase) {
    this.phaseStartTimes.set(phase, Date.now());
    console.log(`[Performance] Phase started: ${phase}`);
  }

  endPhase(phase: Phase) {
    const startTime = this.phaseStartTimes.get(phase);
    if (!startTime) {
      console.warn(`Phase "${phase}" was not started`);
      return;
    }

    const duration = Date.now() - startTime;
    this.phaseDurations.set(phase, duration);

    console.log(`[Performance] Phase completed: ${phase} (${duration}ms)`);

    this.checkPhasePerformance(phase, duration);
  }

  isApproachingTimeout() {
    const elapsed = Date.now() - this.startTime;
    const isApproaching = elapsed > VERCEL.WARNING_THRESHOLD_MS;

    if (isApproaching && !this.warnings.includes("timeout-warning")) {
      this.warnings.push("timeout-warning");
      console.warn(
        `[Performance] WARNING: Approaching timeout (${elapsed}ms / ${VERCEL.FUNCTION_TIMEOUT_MS}ms)`
      );
    }

    return isApproaching;
  }

  getElapsedTime() {
    return Date.now() - this.startTime;
  }

  getReport(): PerformanceReport {
    return {
      totalDuration: this.getElapsedTime(),
      phases: {
        "data-collection": this.phaseDurations.get("data-collection") || 0,
        "script-generation": this.phaseDurations.get("script-generation") || 0,
        "audio-generation": this.phaseDurations.get("audio-generation") || 0,
        "slack-publish": this.phaseDurations.get("slack-publish") || 0,
      },
      warnings: [...this.warnings],
    };
  }

  private checkPhasePerformance(phase: Phase, duration: number) {
    const expectedDurations: Record<Phase, number> = {
      "data-collection": 10000,
      "script-generation": 20000,
      "audio-generation": 25000,
      "slack-publish": 5000,
    };

    const expected = expectedDurations[phase];
    if (expected && duration > expected) {
      const warning = `Phase "${phase}" took ${duration}ms (expected < ${expected}ms)`;
      this.warnings.push(warning);
      console.warn(`[Performance] WARNING: ${warning}`);
    }
  }

  logReport() {
    const report = this.getReport();
    console.log("[Performance] Final Report:", JSON.stringify(report, null, 2));
  }
}
