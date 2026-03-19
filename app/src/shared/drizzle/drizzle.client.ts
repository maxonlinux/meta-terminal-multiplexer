import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { config } from "@/env.config";
import * as schema from "./drizzle.schema";

const dbDir = dirname(config.SIM_DB_PATH);
mkdirSync(dbDir, { recursive: true });
const sqlite = new Database(config.SIM_DB_PATH);

export const db = drizzle(sqlite, { schema });
