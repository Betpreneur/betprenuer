import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Africa/Lagos";

export function formatKickoff(iso: string | number | null | undefined): string {
  if (!iso) return "–";
  
  // Handle numeric timestamps (milliseconds)
  let parsed = dayjs(iso);
  
  // If dayjs couldn't parse it, try parsing as a number
  if (!parsed.isValid() && typeof iso === "string") {
    const num = parseInt(iso, 10);
    if (!isNaN(num)) {
      parsed = dayjs(num);
    }
  }
  
  // If still invalid, return error state
  if (!parsed.isValid()) {
    return "–";
  }
  
  return parsed.tz(TZ).format("HH:mm") + " WAT";
}

export function formatLongDate(iso: string): string {
  return dayjs(iso).tz(TZ).format("dddd D MMMM");
}

export function todayLagos(): string {
  return dayjs().tz(TZ).format("dddd D MMMM");
}

/** Machine-sortable Lagos date (YYYY-MM-DD) — used to scope backed picks per day. */
export function todayLagosISO(): string {
  return dayjs().tz(TZ).format("YYYY-MM-DD");
}

/** Lagos date (YYYY-MM-DD) offset by a number of days. */
export function lagosDateISOOffset(daysAgo: number): string {
  return dayjs().tz(TZ).subtract(daysAgo, "day").format("YYYY-MM-DD");
}

export function shortDate(iso: string): string {
  return dayjs(iso).tz(TZ).format("DD MMM");
}