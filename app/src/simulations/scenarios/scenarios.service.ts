import { logger } from "@/shared/logger";
import { scenariosRepository } from "./scenarios.repository";
import {
  Scenario,
  CreateScenarioInput,
  ScenarioStatus,
  ScenarioStage,
} from "./scenarios.types";
import { simulationScheduler } from "../scheduler/scheduler.service";
import { AppError } from "@/error.handler";
import { Simulation } from "../engine/simulation.engine";
import { caclulateTotalSteps, parseStagesOrThrow } from "./scenarios.utils";
import { UUID } from "crypto";
import { periodsRepository } from "../periods/periods.repository";

class ScenariosService {
  private runningSimulations: Map<string, Simulation>; // symbol -> Simulation

  constructor() {
    this.runningSimulations = new Map();
  }

  isRunning(symbol: string) {
    return this.runningSimulations.has(symbol);
  }

  isPaused(symbol: string) {
    const simulation = this.runningSimulations.get(symbol);
    if (!simulation) return null;

    return simulation.getIsPaused();
  }

  getRunning(symbol: string) {
    return this.runningSimulations.get(symbol);
  }

  async createScenario(data: CreateScenarioInput) {
    const stages = parseStagesOrThrow(data.stages);
    const totalSteps = caclulateTotalSteps(stages);

    // check that new schedule overlaps with existing simulation for this symbol
    const existingOverlappingScenarios =
      await scenariosRepository.getOverlappingScenarios(
        data.symbol,
        totalSteps,
        data.startTime
      );

    if (existingOverlappingScenarios.length) {
      throw new AppError(
        400,
        `New schedule overlaps with existing scenarios: ${existingOverlappingScenarios
          .map((scenario) => scenario.scenarioId)
          .join(", ")}`
      );
    }

    const scenario = await scenariosRepository.createScenario({
      ...data,
      stages,
    });

    if (!scenario) return null;

    // update schedule
    await simulationScheduler.updateForSymbol(data.symbol);

    return scenario;
  }

  async startScenario(scenario: Scenario) {
    if (this.runningSimulations.has(scenario.symbol)) {
      logger.warn("Scenario already running", { symbol: scenario.symbol });
      return;
    }

    const simulation = new Simulation(scenario);
    this.runningSimulations.set(scenario.symbol, simulation);

    simulation.onend = () => {
      this.runningSimulations.delete(scenario.symbol);
      simulationScheduler.updateForSymbol(scenario.symbol);
    };

    await simulation.start();
  }

  async replaceRunningScenario(symbol: string, newStages: ScenarioStage[]) {
    const simulation = this.runningSimulations.get(symbol);
    if (!simulation) {
      throw new AppError(404, `No running scenario for symbol: ${symbol}`);
    }

    const stages = parseStagesOrThrow(newStages);

    await simulation.replace(stages);

    return simulation.getScenario();
  }

  async cancelRunningScenario(scenarioId: UUID) {
    const scenario = await scenariosRepository.getScenarioById(scenarioId);
    if (!scenario) {
      throw new AppError(404, `Scenario not found: ${scenarioId}`);
    }

    const simulation = this.runningSimulations.get(scenario.symbol);
    if (!simulation) {
      throw new AppError(404, `No running scenario with id: ${scenarioId}`);
    }

    const updated = await scenariosRepository.updateScenarioStatus(
      scenarioId,
      ScenarioStatus.CANCELLED
    );

    simulation.stop();

    return updated;
  }

  async rescheduleScenario(scenarioId: UUID, newTime?: Date) {
    const scenario = await scenariosRepository.getScenarioById(scenarioId);
    if (!scenario) {
      throw new AppError(404, `Scenario not found: ${scenarioId}`);
    }

    const isRunning = this.runningSimulations.has(scenario.symbol);
    if (isRunning) {
      throw new AppError(
        400,
        `Cannot reschedule running scenario: ${scenarioId}`
      );
    }

    const isScheduled = scenario.status === ScenarioStatus.SCHEDULED;
    if (!isScheduled) {
      throw new AppError(400, `Scenario is not scheduled: ${scenarioId}`);
    }

    // check that new schedule overlaps with existing simulation for this symbol
    const existingOverlappingScenarios =
      await scenariosRepository.getOverlappingScenarios(
        scenario.symbol,
        scenario.totalSteps,
        newTime
      );

    if (existingOverlappingScenarios.length) {
      throw new AppError(
        400,
        `New schedule overlaps with existing scenario: ${existingOverlappingScenarios
          .map((scenario) => scenario.scenarioId)
          .join(", ")}`
      );
    }

    // update in DB
    const updated = await scenariosRepository.rescheduleScenario(
      scenarioId,
      newTime
    );

    // update schedule
    await simulationScheduler.updateForSymbol(scenario.symbol);

    return updated;
  }

  pauseScenario(symbol: string) {
    const simulation = this.runningSimulations.get(symbol);
    if (!simulation) {
      logger.error("No running simulation found", { symbol });
      return;
    }

    simulation.pause();
  }

  resumeScenario(symbol: string) {
    const simulation = this.runningSimulations.get(symbol);
    if (!simulation) {
      logger.error("No running simulation found", { symbol });
      return;
    }

    simulation.resume();
  }

  async deleteScenario(scenarioId: UUID) {
    const simulation = await scenariosRepository.getScenarioById(scenarioId);

    if (!simulation) {
      throw new AppError(404, "Simulation with this ID not found");
    }

    if (this.isRunning(simulation.symbol)) {
      throw new AppError(
        400,
        "Cannot delete running simulation. Either stop it or wait until finished"
      );
    }

    const deleted = await scenariosRepository.deleteScenario(scenarioId);

    if (!deleted) {
      throw new AppError(500, "Simulation was not deleted");
    }

    await periodsRepository.deletePeriod(scenarioId);

    await simulationScheduler.updateForSymbol(deleted.symbol);
  }
}

export const scenariosService = new ScenariosService();
