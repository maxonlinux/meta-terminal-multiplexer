import { Type } from "@fastify/type-provider-typebox";
import {
  BadRequestResponse,
  FastifyTypebox,
  NotFoundResponse,
  ServerErrorResponse,
  SuccessResponse,
} from "@/types";
import { multiplexerService } from "@/multiplexer/multiplexer.service";

const CandleSchema = Type.Object({
  time: Type.Number(),
  open: Type.Number(),
  high: Type.Number(),
  low: Type.Number(),
  close: Type.Number(),
  volume: Type.Number(),
});

export default async function candlesRoutes(app: FastifyTypebox) {
  app.get(
    "/",
    {
      schema: {
        tags: ["Candles"],
        querystring: Type.Object({
          symbol: Type.String(),
          interval: Type.Number(),
          outputsize: Type.Optional(Type.Number({ default: 50 })),
          before: Type.Optional(Type.Number()),
        }),
        response: {
          200: SuccessResponse(Type.Array(CandleSchema)),
          400: BadRequestResponse,
          404: NotFoundResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, res) => {
      const { symbol, interval, outputsize, before } = req.query;

      const candles = await multiplexerService.getCandles(
        symbol,
        interval,
        outputsize,
        before
      );
      return res.send(candles);
    }
  );

  app.get(
    "/last",
    {
      schema: {
        tags: ["Candles"],
        querystring: Type.Object({
          symbol: Type.String(),
          interval: Type.Number(),
        }),
        response: {
          200: SuccessResponse(Type.Union([CandleSchema, Type.Null()])),
          400: BadRequestResponse,
          404: NotFoundResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, res) => {
      const { symbol, interval } = req.query;

      const candle = await multiplexerService.getLastCandle(symbol, interval);
      return res.send(candle);
    }
  );
}
