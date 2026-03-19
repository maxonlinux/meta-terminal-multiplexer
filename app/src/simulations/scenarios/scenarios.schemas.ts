import { Type } from "@sinclair/typebox";
import { StageType } from "./scenarios.types";

const ToTargetStageSchema = Type.Object({
  type: Type.Literal(StageType.TO_TARGET),
  target: Type.Number(),
  duration: Type.Integer({ minimum: 1 }),
});

const FlatStageSchema = Type.Object({
  type: Type.Literal(StageType.FLAT),
  range: Type.Number(),
  duration: Type.Integer({ minimum: 1 }),
});

const RevertStageSchema = Type.Object({
  type: Type.Literal(StageType.REVERT),
  duration: Type.Integer({ minimum: 1 }),
});

export const ScenarioStageSchema = Type.Union([
  ToTargetStageSchema,
  FlatStageSchema,
  RevertStageSchema,
]);

export const ScenarioStagesSchema = Type.Array(ScenarioStageSchema, {
  minItems: 1,
});

export const StartTimeSchema = Type.Optional(
  Type.Union([
    Type.String({
      description: "ISO 8601 date-time string",
      format: "iso-date-time",
    }),
    Type.Null(),
  ])
);
