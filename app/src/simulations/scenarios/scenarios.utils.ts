import { Value } from "@sinclair/typebox/value";
import { AppError } from "@/error.handler";
import { ScenarioStagesSchema } from "./scenarios.schemas";
import { sdk } from "@/shared/core/core.sdk";
import { logger } from "@/shared/logger";
import { sleep } from "@/utils";
import { ScenarioStage, StageType } from "./scenarios.types";

/**
 * Parses and validates scenario stages from a JSON string or array.
 * returns NULL if invalid.
 */
export function parseStagesOrThrow(raw: string | unknown) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    const valid = Value.Check(ScenarioStagesSchema, parsed);

    if (!valid) {
      throw new AppError(400, "Stages validation failed");
    }

    const last = parsed[parsed.length - 1];

    if (last.type !== StageType.REVERT) {
      throw new AppError(400, "Scenario must end with a REVERT stage");
    }

    return parsed;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }

    throw new AppError(400, "Can't parse stages JSON");
  }
}

export const getRealPriceWithRetry = async (symbol: string) => {
  let price: number | null;

  for (let i = 0; i < 3; i++) {
    price = await sdk.price(symbol);

    if (price) return price;

    logger.warn("Price not available. Retrying in 3 sec...", { symbol });

    await sleep(3000);
  }
};

export const caclulateTotalSteps = (stages: ScenarioStage[]) =>
  stages.reduce((sum, stage) => sum + stage.duration, 0);
