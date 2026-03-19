import { clickhouse } from "@/shared/clickhouse.client";
import { dateToSeconds } from "@/utils";

class TicksRepository {
  async insertTick({
    scenario_id,
    symbol,
    price,
  }: {
    scenario_id: string;
    symbol: string;
    price: number;
  }) {
    const now = dateToSeconds(Date.now());

    await clickhouse.insert({
      table: "sim_ticks",
      values: [
        {
          scenario_id,
          symbol,
          price,
          timestamp: now,
          volume: 0,
        },
      ],
      format: "JSONEachRow",
    });
  }
}

export const ticksRepository = new TicksRepository();
