import { config } from "@/env.config";
import { logger } from "../logger";
import {
  CoreCandlesResponse,
  CoreLastCandleResponse,
  CorePriceResponse,
} from "./core.sdk.types";
import { buildQueryParams } from "./core.sdk.utils";

const isCorePriceResponse = (data: unknown): data is CorePriceResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    "value" in data &&
    typeof data.value === "number"
  );
};

const isCoreCandlesResponse = (data: unknown): data is CoreCandlesResponse => {
  return typeof data === "object" && Array.isArray(data);
};

const isCoreLastCandleResponse = (
  data: unknown
): data is CoreLastCandleResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    "open" in data &&
    "high" in data &&
    "low" in data &&
    "close" in data &&
    "volume" in data &&
    typeof data.open === "number" &&
    typeof data.high === "number" &&
    typeof data.low === "number" &&
    typeof data.close === "number" &&
    typeof data.volume === "number"
  );
};

export class CoreSDK {
  async price(symbol: string) {
    try {
      const params = buildQueryParams({
        symbol,
      });

      const res = await fetch(`${config.CORE_URL}/prices?` + params.toString());
      const data = await res.json();

      if (!res.ok || !isCorePriceResponse(data)) {
        throw data;
      }

      return data.value;
    } catch (error) {
      logger.error({ error }, "Error getting price from Core");
      return null;
    }
  }

  async candles(
    symbol: string,
    interval: number,
    outputsize: number = 50,
    before?: number
  ) {
    try {
      const params = buildQueryParams({
        interval,
        symbol,
        outputsize,
        before,
      });

      const res = await fetch(
        `${config.CORE_URL}/candles?` + params.toString()
      );

      const data = await res.json();

      if (!res.ok || !isCoreCandlesResponse(data)) {
        throw data;
      }

      return data;
    } catch (error) {
      logger.error({ error }, "Error getting candles from Core");
      return [];
    }
  }

  async lastCandle(symbol: string, interval: number) {
    try {
      const params = buildQueryParams({
        interval,
        symbol,
      });

      const res = await fetch(
        `${config.CORE_URL}/candles/last?` + params.toString()
      );

      const data = await res.json();

      if (!res.ok || !isCoreLastCandleResponse(data)) {
        throw data;
      }

      return data;
    } catch (error) {
      logger.error({ error }, "Error getting last candle from Core");
      return null;
    }
  }
}

export const sdk = new CoreSDK();
