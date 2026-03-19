import { describe, it, expect, afterEach, beforeAll } from "vitest";
import { db } from "@/shared/drizzle/drizzle.client";
import { simScenarios } from "@/shared/drizzle/drizzle.schema";
import { scenariosRepository } from "../simulations/scenarios/scenarios.repository";
import {
  CreateScenarioInput,
  StageType,
} from "@/simulations/scenarios/scenarios.types";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
const describeIf = runIntegration ? describe : describe.skip;

describeIf("scenariosRepository", { concurrent: false }, () => {
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

  it("should return upcoming symbols", async () => {
    await scenariosRepository.createScenario(sampleScenario);
    const symbols = await scenariosRepository.getUpcomingSymbols(120 * 1000);
    expect(symbols).toContain(sampleScenario.symbol);
  });

  it("should return the soonest scenario for a symbol", async () => {
    await scenariosRepository.createScenario(sampleScenario);
    const result = await scenariosRepository.getSoonestScenarioForSymbol(
      sampleScenario.symbol,
      120 * 1000
    );
    expect(result?.symbol).toBe(sampleScenario.symbol);
  });

  it("should not return outdated scenarios", async () => {
    // total duration is 10 sec and start time is grace period (1h) and 10 sec ago so it is expired
    const expiredScenario = {
      symbol: `EXPIRED/USD`,
      startTime: new Date(Date.now() - 60 * 60 * 1000 - 10_000),
      stages: [
        { type: StageType.TO_TARGET, duration: 1, target: 100 },
        { type: StageType.REVERT, duration: 9 },
      ],
    } satisfies CreateScenarioInput;

    await scenariosRepository.createScenario(expiredScenario);

    const symbols = await scenariosRepository.getUpcomingSymbols(120 * 1000);
    expect(symbols).not.toContain(expiredScenario.symbol);
  });
});
