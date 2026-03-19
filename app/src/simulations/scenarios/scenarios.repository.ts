import { CreateScenarioInput, ScenarioStatus } from "./scenarios.types";
import { caclulateTotalSteps, parseStagesOrThrow } from "./scenarios.utils";
import { periodsRepository } from "../periods/periods.repository";
import { db } from "@/shared/drizzle/drizzle.client";
import { simScenarios } from "@/shared/drizzle/drizzle.schema";
import { and, eq, gt, gte, lt, lte, ne, or, sql } from "drizzle-orm";
import { UUID, randomUUID } from "crypto";

const GRACE_PERIOD = 60 * 60 * 1000; // 1 hr

class ScenariosRepository {
  async createScenario(input: CreateScenarioInput) {
    const now = new Date();
    const startTime = input.startTime ?? now;

    const stages = parseStagesOrThrow(input.stages);
    const totalSteps = caclulateTotalSteps(stages);

    const [inserted] = await db
      .insert(simScenarios)
      .values({
        symbol: input.symbol,
        status: ScenarioStatus.SCHEDULED,
        startTime: startTime.getTime(),
        stages,
        totalSteps,
        createdAt: now.getTime(),
        scenarioId: randomUUID(),
      })
      .returning();

    return inserted ?? null;
  }

  async updateScenarioStatus(
    scenarioId: string,
    status: keyof typeof ScenarioStatus
  ) {
    const [updated] = await db
      .update(simScenarios)
      .set({ status })
      .where(eq(simScenarios.scenarioId, scenarioId))
      .returning();

    return updated ?? null;
  }

  async rescheduleScenario(scenarioId: string, newTime?: Date) {
    const now = new Date();
    const startTime = newTime ?? now;

    const [updated] = await db
      .update(simScenarios)
      .set({ startTime: startTime.getTime() })
      .where(eq(simScenarios.scenarioId, scenarioId))
      .returning();

    return updated ?? null;
  }

  async getScenarioById(scenarioId: UUID) {
    const [row] = await db
      .select()
      .from(simScenarios)
      .where(eq(simScenarios.scenarioId, scenarioId));

    return row ?? null;
  }

  async getScenariosBySymbol(symbol: string) {
    return await db
      .select()
      .from(simScenarios)
      .where(eq(simScenarios.symbol, symbol))
      .orderBy(simScenarios.startTime);
  }

  async getUpcomingSymbols(lookaheadMs: number): Promise<string[]> {
    const now = Date.now();

    const graceFrom = now - GRACE_PERIOD;
    const lookaheadTo = now + lookaheadMs;

    const result = await db
      .selectDistinct({ symbol: simScenarios.symbol })
      .from(simScenarios)
      .where(
        and(
          ne(simScenarios.status, ScenarioStatus.CANCELLED),
          ne(simScenarios.status, ScenarioStatus.DONE),
          or(
            and(
              gte(simScenarios.startTime, graceFrom),
              lte(simScenarios.startTime, lookaheadTo)
            ),
            and(
              gt(
                sql<number>`start_time + (total_steps * 1000)`,
                graceFrom
              ),
              lte(
                sql<number>`start_time + (total_steps * 1000)`,
                lookaheadTo
              )
            )
          )
        )
      );

    return result.map((r) => r.symbol);
  }

  async getSoonestScenarioForSymbol(symbol: string, lookaheadMs: number) {
    const now = Date.now();

    const graceFrom = now - GRACE_PERIOD;
    const lookaheadTo = now + lookaheadMs;

    const row = await db.query.simScenarios.findFirst({
      where: (sc) =>
        and(
          eq(sc.symbol, symbol),
          ne(sc.status, "CANCELLED"),
          ne(sc.status, "DONE"),
          or(
            and(gte(sc.startTime, graceFrom), lte(sc.startTime, lookaheadTo)),
            gt(sql<number>`start_time + (total_steps * 1000)`, graceFrom)
          )
        ),
      orderBy: (sc) => [sc.startTime],
    });

    return row ?? null;
  }

  async getOverlappingScenarios(
    symbol: string,
    totalSteps: number,
    startTime?: Date | null
  ) {
    const now = new Date();

    const start = (startTime ?? now).getTime();
    const end = start + totalSteps * 1000;

    const overlapping = await db
      .select()
      .from(simScenarios)
      .where(
        and(
          eq(simScenarios.symbol, symbol),
          ne(simScenarios.status, ScenarioStatus.CANCELLED),
          ne(simScenarios.status, ScenarioStatus.DONE),
          lt(simScenarios.startTime, end),
          gt(sql<number>`start_time + (total_steps * 1000)`, start)
        )
      );

    return overlapping;
  }

  async getAllScenarios() {
    const rows = await db
      .select()
      .from(simScenarios)
      .orderBy(simScenarios.startTime);

    const withPeriods = await Promise.all(
      rows.map(async (scenario) => {
        const period = await periodsRepository.getPeriodById(
          scenario.scenarioId
        );
        return { ...scenario, period };
      })
    );

    return withPeriods;
  }

  async deleteScenario(scenarioId: UUID) {
    const [deleted] = await db
      .delete(simScenarios)
      .where(eq(simScenarios.scenarioId, scenarioId))
      .returning();

    return deleted;
  }
}

export const scenariosRepository = new ScenariosRepository();
