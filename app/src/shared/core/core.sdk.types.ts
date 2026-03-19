export type CoreCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type CorePrice = {
  symbol: string;
  timestamp: number;
  value: number;
  volume?: number;
};

export type CorePriceResponse = CorePrice;

export type CoreLastCandleResponse = CoreCandle;

export type CoreCandlesResponse = CoreCandle[];
