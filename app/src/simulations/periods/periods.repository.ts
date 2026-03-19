import { clickhouse } from "@/shared/clickhouse.client";
import { dateToSeconds, sql } from "@/utils";
import { Period } from "./periods.types";

class PeriodsRepository {
  async getOverlappingPeriodsForSymbol(
    symbol: string,
    interval: number = 60,
    outputsize: number = 50,
    before?: number
  ) {
    const to = before ?? dateToSeconds(Date.now());
    const from = to - outputsize * interval;

    const result = await clickhouse.query({
      query: sql`
        SELECT 
          scenario_id,
          symbol,
          toUnixTimestamp(minMerge(start_time)) AS start_time,
          toUnixTimestamp(maxMerge(end_time)) AS end_time
        FROM sim_periods
        WHERE symbol = {symbol:String} 
        GROUP BY scenario_id, symbol
        HAVING start_time <= {to:UInt32} AND end_time >= {from:UInt32}
        ORDER BY start_time DESC
      `,
      format: "JSONEachRow",
      query_params: {
        symbol,
        from: from,
        to: to,
      },
    });

    const periods = await result.json<Period>();
    return periods;
  }

  async getPeriodById(periodId: string) {
    const res = await clickhouse.query({
      query: sql`
        SELECT 
            scenario_id,
            symbol,
            toUnixTimestamp(minMerge(start_time)) AS start_time,
            toUnixTimestamp(maxMerge(end_time)) AS end_time,
            toUInt32(countMerge(tick_count)) AS tick_count
          FROM sim_periods
          WHERE scenario_id = {periodId:String} 
          GROUP BY scenario_id, symbol
      `,
      query_params: { periodId },
      format: "JSONEachRow",
    });

    const [period] = await res.json<Period>();
    return period;
  }

  async deletePeriod(periodId: string) {
    await clickhouse.query({
      query: sql`
        ALTER TABLE sim_periods DELETE WHERE scenario_id = {periodId:String}
      `,
      query_params: { periodId },
    });
  }
}

export const periodsRepository = new PeriodsRepository();
