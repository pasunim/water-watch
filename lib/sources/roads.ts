import type { RoadRow, TunnelDirection } from "../types";
import { bmaTime, extractEmbeddedArray, fetchBmaHtml } from "./bmaPage";
import { fetchThaiWaterFloodRoad } from "./thaiwater";

const BMA_FLOOD_URL = "https://weather.bangkok.go.th/flood";

interface BmaFloodSensor {
  flood_id: number;
  flood_code: string | null;
  flood_name: string;
  road_name: string | null;
  flood: number | null;
  flood_start: string | null;
  flood_max: number | null;
  latitude: number | null;
  longitude: number | null;
  site_timestamp: string | null;
  web_url: string | null;
  flood_system_id: number | null;
}

interface BmaTunnelSub {
  tunnel_sub_station_code: string;
  flood: number | null;
  flood_start: string | null;
  flood_max: number | null;
  site_timestamp: string | null;
}

interface BmaTunnel {
  tunnel_id: number;
  tunnel_code: string;
  tunnel_name: string;
  road_name: string | null;
  latitude: number | null;
  longitude: number | null;
  direction_left: string | null;
  direction_right: string | null;
  listTunnelSubLastDetail: BmaTunnelSub[] | null;
}

// Only link out to https URLs from upstream so a tampered feed can't inject javascript: links.
function safeUrl(url: string | null): string {
  return url && /^https:\/\//i.test(url) ? url : BMA_FLOOD_URL;
}

function sensorRow(s: BmaFloodSensor): RoadRow {
  const flooding = (s.flood ?? 0) > 0;
  return {
    id: `road-${s.flood_code ?? s.flood_id}`,
    kind: "road",
    name: s.flood_name.replace(/\s*\*\s*$/, "").trim(),
    area: s.road_name ?? "",
    province: "กรุงเทพมหานคร",
    district: "",
    lat: s.latitude,
    lng: s.longitude,
    value: s.flood,
    unit: "ซม.",
    observedAt: bmaTime(s.site_timestamp),
    source: "สำนักการระบายน้ำ กรุงเทพมหานคร",
    url: safeUrl(s.web_url),
    code: s.flood_code ?? String(s.flood_id),
    floodStart: flooding ? bmaTime(s.flood_start) : null,
    floodMax: flooding ? s.flood_max : null,
    stepped: s.flood_system_id === 2,
  };
}

function tunnelRow(t: BmaTunnel): RoadRow {
  const subs = t.listTunnelSubLastDetail ?? [];
  const directions: TunnelDirection[] = subs.map((sub) => {
    const flooding = (sub.flood ?? 0) > 0;
    const side = sub.tunnel_sub_station_code === "IN" ? t.direction_left : t.direction_right;
    return {
      label: side ?? (sub.tunnel_sub_station_code === "IN" ? "ขาเข้า" : "ขาออก"),
      depth: sub.flood,
      floodStart: flooding ? bmaTime(sub.flood_start) : null,
      floodMax: flooding ? sub.flood_max : null,
    };
  });
  const depths = directions.map((d) => d.depth).filter((d): d is number => d !== null);
  const stamps = subs.map((s) => s.site_timestamp).filter((s): s is string => Boolean(s)).sort();
  const wet = directions.filter((d) => (d.depth ?? 0) > 0);
  return {
    id: `tunnel-${t.tunnel_code}`,
    kind: "road",
    name: t.tunnel_name,
    area: t.road_name?.trim() ?? "",
    province: "กรุงเทพมหานคร",
    district: "",
    lat: t.latitude,
    lng: t.longitude,
    value: depths.length ? Math.max(...depths) : null,
    unit: "ซม.",
    observedAt: bmaTime(stamps.at(-1)),
    source: "สำนักการระบายน้ำ กรุงเทพมหานคร",
    url: BMA_FLOOD_URL,
    code: t.tunnel_code,
    floodStart: wet.map((d) => d.floodStart).filter((s): s is string => Boolean(s)).sort()[0] ?? null,
    floodMax: wet.length ? Math.max(...wet.map((d) => d.floodMax ?? 0)) : null,
    stepped: false,
    tunnel: directions,
  };
}

async function fetchBmaRoadFlood(): Promise<RoadRow[]> {
  const html = await fetchBmaHtml(BMA_FLOOD_URL, 45_000);
  const sensors = extractEmbeddedArray<BmaFloodSensor>(html, "const floodData = ");
  const tunnels = extractEmbeddedArray<BmaTunnel>(html, "const tunnelData = ");
  return [...sensors.map(sensorRow), ...tunnels.map(tunnelRow)];
}

/**
 * BMA's flood page is the primary source (flood start/peak, underpasses) but is slow
 * and has no district field; ThaiWater mirrors the same sensors with districts, and
 * stands in on its own if BMA is down.
 */
export async function fetchRoadFlood(): Promise<RoadRow[]> {
  const [bma, tw] = await Promise.allSettled([fetchBmaRoadFlood(), fetchThaiWaterFloodRoad()]);
  const mirror = tw.status === "fulfilled" ? tw.value : [];

  if (bma.status === "rejected") {
    if (mirror.length) return mirror;
    throw bma.reason;
  }

  const byCode = new Map(mirror.map((r) => [r.code, r]));
  return bma.value.map((row) => {
    const match = byCode.get(row.code);
    if (!match) return row;
    return { ...row, district: match.district, province: match.province, area: match.district || row.area };
  });
}
