const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];
const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

// "3 hours ago". These read the clock, so with Cache Components call them only after `await connection()`.
export function timeAgo(date: Date): string {
  const elapsed = Date.now() - date.getTime();
  const [unit, ms] = UNITS.find(([, ms]) => elapsed >= ms) ?? UNITS[UNITS.length - 1];
  return relative.format(-Math.floor(elapsed / ms), unit);
}

export function minutesAgo(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60_000);
}

// "7 Oct"
export function formatDay(date: Date): string {
  return day.format(date);
}
