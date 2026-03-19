import { scenariosService } from "../scenarios/scenarios.service";
import { Scenario } from "../scenarios/scenarios.types";
import { scenariosRepository } from "../scenarios/scenarios.repository";
import { logger } from "@/shared/logger";

type ScenariosRepo = {
	getUpcomingSymbols: (lookaheadMs: number) => Promise<string[]>;
	getSoonestScenarioForSymbol: (
		symbol: string,
		lookaheadMs: number,
	) => Promise<Scenario | null>;
};

type ScenariosService = {
	isRunning: (symbol: string) => boolean;
	startScenario: (scenario: Scenario) => void;
};

type SchedulerDeps = {
	repo?: () => ScenariosRepo;
	service?: () => ScenariosService;
	logger?: { info: (meta: unknown, msg: string) => void; warn: (msg: string) => void };
	now?: () => number;
	setTimeout?: (handler: () => void, timeout: number) => NodeJS.Timeout;
	clearTimeout?: (timeoutId: NodeJS.Timeout) => void;
	setInterval?: (handler: () => void, timeout: number) => NodeJS.Timeout;
	clearInterval?: (intervalId: NodeJS.Timeout) => void;
};

export class SimulationScheduler {
	private scannerInterval: null | NodeJS.Timeout;

	private lookaheadMs: number;
	private scheduledTimers: Map<string, NodeJS.Timeout>; // symbol -> timeout ID
	private repo: () => ScenariosRepo;
	private service: () => ScenariosService;
	private log: { info: (meta: unknown, msg: string) => void; warn: (msg: string) => void };
	private now: () => number;
	private setTimeoutFn: (handler: () => void, timeout: number) => NodeJS.Timeout;
	private clearTimeoutFn: (timeoutId: NodeJS.Timeout) => void;
	private setIntervalFn: (handler: () => void, timeout: number) => NodeJS.Timeout;
	private clearIntervalFn: (intervalId: NodeJS.Timeout) => void;

	constructor(lookaheadMs: number, deps: SchedulerDeps = {}) {
		this.scannerInterval = null;

		this.lookaheadMs = lookaheadMs;
		this.scheduledTimers = new Map<string, NodeJS.Timeout>();
		this.repo = deps.repo ?? (() => scenariosRepository);
		this.service = deps.service ?? (() => scenariosService);
		this.log = deps.logger ?? logger;
		this.now = deps.now ?? Date.now;
		this.setTimeoutFn = deps.setTimeout ?? setTimeout;
		this.clearTimeoutFn = deps.clearTimeout ?? clearTimeout;
		this.setIntervalFn = deps.setInterval ?? setInterval;
		this.clearIntervalFn = deps.clearInterval ?? clearInterval;
	}

	async init() {
		if (this.scannerInterval) {
			this.log.warn("Scheduler already initialized!");
			return;
		}

		// Schedule scanner for every 5 min
		this.scannerInterval = this.setIntervalFn(() => {
			this.scanAllSymbols();
		}, this.lookaheadMs);

    // Initial run
    await this.scanAllSymbols();
  }

	stop() {
		if (this.scannerInterval) {
			this.clearIntervalFn(this.scannerInterval);
			this.scannerInterval = null;
		}

		for (const timeout of this.scheduledTimers.values()) {
			this.clearTimeoutFn(timeout);
		}

    this.scheduledTimers.clear();
  }

	private async scanAllSymbols() {
		const upcomingSymbols = await this.repo().getUpcomingSymbols(
			this.lookaheadMs
		);

		this.log.debug("Scanning symbols for scenarios...", {
			count: upcomingSymbols.length,
		});

    for (const symbol of upcomingSymbols) {
      await this.updateForSymbol(symbol);
    }
  }

	private clearTimer(symbol: string) {
		const existing = this.scheduledTimers.get(symbol);

		if (existing) {
			this.clearTimeoutFn(existing);
			this.scheduledTimers.delete(symbol);
		}
	}

  /** Updates schedule for symbol */
	async updateForSymbol(symbol: string) {
		this.clearTimer(symbol);

		const scenario = await this.repo().getSoonestScenarioForSymbol(
			symbol,
			this.lookaheadMs
		);

    if (scenario) this.scheduleScenario(scenario);
  }

	private scheduleScenario(scenario: Scenario) {
		if (this.service().isRunning(scenario.symbol)) return;

		const now = this.now();
		const start = new Date(scenario.startTime).getTime();
		const startDelay = start - now;

		const handleSimulationStart = () => {
			this.service().startScenario(scenario);
			this.scheduledTimers.delete(scenario.symbol);
		};

    // if scenario is ongoing, start immediately
    if (startDelay <= 0) {
      handleSimulationStart();
      return;
    }

		const timeoutId = this.setTimeoutFn(handleSimulationStart, startDelay);
		this.scheduledTimers.set(scenario.symbol, timeoutId);
	}

	getScheduledSymbols() {
		return Array.from(this.scheduledTimers.keys());
	}

	isScanning() {
		return this.scannerInterval != null;
	}
}

export const simulationScheduler = new SimulationScheduler(5 * 60 * 1000);
