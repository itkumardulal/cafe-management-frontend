/** Must match backend `APP_TIMEZONE` — single business timezone for the app. */
export const APP_TIMEZONE = "Asia/Kathmandu";

type ZonedDateParts = {
  year: number;
  month: number;
  day: number;
};

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function getZonedDateParts(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): ZonedDateParts & { weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_MAP[get("weekday")] ?? 0,
  };
}

export function formatIsoDateInTimeZone(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): string {
  const { year, month, day } = getZonedDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dayKey(parts: ZonedDateParts): number {
  return parts.year * 10_000 + parts.month * 100 + parts.day;
}

export function addDaysToIsoDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
}

export function parseDateOnlyInTimeZone(
  isoDate: string,
  timeZone: string = APP_TIMEZONE,
): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    throw new Error(`Invalid date: ${isoDate}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = dayKey({ year, month, day });

  let low = Date.UTC(year, month - 1, day - 1, 0, 0, 0, 0);
  let high = Date.UTC(year, month - 1, day + 1, 23, 59, 59, 999);

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const current = dayKey(getZonedDateParts(new Date(mid), timeZone));
    if (current < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return new Date(low);
}

export function millisecondsUntilNextZonedMidnight(
  timeZone: string = APP_TIMEZONE,
  now: Date = new Date(),
): number {
  const tomorrowIso = addDaysToIsoDate(formatIsoDateInTimeZone(now, timeZone), 1);
  const nextMidnight = parseDateOnlyInTimeZone(tomorrowIso, timeZone);
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}
