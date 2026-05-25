import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Africa/Lagos";

export function formatKickoff(iso: string | number | null | undefined): string {
  if (!iso) return "–";
  
  let parsed: dayjs.Dayjs;
  
  // Handle numeric timestamps (seconds or milliseconds)
  if (typeof iso === "number") {
    // If looks like seconds (10 digits), multiply by 1000
    const ts = iso > 1e12 ? iso : iso * 1000;
    parsed = dayjs.utc(ts);
  } else {
    // Try parsing as UTC first, then local
    parsed = dayjs.utc(iso);
    
    // If not valid, try regular parsing
    if (!parsed.isValid()) {
      parsed = dayjs(iso);
    }
  }
  
  // If still invalid, return error state
  if (!parsed.isValid()) {
    return "–";
  }
  
  // Convert from UTC to Lagos timezone
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