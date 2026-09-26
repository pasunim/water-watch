import type { FlowRow, RainRow, RoadRow, StationStatus, WaterRow } from "../types";

const BASE = "https://api-v3.thaiwater.net/api/v1/thaiwater30/public";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Referer: "https://www.thaiwater.net/",
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/${path}`, {
    headers: HEADERS,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ThaiWater ${path} HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

interface LocalizedText {
  th?: string;
  en?: string;
}

interface TwGeocode {
  province_name?: LocalizedText;
  amphoe_name?: LocalizedText;
  tumbon_name?: LocalizedText;
}

interface TwWaterLevelRow {
  id: number;
  waterlevel_datetime: string | null;
  waterlevel_msl: string | null;
  situation_level: number | null;
  station: {
    id: number;
    tele_station_name?: LocalizedText;
    tele_station_oldcode?: string | null;
    tele_station_lat: number | null;
    tele_station_long: number | null;
    left_bank: number | null;
    right_bank: number | null;
    min_bank: number | null;
    warning_level_m: number | null;
    critical_level_m: number | null;
  };
  geocode: TwGeocode;
  agency: { agency_name?: LocalizedText };
}

interface TwRainRow {
  id: number;
  rain_24h: number | null;
  rainfall_datetime: string | null;
  station: {
    id: number;
    tele_station_name?: LocalizedText;
    tele_station_lat: number | null;
    tele_station_long: number | null;
  };
  geocode: TwGeocode;
  agency: { agency_name?: LocalizedText };
}

interface TwFlowRow {
  flow_datetime: string | null;
  flow_value: number | null;
  station: {
    id: number;
    flow_name?: LocalizedText;
    flow_lat: number | null;
    flow_long: number | null;
    flow_oldcode?: string | null;
  };
  geocode: TwGeocode;
  agency: { agency_name?: LocalizedText };
}

// situation_level buckets water level as % of bank height: 1 <10, 2 10–30, 3 30–70, 4 70–100, 5 >100.
function situationStatus(level: number | null): StationStatus {
  switch (level) {
    case 1:
      return "lowcritical";
    case 2:
      return "low";
    case 3:
      return "normal";
    case 4:
      return "high";
    case 5:
      return "overflow";
    default:
      return "unknown";
  }
}

function toIso(datetime: string | null): string | null {
  if (!datetime) return null;
  return datetime.replace(" ", "T") + "+07:00";
}

export async function fetchThaiWaterLevels(): Promise<WaterRow[]> {
  const data = await getJson<{ waterlevel_data: { data: TwWaterLevelRow[] } }>("waterlevel_load");
  const rows = data.waterlevel_data?.data ?? [];
  return rows
    .filter((r) => r.station?.tele_station_lat && r.station?.tele_station_long)
    .map((r) => {
      const value = r.waterlevel_msl !== null ? Number(r.waterlevel_msl) : null;
      const province = r.geocode?.province_name?.th ?? "";
      return {
        id: `tw-wl-${r.id}`,
        kind: "water",
        dataGroup: "regional",
        name: r.station.tele_station_name?.th ?? `สถานี ${r.station.id}`,
        shortName: r.station.tele_station_name?.th,
        area: r.geocode?.amphoe_name?.th ?? province,
        province,
        district: r.geocode?.amphoe_name?.th ?? "",
        lat: r.station.tele_station_lat,
        lng: r.station.tele_station_long,
        value,
        unit: "ม.รทก.",
        observedAt: toIso(r.waterlevel_datetime),
        source: "ThaiWater (กรมชลประทาน และหน่วยงานร่วม)",
        url: "https://www.thaiwater.net/water/waterlevel",
        statusKey: situationStatus(r.situation_level),
        warning: r.station.warning_level_m,
        critical: r.station.critical_level_m,
        bank: r.station.right_bank ?? r.station.left_bank ?? r.station.min_bank ?? null,
        code: r.station.tele_station_oldcode ?? String(r.station.id),
      } satisfies WaterRow;
    });
}

export async function fetchThaiWaterRain(): Promise<RainRow[]> {
  const data = await getJson<{ data: TwRainRow[] }>("rain_24h");
  const rows = data.data ?? [];
  return rows
    .filter((r) => r.station?.tele_station_lat && r.station?.tele_station_long)
    .map((r) => {
      const province = r.geocode?.province_name?.th ?? "";
      return {
        id: `tw-rain-${r.id}`,
        kind: "rain",
        name: r.station.tele_station_name?.th ?? `สถานีฝน ${r.station.id}`,
        area: r.geocode?.amphoe_name?.th ?? province,
        province,
        district: r.geocode?.amphoe_name?.th ?? "",
        lat: r.station.tele_station_lat,
        lng: r.station.tele_station_long,
        value: r.rain_24h,
        unit: "มม.",
        observedAt: toIso(r.rainfall_datetime),
        source: r.agency?.agency_name?.th ?? "ThaiWater",
        url: "https://www.thaiwater.net/water/rainfall",
      } satisfies RainRow;
    });
}

export async function fetchThaiWaterFlow(): Promise<FlowRow[]> {
  const data = await getJson<{ data: TwFlowRow[] }>("flow");
  const rows = data.data ?? [];
  return rows
    .filter((r) => r.station?.flow_lat && r.station?.flow_long)
    .map((r) => {
      const province = r.geocode?.province_name?.th ?? "";
      return {
        id: `tw-flow-${r.station.id}`,
        kind: "flow",
        name: r.station.flow_name?.th ?? `สถานีน้ำไหลผ่าน ${r.station.id}`,
        area: r.geocode?.amphoe_name?.th ?? province,
        province,
        district: r.geocode?.amphoe_name?.th ?? "",
        lat: r.station.flow_lat,
        lng: r.station.flow_long,
        value: r.flow_value,
        unit: "ลบ.ม./วินาที",
        observedAt: toIso(r.flow_datetime),
        source: r.agency?.agency_name?.th ?? "ThaiWater",
        url: "https://www.thaiwater.net/water/waterlevel",
        level: null,
        code: r.station.flow_oldcode ?? String(r.station.id),
      } satisfies FlowRow;
    });
}

interface TwFloodRoadRow {
  floodroad_datetime: string | null;
  floodroad_value: number | null;
  station: {
    id: number;
    floodroad_name?: LocalizedText;
    floodroad_lat: number | null;
    floodroad_long: number | null;
    floodroad_oldcode?: string | null;
  };
  geocode: TwGeocode;
}

export async function fetchThaiWaterFloodRoad(): Promise<RoadRow[]> {
  const data = await getJson<{ data: TwFloodRoadRow[] }>("flood_road");
  return (data.data ?? [])
    .filter((r) => r.station?.floodroad_lat && r.station?.floodroad_long)
    .map((r) => {
      const district = r.geocode?.amphoe_name?.th ?? "";
      return {
        id: `road-${r.station.floodroad_oldcode ?? r.station.id}`,
        kind: "road",
        name: r.station.floodroad_name?.th?.trim() ?? `จุดวัดน้ำท่วมถนน ${r.station.id}`,
        area: district,
        province: r.geocode?.province_name?.th ?? "กรุงเทพมหานคร",
        district,
        lat: r.station.floodroad_lat,
        lng: r.station.floodroad_long,
        value: r.floodroad_value,
        unit: "ซม.",
        observedAt: toIso(r.floodroad_datetime),
        source: "สำนักการระบายน้ำ กทม. ผ่าน ThaiWater",
        url: "https://weather.bangkok.go.th/flood",
        code: r.station.floodroad_oldcode ?? String(r.station.id),
        floodStart: null,
        floodMax: null,
        stepped: false,
      } satisfies RoadRow;
    });
}
