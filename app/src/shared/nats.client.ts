import { connect, JSONCodec, NatsConnection } from "nats";
import { logger } from "./logger";

const jc = JSONCodec();

export class NatsClient {
  private static instances = new Map<string, NatsClient>();
  private nc!: NatsConnection;

  private constructor(private url: string, private token: string) {}

  static async getInstance(url: string, token: string): Promise<NatsClient> {
    if (!this.instances.has(url)) {
      const client = new NatsClient(url, token);
      await client.connect();
      this.instances.set(url, client);
    } else if (this.instances.get(url)!.nc.isClosed()) {
      await this.instances.get(url)!.connect();
    }
    return this.instances.get(url)!;
  }

  private async connect() {
    this.nc = await connect({ servers: this.url, token: this.token });
    logger.info(`NATS Connected to ${this.url}`);
  }

  publish(subject: string, data: unknown) {
    this.nc.publish(subject, jc.encode(data));
  }

  subscribe(subject: string, handler: (data: unknown) => void) {
    const sub = this.nc.subscribe(subject);
    (async () => {
      for await (const msg of sub) {
        handler(jc.decode(msg.data));
      }
    })();
  }

  async disconnect() {
    await this.nc.drain();
    logger.info("NATS Disconnected");
  }

  get connection() {
    return this.nc;
  }
}
