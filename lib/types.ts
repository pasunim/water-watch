export type StationStatus =
  | "normal"
  | "alert"
  | "critical"
  | "high"
  | "overflow"
  | "low"
  | "lowcritical"
  | "unknown";

export type RowKind = "water" | "dam" | "flow" | "rain" | "road";

export interface BaseRow {
  id: string;
  kind: RowKind;
  name: string;
  shortName?: string;
  area: string;
  province?: string;
  district?: string;
  river?: string;
  lat: number | null;
  lng: number | null;
  value: number | null;
  unit: string;
  observedAt: string | null;
  source: string;
  url: string;
  statusKey?: StationStatus;
  sourceStatus?: string;
  derivedStatus?: boolean;
  areaUnverified?: boolean;
  warning?: number | null;
  critical?: number | null;
  bank?: number | null;
  offline?: boolean;
  code?: string;
}

export interface DamRow extends BaseRow {
  kind: "dam";
  capacity: number | null;
  percent: number | null;
  inflow: number | null;
  released: number | null;
  reportDate?: string;
  damGroup?: "main" | "east" | "other";
}

export interface FlowRow extends BaseRow {
  kind: "flow";
  level: number | null;
}

export interface RainRow extends BaseRow {
  kind: "rain";
}

export interface WaterRow extends BaseRow {
  kind: "water";
  dataGroup: "bangkok" | "nonthaburi" | "regional";
}

export interface TunnelDirection {
  label: string;
  depth: number | null;
  floodStart: string | null;
  floodMax: number | null;
}

export interface RoadRow extends BaseRow {
  kind: "road";
  floodStart: string | null;
  floodMax: number | null;
  /** Newer BMA sensors only report 0/5/10/15/20 cm, so 20 means "20 or more". */
  stepped: boolean;
  tunnel?: TunnelDirection[];
}

export type AnyRow = WaterRow | DamRow | FlowRow | RainRow | RoadRow;

export interface GroupResponse {
  rows: AnyRow[];
  fetchedAt: string | null;
  stale?: boolean;
  error?: string;
  fallback?: boolean;
}
