import { UUID } from "crypto";
import { Period } from "../periods/periods.types";
import { ScenarioStageSchema } from "./scenarios.schemas";
import { simScenarios } from "@/shared/drizzle/drizzle.schema";
import { InferSelectModel } from "drizzle-orm";
import { Static } from "@sinclair/typebox";

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

export type ScenarioStage = Static<typeof ScenarioStageSchema>;

export type Scenario = InferSelectModel<typeof simScenarios>;

export type ScenarioWithPeriod = Scenario & {
  period: Period | null;
};

export type CreateScenarioInput = {
  symbol: string;
  startTime?: Date;
  stages: ScenarioStage[];
};

export type RescheduleScenarioInput = {
  scenarioId: UUID;
  startTime?: Date;
};
