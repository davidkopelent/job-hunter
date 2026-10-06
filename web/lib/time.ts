const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];
const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

// "3 hours ago". Reads the clock, so with Cache Components call it only after `await connection()`.
export function timeAgo(date: Date): string {
  const elapsed = Date.now() - date.getTime();
  const [unit, ms] = UNITS.find(([, ms]) => elapsed >= ms) ?? UNITS[UNITS.length - 1];
  return format.format(-Math.floor(elapsed / ms), unit);
}
