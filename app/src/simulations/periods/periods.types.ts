import { UUID } from "crypto";

export type Period = {
  scenario_id: UUID;
  symbol: string;
  start_time: number; // unix epoch (in sec)
  end_time: number; // unix epoch (in sec)
  tick_count: number;
};
