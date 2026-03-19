import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifySwagger from "@fastify/swagger";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import fastifyWebsocket from "@fastify/websocket";
import fastifyScalar from "@scalar/fastify-api-reference";
import Fastify from "fastify";
import { appErrorHandler } from "@/error.handler";
import swaggerConfig from "../swagger.config";
import adminRoutes from "./admin/admin.routes";
import candlesRoutes from "./candles/candles.routes";
import { config } from "./env.config";
import { multiplexerService } from "./multiplexer/multiplexer.service";
import { PriceSource } from "./multiplexer/multiplexer.types";
import pricesRoutes from "./prices/prices.routes";
import { coreIngestor } from "./shared/core/core.ingestor";
import { simulationScheduler } from "./simulations/scheduler/scheduler.service";
import wsRoutes from "./ws/ws.routes";
import { NatsClient } from "./shared/nats.client";

export const COOKIE_TOKEN_NAME = "meta_multiplexer_token";

export const app = Fastify({
  ignoreTrailingSlash: true,
  logger: {
    level: process.env.LOG_LEVEL || "info",
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              ignore: "pid,hostname",
              translateTime: "HH:MM:ss Z",
            },
          }
        : undefined,
    redact: ["req.headers.authorization", "req.body.password"],
  },
});

// Type provider
app.withTypeProvider<TypeBoxTypeProvider>();

// Error handling
app.setErrorHandler(appErrorHandler);

app.register(fastifyCors);
app.register(fastifyWebsocket);
app.register(fastifyMultipart);
app.register(fastifySwagger, swaggerConfig);
app.register(fastifyScalar, {
  routePrefix: "/docs",
  configuration: {
    theme: "purple",
  },
});

app.register(fastifyCookie, {
  secret: config.COOKIE_SECRET,
  hook: "onRequest",
});

app.register(fastifyJwt, {
  secret: config.JWT_SECRET,
  cookie: {
    cookieName: COOKIE_TOKEN_NAME,
    signed: false,
  },
});

// Routes
app.register(pricesRoutes, { prefix: "/prices" });
app.register(candlesRoutes, { prefix: "/candles" });
app.register(adminRoutes, { prefix: "/admin" });
app.register(wsRoutes, { prefix: "/ws" });

app.get("/health", async () => {
  return { status: "ok" };
});

const handleNatsPriceUpdate = (message: unknown) => {
  if (!coreIngestor.isNatsPriceMessage(message)) {
    app.log.error({ message }, "Invalid NATS price message format!");
    return;
  }

  config.VERBOSE && app.log.debug({ message }, "Received price update");

  multiplexerService.updatePrice(
    message.symbol,
    message.price,
    PriceSource.REAL,
  );
};

let localNatsClient: NatsClient | null = null;

const start = async () => {
  try {
    // Init local NATS for publishing prices
    localNatsClient = await NatsClient.getInstance(
      config.NATS_PUBLISH_URL.toString(),
      config.NATS_PUBLISH_TOKEN
    );

    multiplexerService.setPricePublisher((symbol, price) => {
      localNatsClient?.publish(`prices.${symbol}`, {
        symbol,
        price,
        timestamp: Date.now(),
      });
    });

    // init simulations first so we dont accidentally receive real price from core when simulation should run
    await simulationScheduler.init();
    // assign onprice method
    coreIngestor.onprice = handleNatsPriceUpdate;
    // init core price updates
    await coreIngestor.init();
    // init multiplexer service
    multiplexerService.init();

    await app.ready();
    await app.listen({ port: config.PORT, host: "0.0.0.0" });
    app.log.info(`Server running on port ${config.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
