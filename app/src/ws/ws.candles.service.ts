import { WebSocket } from "ws";
import { multiplexerService } from "@/multiplexer/multiplexer.service";
import { Candle } from "@/simulations/candles/candles.types";

type CandleKey = `${string}:${number}`; // "BTCUSDT:60"

const EVENT_NAME = "candle";

class WsCandlesService {
  candleSubscribers = new Map<CandleKey, Set<WebSocket>>(); // "BTCUSDT:60" => Set of WS clients
  clientCandleSubscriptions = new WeakMap<WebSocket, Set<CandleKey>>();

  throttleMap = new Map<string, NodeJS.Timeout>();
  private liveCandles = new Map<CandleKey, Candle>();
  private lastTouchedAt = new Map<CandleKey, number>();
  private readonly idleTtlMs = 5 * 60 * 1000;

  constructor() {
    setInterval(() => this.cleanupStale(), 60_000).unref();
  }

  // cleanupStale removes candle cache entries that no longer have subscribers
  // and stayed idle past TTL. This prevents long-lived memory growth from
  // stale symbol:interval keys after clients disconnect.
  private cleanupStale() {
    const now = Date.now();
    for (const [key, touchedAt] of this.lastTouchedAt) {
      const hasSubscribers = (this.candleSubscribers.get(key)?.size ?? 0) > 0;
      if (hasSubscribers) continue;
      if (now-touchedAt < this.idleTtlMs) continue;
      this.lastTouchedAt.delete(key);
      this.liveCandles.delete(key);
    }
  }

  private getBucketStart(time: number, interval: number) {
    return Math.floor(time / interval) * interval;
  }

  private async ensureSeededCandle(
    key: CandleKey,
    symbol: string,
    interval: number
  ): Promise<Candle | null> {
    const existing = this.liveCandles.get(key);
    if (existing) return existing;

    const seed = await multiplexerService.getLastCandle(symbol, interval);
    if (!seed) return null;

    this.liveCandles.set(key, seed);
    this.lastTouchedAt.set(key, Date.now());
    return seed;
  }

  private async advanceCandle(
    key: CandleKey,
    symbol: string,
    interval: number,
    price: number,
    nowSec: number
  ): Promise<Candle | null> {
    const bucketStart = this.getBucketStart(nowSec, interval);
    const state = await this.ensureSeededCandle(key, symbol, interval);

    if (!state) {
      const fresh: Candle = {
        time: bucketStart,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
      };
      this.liveCandles.set(key, fresh);
      this.lastTouchedAt.set(key, Date.now());
      return fresh;
    }

    const stateBucketStart = this.getBucketStart(state.time, interval);

    if (bucketStart === stateBucketStart) {
      const updated: Candle = {
        ...state,
        high: Math.max(state.high, price),
        low: Math.min(state.low, price),
        close: price,
      };
      this.liveCandles.set(key, updated);
      this.lastTouchedAt.set(key, Date.now());
      return updated;
    }

    const rolled: Candle = {
      time: bucketStart,
      open: state.close,
      high: Math.max(state.close, price),
      low: Math.min(state.close, price),
      close: price,
      volume: 0,
    };
    this.liveCandles.set(key, rolled);
    this.lastTouchedAt.set(key, Date.now());
    return rolled;
  }

  /**
   * Called when a price update is received for a symbol.
   * Will trigger batched candle fetches for each subscribed interval.
   */
  /**
   * Throttles execution of a callback per key.
   * Ensures that the callback is only triggered once per key per duration.
   */
  private withThrottle(
    key: string,
    delay: number,
    callback: () => void | Promise<void>
  ) {
    if (this.throttleMap.has(key)) return;

    const timeout = setTimeout(async () => {
      this.throttleMap.delete(key);
      await callback();
    }, delay);

    this.throttleMap.set(key, timeout);
  }

  send = (symbol: string, price: number) => {
    for (const key of this.candleSubscribers.keys()) {
      if (!key.startsWith(symbol + ":")) continue;

      const [_, intervalStr] = key.split(":");
      const interval = Number(intervalStr);
      if (Number.isNaN(interval)) continue;

      const clients = this.candleSubscribers.get(key);
      if (!clients || clients.size === 0) continue;

      const handler = async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        const candle = await this.advanceCandle(
          key as CandleKey,
          symbol,
          interval,
          price,
          nowSec
        );
        if (!candle) return;

        const message = JSON.stringify({
          event: EVENT_NAME,
          symbol,
          interval,
          ...candle,
        });

        for (const client of clients) {
          client.send(message);
        }
      };

      this.withThrottle(key, 100, handler);
    }
  };

  /**
   * Subscribe client to specific symbol + interval combinations.
   */
  subscribe = (ws: WebSocket, symbols: string[], interval: number) => {
    const clientSubs = this.clientCandleSubscriptions.get(ws) ?? new Set();
    this.clientCandleSubscriptions.set(ws, clientSubs);

    for (const symbol of symbols) {
      const key = `${symbol}:${interval}` as CandleKey;

      const clients = this.candleSubscribers.get(key) ?? new Set();
      this.candleSubscribers.set(key, clients);

      clients.add(ws);
      clientSubs.add(key);
      this.lastTouchedAt.set(key, Date.now());
    }
  };

  /**
   * Unsubscribe client from one or more symbol + interval combinations.
   */
  unsubscribe = (ws: WebSocket, symbols: string[], interval: number) => {
    const clientSubs = this.clientCandleSubscriptions.get(ws);
    if (!clientSubs) return;

    for (const symbol of symbols) {
      const key = `${symbol}:${interval}` as CandleKey;
      clientSubs.delete(key);

      const clients = this.candleSubscribers.get(key);
      if (!clients) continue;

      clients.delete(ws);
      if (clients.size === 0) {
        this.candleSubscribers.delete(key);
        this.lastTouchedAt.set(key, Date.now());
      }
    }
  };

  /**
   * Unsubscribe client from all their candle subscriptions.
   */
  reset = (ws: WebSocket) => {
    const clientSubs = this.clientCandleSubscriptions.get(ws);
    if (!clientSubs) return;

    for (const key of clientSubs) {
      const clients = this.candleSubscribers.get(key);
      if (!clients) continue;

      clients.delete(ws);
      if (clients.size === 0) {
        this.candleSubscribers.delete(key);
        this.lastTouchedAt.set(key, Date.now());
      }
    }

    clientSubs.clear();
  };
}

export const wsCandlesService = new WsCandlesService();
