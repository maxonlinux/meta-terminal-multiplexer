import { logger } from "@/shared/logger";
import {
  simulateToTarget,
  simulateFlat,
  simulateRevert,
} from "../generators/simulation.generators";
import { periodsRepository } from "../periods/periods.repository";
import {
  Scenario,
  ScenarioStage,
  ScenarioStatus,
  StageType,
} from "../scenarios/scenarios.types";
import { ticksRepository } from "../ticks/ticks.repository";
import { scenariosService } from "../scenarios/scenarios.service";
import { scenariosRepository } from "../scenarios/scenarios.repository";
import EventEmitter from "node:stream";
import { multiplexerService } from "@/multiplexer/multiplexer.service";
import { PriceSource } from "@/multiplexer/multiplexer.types";
import { parseStagesOrThrow } from "../scenarios/scenarios.utils";
import { sleep } from "@/utils";

const Events = {
  START: "START",
  ABORT: "ABORT",
  DONE: "DONE",
} as const;

export class Simulation {
  private scenario: Scenario;
  private controller: AbortController | null;
  private generator: AsyncGenerator<number, void, unknown> | null;
  private isPaused: boolean;
  private events: EventEmitter;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
    this.controller = null;
    this.generator = null;
    this.isPaused = false;
    this.events = new EventEmitter();
  }

  getScenario = () => this.scenario;

  getIsPaused = () => this.isPaused;

  // Reassign
  onend() {}

  async start() {
    logger.info("Starting simulation", { symbol: this.scenario.symbol });

    // Проверка на наличие стадий
    const stages = parseStagesOrThrow(this.scenario.stages);

    const periodId = this.scenario.scenarioId;
    const period = await periodsRepository.getPeriodById(periodId);
    const tickCount = period ? period.tick_count : 0;

    const state = {
      remaining: tickCount,
      currentPrice: await multiplexerService.getPrice(this.scenario.symbol),
    };

    if (!state.currentPrice) {
      logger.error("Price not available", { symbol: this.scenario.symbol });
      return;
    }

    this.controller = new AbortController();

    for (const stage of stages) {
      const stageDuration = stage.duration;

      if (state.remaining >= stageDuration) {
        state.remaining -= stageDuration;
        continue;
      }

      const skipped = state.remaining;
      state.remaining = 0;

      this.generator = await this.createGenerator(
        stage,
        this.scenario.symbol,
        state.currentPrice,
        this.controller.signal,
        skipped,
      );

      // Set status to active
      await scenariosRepository.updateScenarioStatus(
        this.scenario.scenarioId,
        ScenarioStatus.ACTIVE,
      );

      while (true) {
        const { value, done } = await this.generator.next();
        if (done) break;

        state.currentPrice = value;

        // Insert tick to Clickhouse
        await ticksRepository.insertTick({
          scenario_id: periodId,
          symbol: this.scenario.symbol,
          price: value,
        });

        // Update last price in multiplexer
        multiplexerService.updatePrice(
          this.scenario.symbol,
          value,
          PriceSource.SIMULATED,
        );

        await sleep(1000);
      }
    }

    this.events.emit(Events.ABORT);

    if (this.isPaused) {
      logger.info("Simulation paused", { symbol: this.scenario.symbol });
      return;
    }

    // If simulation is naturally finished - call onend
    logger.info("Simulation ended", {
      symbol: this.scenario.symbol,
      periodId,
    });

    // On end set status to done
    await scenariosRepository.updateScenarioStatus(
      this.scenario.scenarioId,
      ScenarioStatus.DONE,
    );

    this.onend();
  }

  async replace(newStages: ScenarioStage[]) {
    // pause scenario
    this.pause();

    // wait for sim to be fully stopped after abort
    await new Promise((resolve) => {
      this.events.once(Events.ABORT, resolve);
    });

    logger.info("Replacing running scenario...", {
      symbol: this.scenario.symbol,
    });

    // mark current scenario as cancelled in DB
    await scenariosRepository.updateScenarioStatus(
      this.scenario.scenarioId,
      ScenarioStatus.CANCELLED,
    );

    // create new scenario with no start_time (instant start)
    const scenario = await scenariosService.createScenario({
      symbol: this.scenario.symbol,
      stages: newStages,
    });

    if (!scenario) {
      this.resume();

        logger.error("Error replacing scenario. Resuming...", {
          symbol: this.scenario.symbol,
        });

      return;
    }

    // replace local scenario stage
    this.scenario = scenario;

    // restart sim with new stages
    this.resume();
  }

  stop() {
    this.isPaused = false;
    this.controller?.abort();
  }

  pause() {
    this.isPaused = true;
    this.controller?.abort();
  }

  resume() {
    if (!this.isPaused) {
      return logger.warn("Simulation is not paused.", {
        symbol: this.scenario.symbol,
      });
    }

    this.isPaused = false;
    this.start();
  }

  private async createGenerator(
    stage: ScenarioStage,
    symbol: string,
    startValue: number,
    signal: AbortSignal,
    skip: number,
  ) {
    switch (stage.type) {
      case StageType.TO_TARGET:
        return simulateToTarget({
          symbol,
          target: stage.target,
          duration: stage.duration,
          startValue,
          signal,
          skip,
        });
      case StageType.FLAT:
        return simulateFlat({
          symbol,
          range: stage.range,
          duration: stage.duration,
          startValue,
          signal,
          skip,
        });
      case StageType.REVERT:
        return simulateRevert({
          symbol,
          duration: stage.duration,
          startValue,
          signal,
          skip,
        });
    }
  }
}
