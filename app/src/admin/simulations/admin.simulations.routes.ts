import {
  BadRequestResponse,
  FastifyTypebox,
  NotFoundResponse,
  ServerErrorResponse,
  SuccessResponse,
} from "../../types";
import { Type } from "@fastify/type-provider-typebox";
import { scenariosService } from "../../simulations/scenarios/scenarios.service";
import { scenariosRepository } from "@/simulations/scenarios/scenarios.repository";
import {
  ScenarioStagesSchema,
  StartTimeSchema,
} from "@/simulations/scenarios/scenarios.schemas";
import { UUID } from "crypto";
import { logger } from "@/shared/logger";

export default async function (app: FastifyTypebox) {
  app.get(
    "/",
    {
      schema: {
        tags: ["Simulations"],
        description: "Get all active simulations",
        querystring: Type.Object({
          status: Type.Optional(Type.String()), // can support filters if needed
        }),
        response: {
          200: SuccessResponse(Type.Array(Type.Any())), // Replace with exact shape if needed
          400: BadRequestResponse,
          404: NotFoundResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, reply) => {
      const simulations = await scenariosRepository.getAllScenarios();
      reply.send(simulations);
    },
  );

  app.post(
    "/",
    {
      schema: {
        tags: ["Simulations"],
        description: "Start a new simulation",
        body: Type.Object({
          symbol: Type.String(),
          startTime: StartTimeSchema,
          stages: ScenarioStagesSchema,
        }),
        response: {
          200: SuccessResponse(Type.Object({ message: Type.String() })),
          400: BadRequestResponse,
          201: SuccessResponse(Type.Object({ message: Type.String() })),
          500: ServerErrorResponse,
        },
      },
    },
    async (req, reply) => {
      const now = Date.now();
      const startTime = new Date(req.body.startTime ?? now);

      logger.info(
        {
          receivedStartTime: req.body.startTime,
          parsedStartTime: startTime.toISOString(),
          now: new Date(now).toISOString(),
          delay: startTime.getTime() - now,
        },
        "POST /simulations",
      );

      await scenariosService.createScenario({
        symbol: req.body.symbol,
        startTime: startTime,
        stages: req.body.stages,
      });

      reply.code(201).send({ message: "Simulation started" });
    },
  );

  app.patch(
    "/reschedule/:id",
    {
      schema: {
        tags: ["Simulations"],
        description: "Rschedule simulation",
        params: Type.Object({
          id: Type.String({ format: "uuid" }),
        }),
        body: Type.Object({
          startTime: StartTimeSchema,
        }),
        response: {
          200: SuccessResponse(Type.Object({ message: Type.String() })),
          400: BadRequestResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, reply) => {
      const now = Date.now();
      const startTime = new Date(req.body.startTime ?? now);

      await scenariosService.rescheduleScenario(
        req.params.id as UUID,
        startTime,
      );
      reply.send({ message: "Simulation rescheduled" });
    },
  );

  app.patch(
    "/abort/:id",
    {
      schema: {
        tags: ["Simulations"],
        description: "Abort running simulation",
        params: Type.Object({
          id: Type.String({ format: "uuid" }),
        }),

        response: {
          200: SuccessResponse(Type.Object({ message: Type.String() })),
          400: BadRequestResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, reply) => {
      const now = Date.now();
      const startTime = new Date(now);
      await scenariosService.rescheduleScenario(
        req.params.id as UUID,
        startTime,
      );

      await scenariosService.cancelRunningScenario(req.params.id as UUID);
      reply.send({ message: "Simulation aborted" });
    },
  );

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Simulations"],
        description: "DANGER! (TO DO) Delete a simulation by ID",
        params: Type.Object({ id: Type.String({ format: "uuid" }) }),
        response: {
          200: SuccessResponse(Type.Object({ message: Type.String() })),
          400: BadRequestResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, reply) => {
      await scenariosService.deleteScenario(req.params.id as UUID);
      reply.send({ message: "Simulation deleted" });
    },
  );
}
