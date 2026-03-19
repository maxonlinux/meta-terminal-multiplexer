import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { db } from "@/shared/drizzle/drizzle.client";
import { simScenarios } from "@/shared/drizzle/drizzle.schema";
import { scenariosService } from "../simulations/scenarios/scenarios.service";
import {
  CreateScenarioInput,
  StageType,
} from "@/simulations/scenarios/scenarios.types";
import { AppError } from "@/error.handler";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
const describeIf = runIntegration ? describe : describe.skip;

describeIf("scenariosService", { concurrent: false }, () => {
  const sampleScenario = {
    symbol: "TEST/USD",
    startTime: new Date(Date.now() + 60_000),
    stages: [
      { type: StageType.TO_TARGET, duration: 5, target: 100 },
      { type: StageType.FLAT, duration: 5, range: 10 },
      { type: StageType.REVERT, duration: 5 },
    ],
  } satisfies CreateScenarioInput;

  afterEach(async () => {
    await db.delete(simScenarios).execute();
  });

  beforeAll(async () => {
    await db.delete(simScenarios).execute();
  });

  it("should create a scenario", async () => {
    const created = await scenariosService.createScenario(sampleScenario);
    if (!created) return;

    expect(created.symbol).toBe(sampleScenario.symbol);
  });

  it("should throw on overlapping scenario", async () => {
    const fixedStart = new Date(Date.now() + 10_000); // за 10 сек

    const first: CreateScenarioInput = {
      symbol: "TEST/USD",
      startTime: fixedStart,
      stages: [
        { type: StageType.TO_TARGET, duration: 5, target: 100 }, // 5s
        { type: StageType.FLAT, duration: 5, range: 10 }, // 5s
        { type: StageType.REVERT, duration: 5 }, // 5s
      ],
    };

    const second: CreateScenarioInput = {
      ...first,
      startTime: new Date(fixedStart.getTime() + 5_000), // начинается через 5 сек
    };

    await scenariosService.createScenario(first);

    await expect(scenariosService.createScenario(second)).rejects.toThrowError(
      AppError
    );
  });
});
