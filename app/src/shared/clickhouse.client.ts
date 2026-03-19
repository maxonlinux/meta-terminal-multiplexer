import { createClient } from "@clickhouse/client";
import { config } from "@/env.config";

export const sql = String.raw;

export const clickhouse = createClient({
  url: config.CH_MIGRATIONS_HOST,
  username: config.CH_MIGRATIONS_USER,
  password: config.CH_MIGRATIONS_PASSWORD,
  database: config.CH_MIGRATIONS_DB,
});
