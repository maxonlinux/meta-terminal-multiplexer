import {
  CalendarDate,
  Time,
  toCalendarDateTime,
} from "@internationalized/date";

type ClassValue =
  | string
  | false
  | null
  | undefined
  | { [key: string]: boolean };

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function cls(...args: ClassValue[]): string {
  return args
    .flatMap((arg) => {
      if (!arg) return [];
      if (typeof arg === "string") return [arg];
      if (typeof arg === "object") {
        return Object.entries(arg)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");
}

export function remToPx(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

export function getIsoDate(date: CalendarDate | null, time: Time | null) {
  if (date && time) {
    const local = toCalendarDateTime(date, time);
    const isoLocal = local.toString();
    const iso = new Date(isoLocal).toISOString();
    return iso;
  }

  return null;
}
