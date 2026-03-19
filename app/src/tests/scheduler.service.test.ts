import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { SimulationScheduler } from "../simulations/scheduler/scheduler.service";
import type { Scenario } from "../simulations/scenarios/scenarios.types";

type RepoStub = {
	getUpcomingSymbols: (lookaheadMs: number) => Promise<string[]>;
	getSoonestScenarioForSymbol: (
		symbol: string,
		lookaheadMs: number,
	) => Promise<Scenario | null>;
};

type ServiceStub = {
	isRunning: (symbol: string) => boolean;
	startScenario: (scenario: Scenario) => void;
};

const noopLogger = {
	info: () => {},
	warn: () => {},
};

describe("simulationScheduler", () => {
	let scheduler: SimulationScheduler;
	let started: Scenario[];
	let repo: RepoStub;
	let service: ServiceStub;

	beforeEach(() => {
		started = [];
		repo = {
			getUpcomingSymbols: async () => [],
			getSoonestScenarioForSymbol: async () => null,
		};
		service = {
			isRunning: () => false,
			startScenario: (scenario) => {
				started.push(scenario);
			},
		};
		scheduler = new SimulationScheduler(5_000, {
			repo: () => repo,
			service: () => service,
			logger: noopLogger,
		});
	});

	afterEach(() => {
		scheduler.stop();
	});

  it("should initialize and scan symbols immediately", async () => {
		repo.getUpcomingSymbols = async () => ["BTC/USD"];
		repo.getSoonestScenarioForSymbol = async () => ({
			symbol: "BTC/USD",
			startTime: Date.now() - 10_000,
			stages: [],
			scenarioId: "test",
			totalSteps: 1,
			status: "SCHEDULED",
		} as Scenario);

		await scheduler.init();
		expect(started.length).toBe(1);
		expect(started[0].symbol).toBe("BTC/USD");
		expect(scheduler.isScanning()).toBe(true);
	});

  it("should scan and start immediate scenarios", async () => {
		repo.getUpcomingSymbols = async () => ["BTC/USD"];
		repo.getSoonestScenarioForSymbol = async () => ({
			symbol: "BTC/USD",
			startTime: Date.now() - 10_000,
			stages: [],
			scenarioId: "test",
			totalSteps: 1,
			status: "SCHEDULED",
		} as Scenario);

		await scheduler["scanAllSymbols"]();
		expect(started.length).toBe(1);
	});

  it("should clear previous timer when updating", async () => {
		const tenSecLater = Date.now() + 10_000;
		repo.getSoonestScenarioForSymbol = async () => ({
			symbol: "BTC/USD",
			startTime: tenSecLater,
			stages: [],
			scenarioId: "test",
			totalSteps: 1,
			status: "SCHEDULED",
		} as Scenario);

		await scheduler.updateForSymbol("BTC/USD");
		await scheduler.updateForSymbol("BTC/USD");
		expect(scheduler.getScheduledSymbols()).toContain("BTC/USD");
	});

  it("should stop and clear all timers when stop is called", async () => {
		await scheduler.init();
		scheduler.stop();
		expect(scheduler.getScheduledSymbols().length).toBe(0);
		expect(scheduler.isScanning()).toBe(false);
	});

  it("should set a timeout for delayed scenarios", async () => {
		const tenSecLater = Date.now() + 10_000;
		repo.getSoonestScenarioForSymbol = async () => ({
			symbol: "BTC/USD",
			startTime: tenSecLater,
			stages: [],
			scenarioId: "test",
			totalSteps: 1,
			status: "SCHEDULED",
		} as Scenario);

		await scheduler.updateForSymbol("BTC/USD");
		expect(scheduler.getScheduledSymbols()).toContain("BTC/USD");
	});

  it("should clear previous timer when updating", async () => {
		const tenSecLater = Date.now() + 10_000;
		repo.getSoonestScenarioForSymbol = async () => ({
			symbol: "BTC/USD",
			startTime: tenSecLater,
			stages: [],
			scenarioId: "test",
			totalSteps: 1,
			status: "SCHEDULED",
		} as Scenario);

		await scheduler.updateForSymbol("BTC/USD");
		await scheduler.updateForSymbol("BTC/USD");
		expect(scheduler.getScheduledSymbols()).toContain("BTC/USD");
	});

  it("should handle multiple scenarios at once", async () => {
		repo.getUpcomingSymbols = async () => ["BTC/USD", "ETH/USD"];
		const tenSecBefore = Date.now() - 10_000;
		const tenSecLater = Date.now() + 10_000;
		let call = 0;
		repo.getSoonestScenarioForSymbol = async () => {
			call += 1;
			return call === 1
				? ({
						symbol: "BTC/USD",
						startTime: tenSecBefore,
						stages: [],
						scenarioId: "test-btc",
						totalSteps: 1,
						status: "SCHEDULED",
					} as Scenario)
				: ({
						symbol: "ETH/USD",
						startTime: tenSecLater,
						stages: [],
						scenarioId: "test-eth",
						totalSteps: 1,
						status: "SCHEDULED",
					} as Scenario);
		};

		await scheduler["scanAllSymbols"]();
		expect(started.length).toBe(1);
		expect(started[0].symbol).toBe("BTC/USD");
		expect(scheduler.getScheduledSymbols()).toContain("ETH/USD");
	});
});
