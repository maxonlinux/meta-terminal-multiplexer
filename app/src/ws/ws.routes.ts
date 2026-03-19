import WebSocket from "ws";
import { logger } from "@/shared/logger";
import { FastifyInstance } from "fastify";
import { wsPricesService } from "./ws.prices.service";
import { wsCandlesService } from "./ws.candles.service";

const Actions = {
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
  RESET: "reset",
  HEARTBEAT: "heartbeat",
} as const;

const sendHeartbeat = (ws: WebSocket) =>
  ws.send(JSON.stringify({ event: Actions.HEARTBEAT }));

export default async function (app: FastifyInstance) {
  app.get("/prices", { websocket: true }, (ws, req) => {
    const LOGGER_PREFIX = "[Prices]";

    ws.on("message", (raw) => {
      const msg = raw.toString();

      logger.debug(`${LOGGER_PREFIX} message`, { message: msg });

      if (msg === "ping") {
        ws.send("pong");
        return;
      }

      try {
        const data = JSON.parse(msg);
        const assets = Array.isArray(data.assets) ? data.assets : [];

        switch (data.action) {
          case Actions.HEARTBEAT:
            sendHeartbeat(ws);
            break;
          case Actions.SUBSCRIBE:
            logger.debug(`${LOGGER_PREFIX} Subscribed`, { data: assets });
            wsPricesService.subscribe(ws, assets);
            break;
          case Actions.UNSUBSCRIBE:
            wsPricesService.unsubscribe(ws, assets);
            break;
          case Actions.RESET:
            wsPricesService.reset(ws);
            break;
          default:
            logger.warn(
              { action: data.action },
              `${LOGGER_PREFIX} Unknown action`
            );
        }
      } catch (err) {
        logger.warn(`${LOGGER_PREFIX} Invalid WS message`, { err });
      }
    });

    ws.on("close", () => wsPricesService.reset(ws));
  });

  app.get("/candles", { websocket: true }, (ws) => {
    const LOGGER_PREFIX = "[Candles]";

    ws.on("message", (raw) => {
      const msg = raw.toString();

      logger.debug(`${LOGGER_PREFIX} message`, { message: msg });

      if (msg === "ping") {
        ws.send("pong");
        return;
      }

      try {
        const data = JSON.parse(msg);
        const assets = Array.isArray(data.assets) ? data.assets : [];
        const interval = Number(data.interval);

        switch (data.action) {
          case Actions.HEARTBEAT:
            sendHeartbeat(ws);
            break;
          case Actions.SUBSCRIBE:
            logger.debug(`${LOGGER_PREFIX} Subscribed`, { data: assets });
            wsCandlesService.subscribe(ws, assets, interval);
            break;
          case Actions.UNSUBSCRIBE:
            wsCandlesService.unsubscribe(ws, assets, interval);
            break;
          case Actions.RESET:
            wsCandlesService.reset(ws);
            break;
          default:
            logger.warn(
              { action: data.action },
              `${LOGGER_PREFIX} Unknown action`
            );
        }
      } catch (err) {
        logger.warn(`${LOGGER_PREFIX} Invalid WS message`, { err });
      }
    });

    ws.on("close", () => wsCandlesService.reset(ws));
  });
}
