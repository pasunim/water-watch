import type { RoadRow } from "./types";
import { isStale } from "./status";
import { fmt } from "./format";

export type RoadSeverity = "severe" | "moderate" | "minor" | "dry" | "unknown";

export const ROAD_SEVERITIES: RoadSeverity[] = ["severe", "moderate", "minor", "dry", "unknown"];

export const ROAD_LABELS: Record<RoadSeverity, string> = {
  severe: "หนัก 20 ซม.+",
  moderate: "ปานกลาง 10–20 ซม.",
  minor: "เล็กน้อย ไม่ถึง 10 ซม.",
  dry: "ไม่มีน้ำขัง",
  unknown: "ไม่รายงาน / ข้อมูลเก่า",
};

export const ROAD_COLORS: Record<RoadSeverity, string> = {
  severe: "#a8203a",
  moderate: "#d74754",
  minor: "#d39516",
  dry: "#168b78",
  unknown: "#84919b",
};

export function roadSeverity(row: RoadRow): RoadSeverity {
  if (row.value === null || isStale(row)) return "unknown";
  if (row.value <= 0) return "dry";
  if (row.value < 10) return "minor";
  if (row.value < 20) return "moderate";
  return "severe";
}

export function roadDepthText(row: Pick<RoadRow, "value" | "stepped">): string {
  if (row.value === null) return "—";
  if (row.stepped && row.value >= 20) return "20+";
  return fmt(row.value, row.value % 1 === 0 ? 0 : 1);
}
