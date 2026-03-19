import { logger } from "@/shared/logger";
import { getRealPriceWithRetry } from "../scenarios/scenarios.utils";

const LOGGER_PREFIX = "[Simulations]";

// 1. Simulate price toward target with controlled randomness
export async function* simulateToTarget(params: {
  symbol: string;
  target: number;
  duration: number;
  startValue: number;
  signal: AbortSignal;
  skip: number;
}) {
  const LOGGER_CONTEXT = "[To Target]";
  const { symbol, target, duration, startValue, signal, skip } = params;

  const state = {
    value: startValue,
  };

  const lo0 = Math.min(startValue, target);
  const hi0 = Math.max(startValue, target);
  const range = hi0 - lo0;

  const step = (target - startValue) / Math.max(1, duration - 1);
  const volatility = Math.abs(target - startValue) / (duration / 55);

  const phase = Math.random() * Math.PI * 2;

  const reflectWithin = (x: number, low: number, high: number) => {
    const w = high - low;
    if (w <= 0) return low;
    const period = 2 * w;
    let y = x - low;
    y = ((y % period) + period) % period;
    return y <= w ? low + y : high - (y - w);
  };

  const computeValue = (i: number) => {
    // do not reflect first value
    if (i === 0) return startValue;
    // do not reflect last value
    if (i === duration - 1) return target;

    const t = i / (duration - 1);

    const baseMargin = range * 0.005;
    const wobble = range * 0.003 * Math.sin(2 * Math.PI * t + phase);
    const taper = 1 - Math.pow(t, 1.5);
    const margin = Math.max(0, baseMargin * taper + wobble);

    const low = lo0 + margin;
    const high = hi0 - margin;

    const progress = t;
    const rangeLimit = Math.abs(target - startValue) * (1 - progress) * 0.5;
    const randomStep = (Math.random() - 0.5) * volatility;

    const idealValue = startValue + step * i;
    const proposedCore = Math.max(
      idealValue - rangeLimit,
      Math.min(idealValue + rangeLimit, state.value + step + randomStep)
    );

    return reflectWithin(proposedCore, low, high);
  };

  for (let i = 0; i < duration; i++) {
    if (signal.aborted) return;
    if (i < skip) continue;

    const nextValue = computeValue(i);

    logger.info(
      `${LOGGER_PREFIX}${LOGGER_CONTEXT} Point ${
        i + 1
      }/${duration} = ${nextValue} to ${target}`
    );

    yield nextValue;
    state.value = nextValue;
  }

  logger.info(`${LOGGER_PREFIX}${LOGGER_CONTEXT} Finished for ${symbol}`);
}

// 2. Hover around a target value within a range
export async function* simulateFlat(params: {
  symbol: string;
  range: number;
  duration: number;
  startValue: number;
  signal: AbortSignal;
  skip: number;
}) {
  const LOGGER_CONTEXT = "[Flat]";

  const { symbol, signal, startValue, range, duration, skip } = params;

  // Shock chance 5%
  const shockChance = 0.05;
  const minOffset = range * 0.02; // защита от "упора в край"

  const state = {
    driftStrength: 1,
    current: startValue,
  };

  for (let i = 0; i < duration; i++) {
    if (signal.aborted) return;
    if (i < skip) continue;

    if (Math.random() < shockChance) {
      // ⚡ ШОК
      const direction = Math.random() < 0.5 ? -1 : 1;
      const targetShock = startValue + direction * (range - minOffset);
      const distance = Math.abs(targetShock - state.current);
      const shock = Math.random() * distance;

      state.current += direction * shock;

      // Зажимаем в диапазоне с небольшой защитой
      state.current = Math.max(
        startValue - range + minOffset,
        Math.min(startValue + range - minOffset, state.current)
      );

      // reset drift
      state.driftStrength = 1;

      logger.debug(
        `${LOGGER_PREFIX}${LOGGER_CONTEXT} ⚡ Shock! New price: ${state.current.toFixed(
          4
        )}`
      );
    } else {
      // ↔ Центростремительный дрейф
      const delta = startValue - state.current;

      const pullStrength = 0.03; // меньше притяжение к центру
      const noiseStrength = 0.2; // больше разброс

      const pull = delta * pullStrength;
      const noise =
        (Math.random() - 0.5) * range * noiseStrength * state.driftStrength;

      const drift = pull + noise;

      state.current += drift;

      // Зажимаем в пределах с небольшой безопасной зоной
      state.current = Math.max(
        startValue - range + minOffset,
        Math.min(startValue + range - minOffset, state.current)
      );

      state.driftStrength *= 0.95;
    }

    logger.info(
      `${LOGGER_PREFIX}${LOGGER_CONTEXT} Flat (${
        i + 1
      }/${duration}): ${state.current.toFixed(
        4
      )} around: ${startValue}, range: ${range}`
    );

    yield state.current;
  }

  logger.info(`${LOGGER_PREFIX}${LOGGER_CONTEXT} Finished for ${symbol}`);
}

// 3. Gradually revert simulated price to real price
export async function* simulateRevert(params: {
  symbol: string;
  duration: number;
  startValue: number;
  signal: AbortSignal;
  skip: number;
}) {
  const LOGGER_CONTEXT = "[Revert]";

  const { symbol, duration, startValue, signal, skip } = params;

  for (let i = 0; i < duration; i++) {
    if (signal.aborted) return;
    if (i < skip) continue;

    const real = await getRealPriceWithRetry(symbol);

    if (!real) {
      logger.warn(
        { symbol },
        `${LOGGER_PREFIX}${LOGGER_CONTEXT} ⚠️ Real price not available. Skipping step...`
      );

      break;
    }

    const progress = i / (duration - 1);
    const value = startValue + (real - startValue) * progress;

    logger.info(
      `${LOGGER_PREFIX}${LOGGER_CONTEXT} Step ${
        i + 1
      }/${duration}, value: ${value}, real: ${real}`
    );

    yield value;
  }

  logger.info(
    `${LOGGER_PREFIX}${LOGGER_CONTEXT} Finished reverting: ${symbol}`
  );
}
