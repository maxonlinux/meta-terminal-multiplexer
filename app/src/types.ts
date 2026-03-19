import {
  TSchema,
  Type,
  TypeBoxTypeProvider,
} from "@fastify/type-provider-typebox";
import {
  FastifyInstance,
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyBaseLogger,
} from "fastify";

export type FastifyTypebox = FastifyInstance<
  RawServerDefault,
  RawRequestDefaultExpression<RawServerDefault>,
  RawReplyDefaultExpression<RawServerDefault>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export const ErrorResponse = Type.Object({
  error: Type.String(),
});

export const BadRequestResponse = {
  description: "Bad Request",
  content: {
    "application/json": {
      schema: ErrorResponse,
    },
  },
};

export const NotFoundResponse = {
  description: "Not Found",
  content: {
    "application/json": {
      schema: ErrorResponse,
    },
  },
};

export const ServerErrorResponse = {
  description: "Internal Server Error",
  content: {
    "application/json": {
      schema: ErrorResponse,
    },
  },
};

export const SuccessResponse = <T extends TSchema>(schema: T) => ({
  description: "Success",
  content: {
    "application/json": {
      schema,
    },
  },
});
