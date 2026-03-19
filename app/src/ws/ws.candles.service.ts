import { WebSocket } from "ws";
import { multiplexerService } from "@/multiplexer/multiplexer.service";

type CandleKey = `${string}:${number}`; // "BTCUSDT:60"

const EVENT_NAME = "candle";

class WsCandlesService {
  candleSubscribers = new Map<CandleKey, Set<WebSocket>>(); // "BTCUSDT:60" => Set of WS clients
  clientCandleSubscriptions = new WeakMap<WebSocket, Set<CandleKey>>();

  throttleMap = new Map<string, NodeJS.Timeout>();

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

  send = (symbol: string) => {
    for (const key of this.candleSubscribers.keys()) {
      if (!key.startsWith(symbol + ":")) continue;

      const [_, intervalStr] = key.split(":");
      const interval = Number(intervalStr);
      if (Number.isNaN(interval)) continue;

      const clients = this.candleSubscribers.get(key);
      if (!clients || clients.size === 0) continue;

      const handler = async () => {
        const candle = await multiplexerService.getLastCandle(symbol, interval);

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
      }
    }

    clientSubs.clear();
  };
}

export const wsCandlesService = new WsCandlesService();
