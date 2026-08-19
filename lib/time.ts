export const APP_TIME_ZONE = "Asia/Jakarta";
export const APP_UTC_OFFSET = "+07:00";

export function jakartaLocalToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return new Date().toISOString();
  const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
  const parsed = new Date(`${withSeconds}${APP_UTC_OFFSET}`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Invalid date/time");
  return parsed.toISOString();
}

export function formatJakartaDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
