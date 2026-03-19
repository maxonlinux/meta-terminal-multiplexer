import { AppError } from "@/error.handler";
import { logger } from "@/shared/logger";
import { FastifyReply, FastifyRequest } from "fastify";

export async function adminAuthHook(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
  } catch (error) {
    logger.error("Error verifying JWT", { error });
    throw new AppError(401, "UNAUTHORIZED");
  }
}
