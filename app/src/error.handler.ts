import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { logger } from "@/shared/logger";

export class AppError extends Error {
  constructor(public statusCode: number, public message: string) {
    super(message);
  }
}

export const appErrorHandler = (
  err: FastifyError,
  req: FastifyRequest,
  reply: FastifyReply
) => {
  logger.error("Unhandled error", { err });
  if (err instanceof AppError) {
    return reply.status(err.statusCode).send({ error: err.message });
  }

  if (err.validation) {
    const statusCode = err.statusCode ?? 400;

    return reply.status(statusCode).send({ error: err.message });
  }

  reply.status(500).send({
    error: "Internal Server Error",
  });
};
