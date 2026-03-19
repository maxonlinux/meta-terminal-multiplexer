export type AssetType =
  | "Agricultural Product"
  | "American Depositary Receipt"
  | "Bond"
  | "Bond Fund"
  | "Closed-end Fund"
  | "Common Stock"
  | "Depositary Receipt"
  | "Digital Currency"
  | "Energy Resource"
  | "ETF"
  | "Exchange-Traded Note"
  | "Global Depositary Receipt"
  | "Index"
  | "Industrial Metal"
  | "Limited Partnership"
  | "Livestock"
  | "Mutual Fund"
  | "Physical Currency"
  | "Precious Metal"
  | "Preferred Stock"
  | "REIT"
  | "Right"
  | "Structured Product"
  | "Trust"
  | "Unit"
  | "Warrant";

export interface AssetData {
  symbol: string;
  type: AssetType;
  exchange: string;
  description: string;
  tick_size: number | null;
  image_url?: string | null;
}

export interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  time: number;
}
