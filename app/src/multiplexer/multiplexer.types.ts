export const PriceSource = {
  REAL: "REAL",
  SIMULATED: "SIMULATED",
} as const;

export type PriceSource = keyof typeof PriceSource;
