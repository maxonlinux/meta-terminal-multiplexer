"use server";

import { cleanEnv, str, url } from "envalid";

export const getEnv = async () =>
  cleanEnv(process.env, {
    CORE_URL: url({ example: "http://localhost:3100" }),
    MULTIPLEXER_URL: url({ example: "http://localhost:3101" }),
    ADMIN_BASE_PATH: str({ default: "" }),

    NODE_ENV: str({
      choices: ["development", "test", "production", "staging"],
      default: "development",
    }),
  });
