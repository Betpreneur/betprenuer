import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = "Africa/Lagos";

export function formatKickoff(iso: string | number | null | undefined): string {
  if (!iso) return "–";
  
  // If it's already a formatted string (e.g., "18:00 WAT"), return as-is
  if (typeof iso === "string" && iso.includes("WAT")) {
    return iso;
  }
  
  let parsed: dayjs.Dayjs;
  
  // Handle numeric timestamps (seconds or milliseconds) or numeric strings
  const isNumeric = typeof iso === "number" || (typeof iso === "string" && /^\d+$/.test(iso));
  if (isNumeric) {
    const num = typeof iso === "string" ? parseInt(iso, 10) : iso;
    if (!isNaN(num)) {
      // If looks like seconds (10 digits), convert to ms
      const ts = num > 1e12 ? num : num * 1000;
      parsed = dayjs.utc(ts);
    } else {
      parsed = dayjs(num);
    }
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