import { sdk } from "@/shared/core/core.sdk";
import { candlesRepo } from "@/simulations/candles/candles.repository";
import { Candle } from "@/simulations/candles/candles.types";
import { periodsRepository } from "@/simulations/periods/periods.repository";
import { scenariosService } from "@/simulations/scenarios/scenarios.service";
import { PriceSource } from "./multiplexer.types";
import { logger } from "@/shared/logger";
import { wsPricesService } from "@/ws/ws.prices.service";
import { wsCandlesService } from "@/ws/ws.candles.service";
import { dateToSeconds } from "@/utils";

class MultiplexerService {
  private static readonly LAST_CANDLE_CACHE_TTL_MS = 500;
  private static readonly LAST_CANDLE_CACHE_MAX_KEYS = 1000;

  private isReady: boolean;
  private resolveReady: () => void;
  private readyPromise: Promise<void>;

  private lastPrices: Map<string, number>; // symbol -> price
  private pricePublisher: ((symbol: string, price: number) => void) | null;
  private lastCandleCache: Map<
    string,
    {
      value: Candle | null;
      expiresAt: number;
    }
  >;
  private lastCandleInFlight: Map<string, Promise<Candle | null>>;

  constructor() {
    this.isReady = false;
    this.resolveReady = () => null;

    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = () => {
        this.isReady = true;
        resolve();
      };
    });

    this.lastPrices = new Map();
    this.pricePublisher = null;
    this.lastCandleCache = new Map();
    this.lastCandleInFlight = new Map();
  }

  async init() {
    this.resolveReady();
  }

  getIsReady() {
    return this.isReady;
  }

  private handleUpdate(symbol: string, price: number) {
    this.lastPrices.set(symbol, price);

    wsCandlesService.send(symbol);
    wsPricesService.send(symbol, price);
    this.pricePublisher?.(symbol, price);
  }

  setPricePublisher(handler: ((symbol: string, price: number) => void) | null) {
    this.pricePublisher = handler;
  }

  updatePrice = async (symbol: string, price: number, source: PriceSource) => {
    if (!this.isReady) {
      logger.warn("Failed to update price. Multiplexer not ready yet");
      return;
    }

    // Idempotency (prevent sending the same price for symbol)
    const prev = this.lastPrices.get(symbol);
    if (prev === price) return;

    if (source === PriceSource.SIMULATED) {
      this.handleUpdate(symbol, price);
      return;
    }

    const isSimulationRunning = scenariosService.isRunning(symbol);

    if (!isSimulationRunning) {
      this.handleUpdate(symbol, price);
    }
  };

  getPrice = async (symbol: string) => {
    await this.readyPromise;

    const price = this.lastPrices.get(symbol);
    if (price) return price;

    const corePrice = await sdk.price(symbol);
    if (!corePrice) return null;

    // Checking again before set to avoid any races
    const rechecked = this.lastPrices.get(symbol);
    if (rechecked) return rechecked;

    this.lastPrices.set(symbol, corePrice);

    return corePrice;
  };

  getCandles = async (
    symbol: string,
    interval = 60,
    outputsize = 50,
    before?: number
  ) => {
    await this.readyPromise;

    const getReal = sdk.candles;
    const getSim = candlesRepo.getSimCandles;
    const getPeriods = periodsRepository.getOverlappingPeriodsForSymbol;

    const [periods, real] = await Promise.all([
      getPeriods(symbol, interval, outputsize, before),
      getReal(symbol, interval, outputsize, before),
    ]);

    const isSimulationRunning = scenariosService.isRunning(symbol);

    // if no periods within interval and sim is not running for symbol -  it means there's no simulation
    // so we can return real and avoid extra queries
    if (!periods.length && !isSimulationRunning) {
      return real;
    }

    const activeScenario = scenariosService.getRunning(symbol)?.getScenario();

    const inForbidden = (t: number) =>
      periods.some((p) => p.start_time <= t && t <= p.end_time);

    const inActiveScenario = (t: number) => {
      if (!activeScenario) return false;
      return t >= dateToSeconds(activeScenario.startTime);
    };

    const realFiltered = real.filter(
      (c) => !inForbidden(c.time) && !inActiveScenario(c.time)
    );

    const simulated = await getSim(symbol, interval, outputsize, before);

    const merged = new Map<number, Candle>();
    for (const c of realFiltered) merged.set(c.time, c);
    for (const c of simulated) merged.set(c.time, c);

    return Array.from(merged.values())
      .sort((a, b) => b.time - a.time)
      .slice(0, outputsize);
  };

  private getLastCandleKey(symbol: string, interval: number) {
    return `${symbol}:${interval}`;
  }

  private getBucketStart(time: number, interval: number) {
    return Math.floor(time / interval) * interval;
  }

  private sameBucket(real: Candle, sim: Candle, interval: number) {
    return (
      this.getBucketStart(real.time, interval) ===
      this.getBucketStart(sim.time, interval)
    );
  }

  private mergeCandles(real: Candle, sim: Candle): Candle {
    return {
      time: real.time,
      open: sim.open,
      high: Math.max(real.high, sim.high),
      low: Math.min(real.low, sim.low),
      close: real.close,
      volume: real.volume,
    };
  }

  private getCachedLastCandle(key: string): Candle | null | undefined {
    const entry = this.lastCandleCache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.lastCandleCache.delete(key);
      return undefined;
    }

    this.lastCandleCache.delete(key);
    this.lastCandleCache.set(key, entry);
    return entry.value;
  }

  private setCachedLastCandle(key: string, value: Candle | null) {
    if (this.lastCandleCache.has(key)) {
      this.lastCandleCache.delete(key);
    }

    this.lastCandleCache.set(key, {
      value,
      expiresAt: Date.now() + MultiplexerService.LAST_CANDLE_CACHE_TTL_MS,
    });

    if (this.lastCandleCache.size <= MultiplexerService.LAST_CANDLE_CACHE_MAX_KEYS) {
      return;
    }

    const oldest = this.lastCandleCache.keys().next().value;
    if (oldest) {
      this.lastCandleCache.delete(oldest);
    }
  }

  private getMergedLastCandle = async (
    symbol: string,
    interval: number
  ): Promise<Candle | null> => {
    const key = this.getLastCandleKey(symbol, interval);

    const cached = this.getCachedLastCandle(key);
    if (cached !== undefined) {
      return cached;
    }

    const inFlight = this.lastCandleInFlight.get(key);
    if (inFlight) {
      return await inFlight;
    }

    const request = (async () => {
      const [real, sim] = await Promise.all([
        sdk.lastCandle(symbol, interval),
        candlesRepo.getLastSimCandle(symbol, interval),
      ]);

      if (!real) {
        this.setCachedLastCandle(key, sim);
        return sim;
      }

      if (!sim) {
        this.setCachedLastCandle(key, real);
        return real;
      }

      if (!this.sameBucket(real, sim, interval)) {
        this.setCachedLastCandle(key, real);
        return real;
      }

      const merged = this.mergeCandles(real, sim);
      this.setCachedLastCandle(key, merged);
      return merged;
    })();

    this.lastCandleInFlight.set(key, request);

    try {
      return await request;
    } finally {
      this.lastCandleInFlight.delete(key);
    }
  };

  getLastCandle = async (symbol: string, interval: number) => {
    await this.readyPromise;

    const isSimulationRunning = scenariosService.isRunning(symbol);

    if (isSimulationRunning) {
      return await candlesRepo.getLastSimCandle(symbol, interval);
    }

    return await this.getMergedLastCandle(symbol, interval);
  };
}

export const multiplexerService = new MultiplexerService();
