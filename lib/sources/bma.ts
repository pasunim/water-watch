import type { StationStatus, WaterRow } from "../types";
import { bmaDistrictName, bmaProvince } from "../districts";
import { bmaTime, extractEmbeddedArray, fetchBmaHtml } from "./bmaPage";

const BMA_SUMMARY_URL = "https://weather.bangkok.go.th/water/summary";

interface BmaStation {
  water_id: number;
  water_code: string | null;
  water_name: string;
  water_shortname: string | null;
  river_name: string | null;
  district_id: number | null;
  latitude: number | null;
  longitude: number | null;
  warning: number | null;
  critical: number | null;
  left_bank: number | null;
  right_bank: number | null;
  wl_in: number | null;
  water_status_flood: number | null;
  site_timestamp: string | null;
  active: number;
}

function statusFromFlood(code: number | null): StationStatus | null {
  if (code === 1) return "normal";
  if (code === 2) return "alert";
  if (code === 3) return "critical";
  return null;
}

function deriveStatus(wl: number | null, warning: number | null, critical: number | null): StationStatus {
  if (wl === null) return "unknown";
  if (critical !== null && wl >= critical) return "critical";
  if (warning !== null && wl >= warning) return "alert";
  return "normal";
}

export async function fetchBmaStations(): Promise<WaterRow[]> {
  const html = await fetchBmaHtml(BMA_SUMMARY_URL, 30_000);
  const stations = extractEmbeddedArray<BmaStation>(html, "waterSummaryList = ");

  const rows: WaterRow[] = stations
    .filter((s) => s.active !== 0)
    .map((s) => {
      const status = statusFromFlood(s.water_status_flood) ?? deriveStatus(s.wl_in, s.warning, s.critical);
      const bank = s.right_bank ?? s.left_bank ?? null;
      const districtName = bmaDistrictName(s.district_id);
      return {
        id: `bkk-${s.water_id}`,
        kind: "water",
        dataGroup: "bangkok",
        name: s.water_name,
        shortName: s.water_shortname ?? s.water_name,
        area: districtName || "กรุงเทพมหานคร",
        province: bmaProvince(s.district_id),
        district: districtName,
        river: s.river_name ?? "",
        lat: s.latitude,
        lng: s.longitude,
        value: s.wl_in,
        unit: "ม.รทก.",
        observedAt: bmaTime(s.site_timestamp),
        source: "สำนักการระบายน้ำ กรุงเทพมหานคร",
        url: "https://weather.bangkok.go.th/water/summary",
        statusKey: status,
        warning: s.warning,
        critical: s.critical,
        bank,
        code: s.water_code ?? String(s.water_id),
      } satisfies WaterRow;
    });

  return rows;
}
