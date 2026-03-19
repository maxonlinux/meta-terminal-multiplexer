import {
  configure,
  getConsoleSink,
  getJsonLinesFormatter,
  getLogger,
} from "@logtape/logtape";
import { getPrettyFormatter } from "@logtape/pretty";
import { config } from "@/env.config";

// logger is the single shared logger for the multiplexer service.
export const logger = getLogger("multiplexer");

// initLogging configures Logtape to emit consistent JSON lines in containers.
export async function initLogging() {
  const usePretty =
    config.NODE_ENV === "development" && Boolean(process.stdout.isTTY);
  const formatter = usePretty
    ? getPrettyFormatter({ properties: true })
    : getJsonLinesFormatter();
  await configure({
    sinks: { console: getConsoleSink({ formatter }) },
    loggers: [
      {
        category: ["logtape", "meta"],
        lowestLevel: "warning",
        sinks: ["console"],
      },
      {
        category: ["fastify"],
        lowestLevel: normalizeLevel(config.LOG_LEVEL),
        sinks: ["console"],
      },
      {
        category: "multiplexer",
        lowestLevel: normalizeLevel(config.LOG_LEVEL),
        sinks: ["console"],
      },
    ],
  });
}

// normalizeLevel maps legacy env values to Logtape levels.
function normalizeLevel(level: string) {
  const lowered = level.toLowerCase();
  if (lowered === "warn") {
    return "warning";
  }
  return lowered;
}
