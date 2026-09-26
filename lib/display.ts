import type { AnyRow } from "./types";
import { rowStatus, STATUS_COLORS, STATUS_LABELS } from "./status";
import { ROAD_COLORS, ROAD_LABELS, roadDepthText, roadSeverity } from "./roadFlood";
import { fmt, signed } from "./format";

export function rowColor(row: AnyRow): string {
  return row.kind === "road" ? ROAD_COLORS[roadSeverity(row)] : STATUS_COLORS[rowStatus(row)];
}

export function rowLabel(row: AnyRow): string {
  return row.kind === "road" ? ROAD_LABELS[roadSeverity(row)] : STATUS_LABELS[rowStatus(row)];
}

export function rowValueText(row: AnyRow): string {
  if (row.kind === "road") return roadDepthText(row);
  if (row.kind === "water") return signed(row.value);
  return fmt(row.value, row.kind === "rain" ? 1 : 2);
}

const ROAD_RADIUS = { severe: 10, moderate: 9, minor: 8, dry: 5, unknown: 5 } as const;

export function markerRadius(row: AnyRow): number {
  if (row.kind === "road") return ROAD_RADIUS[roadSeverity(row)];
  if (row.kind === "dam") return 9;
  return row.kind === "water" ? 6 : 7;
}

/** Draw order: flooded road sensors last so dry ones never cover them. */
export function drawOrder(row: AnyRow): number {
  return row.kind === "road" ? markerRadius(row) : 0;
}
