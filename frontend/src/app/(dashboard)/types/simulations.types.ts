import { UUID } from "crypto";
import { TimestampSec, DateISO } from "./common.types";

export const StageType = {
  TO_TARGET: "TO_TARGET",
  FLAT: "FLAT",
  REVERT: "REVERT",
} as const;

export const ScenarioStatus = {
  SCHEDULED: "SCHEDULED",
  ACTIVE: "ACTIVE",
  DONE: "DONE",
  CANCELLED: "CANCELLED",
} as const;

export type BaseStage = {
  id: UUID;
};

export type ToTargetStage = BaseStage & {
  type: typeof StageType.TO_TARGET;
  target: number;
  duration: number;
};

export type HoverStage = BaseStage & {
  type: typeof StageType.FLAT;
  range: number;
  duration: number;
};

export type RevertStage = BaseStage & {
  type: typeof StageType.REVERT;
  duration: number;
};

export type StageType = keyof typeof StageType;

export type ScenarioStatus = keyof typeof ScenarioStatus;

export type Stage = ToTargetStage | HoverStage | RevertStage;

export type Period = {
  scenario_id: UUID;
  symbol: string;
  start_time: TimestampSec;
  end_time: TimestampSec;
  tick_count: number;
};

export type Simulation = {
  scenarioId: UUID;
  symbol: string;
  status: ScenarioStatus;
  stages: Stage[];
  totalSteps: number;
  startTime: DateISO;
  createdAt: DateISO;
  period: Period | null;
};
