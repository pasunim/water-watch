import type { AnyRow, StationStatus } from "./types";

export const STATUS_LABELS: Record<StationStatus, string> = {
  normal: "ปกติ",
  alert: "เตือนภัย",
  critical: "วิกฤติ",
  high: "น้ำมาก",
  overflow: "น้ำล้นตลิ่ง",
  low: "น้ำน้อย",
  lowcritical: "น้ำน้อยวิกฤติ",
  unknown: "เก่า / ขัดข้อง / ไม่มีเกณฑ์",
};

export const STATUS_COLORS: Record<StationStatus, string> = {
  normal: "#168b78",
  alert: "#d39516",
  critical: "#d74754",
  high: "#287fb6",
  overflow: "#d74754",
  low: "#d39516",
  lowcritical: "#b4672b",
  unknown: "#84919b",
};

const STALE_MS: Record<AnyRow["kind"], number> = {
  water: 60 * 60000,
  flow: 180 * 60000,
  rain: 180 * 60000,
  dam: 2880 * 60000,
  road: 60 * 60000,
};

export function ageMs(row: Pick<AnyRow, "observedAt">): number {
  if (!row.observedAt) return Infinity;
  const t = Date.parse(row.observedAt);
  return Number.isFinite(t) ? Date.now() - t : Infinity;
}

export function isStale(row: AnyRow): boolean {
  const ms = ageMs(row);
  return ms < -600000 || ms > STALE_MS[row.kind];
}

export function rowStatus(row: AnyRow): StationStatus {
  if (row.offline || row.value === null || isStale(row)) return "unknown";
  if (row.kind === "water") return row.statusKey ?? "unknown";
  return "normal";
}
