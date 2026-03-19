import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/shared/drizzle/drizzle.schema.ts",
  out: "./migrations/drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.SIM_DB_PATH ?? "./data/simulations.sqlite",
  },
});
