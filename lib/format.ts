export function fmt(v: number | null | undefined, digits = 2): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return v.toLocaleString("th-TH", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function signed(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return (v >= 0 ? "+" : "") + fmt(v);
}

export function formatDate(value: string | null | undefined, dayOnly = false): string {
  if (!value) return "ไม่ระบุเวลา";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "ไม่ระบุเวลา";
  const formatted = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(dayOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
  }).format(d);
  return formatted + (dayOnly ? "" : " น.");
}
