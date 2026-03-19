// Sleep func
export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// For SQL syntax highlight (sql`SOME SQL QUERY`)
export const sql = String.raw;

export const dateToSeconds = (date: Date | number | string): number => {
  const dateObj = new Date(date);
  return Math.floor(dateObj.getTime() / 1000);
};