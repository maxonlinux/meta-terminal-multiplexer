import { Type } from "@fastify/type-provider-typebox";
import {
  BadRequestResponse,
  FastifyTypebox,
  NotFoundResponse,
  ServerErrorResponse,
  SuccessResponse,
} from "@/types";
import { AppError } from "@/error.handler";
import { multiplexerService } from "@/multiplexer/multiplexer.service";

export default async function pricesRoutes(app: FastifyTypebox) {
  app.get(
    "/",
    {
      schema: {
        tags: ["Price"],
        description: "Get last real-time price for a symbol",
        querystring: Type.Object({
          symbol: Type.String(),
        }),
        response: {
          200: SuccessResponse(Type.Number()),
          400: BadRequestResponse,
          404: NotFoundResponse,
          500: ServerErrorResponse,
        },
      },
    },
    async (req, res) => {
      const { symbol } = req.query;

      const price = await multiplexerService.getPrice(symbol);

      if (!price) throw new AppError(404, "PRICE_NOT_FOUND");

      return res.send(price);
    }
  );
}
