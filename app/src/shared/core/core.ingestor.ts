import { logger } from "../logger";
import { NatsClient } from "../nats.client";
import { config } from "@/env.config";

export type PriceMessage = {
  symbol: string;
  price: number;
};

class CoreIngestor {
  nats: NatsClient | null;

  constructor() {
    this.nats = null;
  }

  isNatsPriceMessage = (message: unknown): message is PriceMessage =>
    typeof message === "object" &&
    message !== null &&
    "price" in message &&
    "symbol" in message &&
    typeof message.price === "number" &&
    !isNaN(message.price) &&
    typeof message.symbol === "string";

  async init() {
    this.nats = await NatsClient.getInstance(
      config.NATS_SUBSCRIBE_URL,
      config.NATS_SUBSCRIBE_TOKEN
    );

    this.nats.subscribe(config.NATS_SUBSCRIBE_TOPIC, this.onprice);
  }

  onprice(message: unknown) {
    logger.warn("Redeclare this method!", { message });
  }
}

export const coreIngestor = new CoreIngestor();
