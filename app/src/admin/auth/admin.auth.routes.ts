import { FastifyTypebox } from "@/types";
import { Type } from "@sinclair/typebox";
import {
  isPasswordSet,
  setPassword,
  verifyPassword,
} from "./admin.auth.service";
import { CookieSerializeOptions } from "@fastify/cookie";
import { AppError } from "@/error.handler";
import { COOKIE_TOKEN_NAME } from "@/index";

const COOKIE_OPTIONS: CookieSerializeOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export default async function authRoutes(app: FastifyTypebox) {
  app.get(
    "/status",
    {
      schema: {
        tags: ["Admin"],
        summary: "Check if password is set",
        response: {
          200: Type.Object({
            initialized: Type.Boolean(),
          }),
        },
      },
    },
    async (req, reply) => {
      const initialized = await isPasswordSet();

      reply.send({ initialized });
    }
  );

  app.post(
    "/setup",
    {
      schema: {
        tags: ["Admin"],
        summary: "Set password",
        body: Type.Object({
          password: Type.String({ minLength: 6 }),
        }),
      },
    },
    async (req, reply) => {
      const initialized = await isPasswordSet();

      if (initialized) {
        return reply.code(400).send({ error: "Already initialized" });
      }

      await setPassword(req.body.password);
      reply.send({ success: true });
    }
  );

  app.post(
    "/login",
    {
      schema: {
        tags: ["Admin"],
        summary: "Login",
        body: Type.Object({
          password: Type.String(),
        }),
        response: {
          200: Type.Object({ success: Type.Literal(true) }),
        },
      },
    },
    async (req, reply) => {
      if (!(await isPasswordSet())) {
        throw new AppError(400, "NOT_INITIALIZED");
      }

      const valid = await verifyPassword(req.body.password);

      if (!valid) {
        throw new AppError(401, "INVALID_PASSWORD");
      }

      const token = await reply.jwtSign({ role: "admin" }, { expiresIn: "1d" });

      reply
        .setCookie(COOKIE_TOKEN_NAME, token, COOKIE_OPTIONS)
        .send({ success: true });
    }
  );

  app.post(
    "/logout",
    {
      schema: {
        tags: ["Admin"],
        summary: "Logout",
        response: {
          200: Type.Object({ success: Type.Literal(true) }),
        },
      },
    },
    async (req, reply) => {
      reply
        .clearCookie(COOKIE_TOKEN_NAME, COOKIE_OPTIONS)
        .send({ success: true });
    }
  );
}
