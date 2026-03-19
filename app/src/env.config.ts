import { bool, cleanEnv, num, str, url } from "envalid";
import "dotenv/config";

export const config = cleanEnv(process.env, {
  PORT: num({ example: "3100" }),

  JWT_SECRET: str({ example: "xxxxxxxxxxxxxxxxxxxxxxxx" }),
  COOKIE_SECRET: str({ example: "xxxxxxxxxxxxxxxxxxxxxxxx" }),

  CORE_URL: url({ example: "http://localhost:3100" }),

  NATS_SUBSCRIBE_TOKEN: str({ example: "xxxxxxxxxxxxxxxxxxxxxxxx" }),
  NATS_SUBSCRIBE_URL: url({ example: "nats://localhost:4222" }),
  NATS_SUBSCRIBE_TOPIC: str({ example: "core.price" }),

  NATS_PUBLISH_TOKEN: str({ default: "" }),
  NATS_PUBLISH_URL: url({ example: "nats://localhost:4222" }),

  SIM_DB_PATH: str({ example: "./data/simulations.sqlite" }),

  CH_MIGRATIONS_HOST: url({ example: "http://localhost:8123" }),
  CH_MIGRATIONS_USER: str({ example: "default" }),
  CH_MIGRATIONS_PASSWORD: str({ example: "default" }),
  CH_MIGRATIONS_DB: str({ example: "local" }),
  CH_MIGRATIONS_HOME: str({ example: "./migrations/ch" }),

  VERBOSE: bool({
    default: false,
  }),

  LOG_LEVEL: str({
    choices: ["debug", "info", "warn", "error"],
    default: "info",
  }),

  NODE_ENV: str({
    choices: ["development", "test", "production", "staging"],
    default: "development",
  }),
});
