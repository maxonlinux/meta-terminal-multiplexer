import { describe, it, expect, beforeAll } from "vitest";
import { periodsRepository } from "@/simulations/periods/periods.repository";
import { clickhouse } from "@/shared/clickhouse.client";
import { randomUUID } from "crypto";
import { dateToSeconds, sleep } from "@/utils";

const runIntegration = process.env.RUN_INTEGRATION_TESTS === "true";
const describeIf = runIntegration ? describe : describe.skip;

describeIf("PeriodsRepository", () => {
  const testSymbol = "TEST/USDT";
  const scenarioId = randomUUID();

  const now = dateToSeconds(Date.now()); // в секундах

  beforeAll(async () => {
    // Вставка тик данных вручную
    await clickhouse.insert({
      table: "sim_ticks",
      values: [
        {
          scenario_id: scenarioId,
          symbol: testSymbol,
          price: 100,
          volume: 1,
          timestamp: now - 90, // 90 сек назад
        },
        {
          scenario_id: scenarioId,
          symbol: testSymbol,
          price: 102,
          volume: 1,
          timestamp: now - 30, // 30 сек назад
        },
      ],
      format: "JSONEachRow",
    });

    // Подождать чуть-чуть для материализации
    await sleep(1000);
  });

  it("should return overlapping periods", async () => {
    const result = await periodsRepository.getOverlappingPeriodsForSymbol(
      testSymbol,
      60, // 1m
      50
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.some((p) => p.scenario_id === scenarioId)).toBe(true);
  });

  it("should get period by id", async () => {
    const period = await periodsRepository.getPeriodById(scenarioId);

    expect(period).toBeDefined();
    expect(period.scenario_id).toBe(scenarioId);
    expect(period.symbol).toBe(testSymbol);
    expect(period.tick_count).toBeGreaterThan(0);
  });
});
