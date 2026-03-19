import { Candle } from "./candles.types";
import { sql } from "@/utils";
import { clickhouse } from "@/shared/clickhouse.client";

class CandlesRepository {
  getSimCandles = async (
    symbol: string,
    interval: number,
    outputsize: number = 50,
    before?: number
  ) => {
    const query = sql`
      SELECT
        symbol,
        toUnixTimestamp(toStartOfInterval(time, INTERVAL {interval:UInt32} SECOND)) AS time,
        argMinMerge(open) AS open,
        max(high) AS high,
        min(low) AS low,
        argMaxMerge(close) AS close,
        sum(volume) AS volume
      FROM sim_candles_1m
      WHERE symbol = {symbol:String}
        AND ({before:Nullable(UInt64)} IS NULL OR toUnixTimestamp(time) <= {before:Nullable(UInt64)})
      GROUP BY symbol, time
      ORDER BY time DESC
      LIMIT {outputsize:UInt32}
    `;

    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
      query_params: {
        symbol,
        interval,
        outputsize,
        before: before,
      },
    });

    const candles = await result.json<Candle>();

    return candles;
  };

  getLastSimCandle = async (symbol: string, interval: number) => {
    const [candles] = await this.getSimCandles(symbol, interval, 1);
    return candles;
  };
}

export const candlesRepo = new CandlesRepository();
