import {
  ScenarioStage,
  ScenarioStatus,
} from "@/simulations/scenarios/scenarios.types";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const simScenarios = sqliteTable("sim_scenarios", {
  scenarioId: text("scenario_id").primaryKey(),
  symbol: text("symbol").notNull(),
  status: text("status").notNull().default(ScenarioStatus.SCHEDULED),
  stages: text("stages", { mode: "json" }).notNull().$type<ScenarioStage[]>(),
  totalSteps: integer("total_steps").notNull(),
  startTime: integer("start_time").notNull(),
  createdAt: integer("created_at").notNull(),
});
