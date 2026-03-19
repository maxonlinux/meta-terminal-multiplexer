import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import { db } from "@/shared/drizzle/drizzle.client";
import { simScenarios } from "@/shared/drizzle/drizzle.schema";
import { scenariosService } from "../simulations/scenarios/scenarios.service";
import {
  CreateScenarioInput,
  ScenarioStage,
  StageType,
} from "@/simulations/scenarios/scenarios.types";
import { sleep } from "@/utils";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
const describeIf = runIntegration ? describe : describe.skip;

describeIf("scenariosService", { concurrent: false }, () => {
  const sampleScenario = {
    symbol: "BTC/USD",
    startTime: new Date(Date.now() + 60_000),
    stages: [
      { type: StageType.TO_TARGET, duration: 4, target: 100 },
      { type: StageType.FLAT, duration: 4, range: 10 },
      { type: StageType.REVERT, duration: 4 },
    ],
  } satisfies CreateScenarioInput;

  const newStages = [
    { type: StageType.FLAT, duration: 3, range: 10 },
    { type: StageType.TO_TARGET, duration: 3, target: 40 },
    { type: StageType.REVERT, duration: 3 },
  ] satisfies ScenarioStage[];

  afterEach(async () => {
    await db.delete(simScenarios).execute();
  });

  beforeAll(async () => {
    await db.delete(simScenarios).execute();
  });

  it(
    "should start, pause, and resume a running simulation",
    { timeout: 25_000 },
    async () => {
      // Create the scenario
      const created = await scenariosService.createScenario(sampleScenario);
      if (!created) return;

      scenariosService.startScenario(created);
      await sleep(2000);

      scenariosService.pauseScenario(created.symbol);
      expect(scenariosService.isPaused(created.symbol)).toBe(true);

      await sleep(5000);

      scenariosService.resumeScenario(created.symbol);
      expect(scenariosService.isPaused(created.symbol)).toBe(false);

      await sleep(12_000);
    }
  );

  // NEEDS MOCK OF MULTIPLEXER!!!!
  // it(
  //   "should update a running simulation stages",
  //   { timeout: 30_000 },
  //   async () => {
  //     // Create the scenario
  //     const created = await scenariosService.createScenario(sampleScenario);
  //     if (!created) return;

  //     scenariosService.startScenario(created);
  //     await sleep(4000);

  //     scenariosService.replaceRunningScenario(created.symbol, newStages);

  //     await sleep(20_000);
  //   }
  // );
});
