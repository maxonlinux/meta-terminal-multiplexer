import { WebSocket } from "ws";

const EVENT_NAME = "price";

class WsPricesService {
  private priceSubscribers = new Map<string, Set<WebSocket>>();
  private clientPriceSubscriptions = new WeakMap<WebSocket, Set<string>>();

  send = (symbol: string, price: number) => {
    const clients = this.priceSubscribers.get(symbol);
    if (!clients?.size) return;

    const msg = JSON.stringify({ event: EVENT_NAME, symbol, price });

    for (const client of clients) {
      client.send(msg);
    }
  };

  subscribe = (ws: WebSocket, symbols: string[]) => {
    const subs = this.clientPriceSubscriptions.get(ws) ?? new Set();
    this.clientPriceSubscriptions.set(ws, subs);

    for (const symbol of symbols) {
      const set = this.priceSubscribers.get(symbol) ?? new Set();
      this.priceSubscribers.set(symbol, set);
      set.add(ws);
      subs.add(symbol);
    }
  };

  unsubscribe = (ws: WebSocket, symbols: string[]) => {
    const subs = this.clientPriceSubscriptions.get(ws);
    if (!subs) return;

    for (const symbol of symbols) {
      subs.delete(symbol);
      const set = this.priceSubscribers.get(symbol);
      if (!set) continue;

      set.delete(ws);

      if (!set.size) {
        this.priceSubscribers.delete(symbol);
      }
    }
  };

  reset = (ws: WebSocket) => {
    const subs = this.clientPriceSubscriptions.get(ws);
    if (!subs) return;

    for (const symbol of subs) {
      const set = this.priceSubscribers.get(symbol);
      if (!set) continue;

      set.delete(ws);
      if (!set.size) {
        this.priceSubscribers.delete(symbol);
      }
    }
    subs.clear();
  };
}

export const wsPricesService = new WsPricesService();
