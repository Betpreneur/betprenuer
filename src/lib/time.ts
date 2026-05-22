import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Africa/Lagos";

export function formatKickoff(iso: string | number | null | undefined): string {
  if (!iso) return "–";
  
  // If already looks like "01:00 PM WAT" or "19:45 WAT", return as-is
  if (typeof iso === "string" && (iso.includes("WAT") || iso.includes("PM") || iso.includes("AM"))) {
    return iso;
  }
  
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

export function shortDate(iso: string): string {
  return dayjs(iso).tz(TZ).format("DD MMM");
}