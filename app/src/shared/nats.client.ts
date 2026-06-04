import { connect, JSONCodec, NatsConnection } from "nats";
import { logger } from "./logger";

const jc = JSONCodec();

export class NatsClient {
  private static instances = new Map<string, NatsClient>();
  private nc!: NatsConnection;
  private subscriptions = new Map<string, (data: unknown) => void>();

  private constructor(private url: string, private token: string) {}

  static async getInstance(url: string, token: string): Promise<NatsClient> {
    const existing = this.instances.get(url);
    if (existing && !existing.nc.isClosed()) return existing;

    const client = new NatsClient(url, token);
    await client.connect();
    this.instances.set(url, client);

    if (existing) {
      for (const [subject, handler] of existing.subscriptions) {
        client.subscriptions.set(subject, handler);
        client.startSubscription(subject, handler);
      }
    }

    return client;
  }

  private async connect() {
    this.nc = await connect({
      servers: this.url,
      token: this.token,
      maxReconnectAttempts: -1,
      reconnectDelayHandler: () => 2000,
    });

    logger.info({ url: this.url }, "NATS connected");

    (async () => {
      for await (const status of this.nc.status()) {
        logger.info({ url: this.url, status: status.type }, `NATS ${status.type}`);
      }
    })();
  }

  publish(subject: string, data: unknown) {
    this.nc.publish(subject, jc.encode(data));
  }

  subscribe(subject: string, handler: (data: unknown) => void) {
    this.subscriptions.set(subject, handler);
    this.startSubscription(subject, handler);
  }

  private startSubscription(subject: string, handler: (data: unknown) => void) {
    const sub = this.nc.subscribe(subject);

    (async () => {
      try {
        for await (const msg of sub) {
          try {
            handler(jc.decode(msg.data));
          } catch (err) {
            logger.error({ err, subject }, "NATS handler error");
          }
        }
      } catch (err) {
        logger.error({ err, subject }, "NATS subscription terminated");
      }
    })();
  }

  async disconnect() {
    this.subscriptions.clear();
    await this.nc.drain();
    logger.info({ url: this.url }, "NATS disconnected");
  }

  get connection() {
    return this.nc;
  }
}
