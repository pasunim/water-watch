import type { DamRow } from "../types";

const RID_DAM_URL = "https://app.rid.go.th/reservoir/api/dam/public";

interface RidDam {
  id: string;
  name: string;
  owner: string;
  capacity: number | null;
  storage: number | null;
  active_storage: number | null;
  dead_storage: number | null;
  volume: number | null;
  percent_storage: number | null;
  inflow: number | null;
  outflow: number | null;
}

interface RidRegion {
  region: string;
  dam: RidDam[];
}

interface RidResponse {
  document: string;
  date: string;
  total: number;
  data: RidRegion[];
}

// Coordinates + province/area for the dams featured on the dashboard (main Chao
// Phraya basin dams + eastern/Bang Pakong basin group). RID's public API does not
// return coordinates, so this seeds the map layer for the dams we surface.
const DAM_META: Record<
  string,
  { lat: number; lng: number; province: string; area: string; group: "main" | "east" }
> = {
  "200101": { lat: 17.2411, lng: 98.9461, province: "ตาก", area: "อ.สามเงา", group: "main" }, // ภูมิพล
  "200102": { lat: 17.7476, lng: 100.5455, province: "อุตรดิตถ์", area: "อ.ท่าปลา", group: "main" }, // สิริกิติ์
  "100107": { lat: 16.8871, lng: 100.7005, province: "พิษณุโลก", area: "อ.วัดโบสถ์", group: "main" }, // แควน้อยบำรุงแดน
  "100301": { lat: 14.8256, lng: 101.0072, province: "ลพบุรี", area: "อ.พัฒนานิคม", group: "main" }, // ป่าสักชลสิทธิ์
  "100501": { lat: 14.2077, lng: 101.3778, province: "นครนายก", area: "อ.เมืองนครนายก", group: "east" }, // ขุนด่านปราการชล
  "100502": { lat: 13.4111, lng: 101.7936, province: "ฉะเชิงเทรา", area: "อ.ท่าตะเกียบ", group: "east" }, // คลองสียัด
  "100514": { lat: 14.0442, lng: 101.6844, province: "ปราจีนบุรี", area: "อ.นาดี", group: "east" }, // นฤบดินทรจินดา
  "100503": { lat: 13.3167, lng: 101.1167, province: "ชลบุรี", area: "อ.ศรีราชา", group: "east" }, // บางพระ
  "100504": { lat: 12.9975, lng: 101.3392, province: "ระยอง", area: "อ.ปลวกแดง", group: "east" }, // หนองปลาไหล
  "100505": { lat: 12.8425, lng: 101.6183, province: "ระยอง", area: "อ.วังจันทร์", group: "east" }, // ประแสร์
};

const FEATURED_DAM_IDS = Object.keys(DAM_META);

export async function fetchRidDams(): Promise<DamRow[]> {
  const res = await fetch(RID_DAM_URL, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RID dam API HTTP ${res.status}`);
  const data: RidResponse = await res.json();

  const rows: DamRow[] = [];
  for (const region of data.data) {
    for (const dam of region.dam) {
      const meta = DAM_META[dam.id];
      if (!meta) continue;
      rows.push({
        id: `dam-${dam.id}`,
        kind: "dam",
        name: dam.name,
        area: meta.area,
        province: meta.province,
        lat: meta.lat,
        lng: meta.lng,
        value: dam.volume,
        unit: "ล้าน ลบ.ม.",
        observedAt: `${data.date}T00:00:00+07:00`,
        source: dam.owner === "การไฟฟ้า" ? "การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย ผ่านกรมชลประทาน" : "กรมชลประทาน",
        url: "https://app.rid.go.th/reservoir/",
        // RID's `storage` is normal retention capacity; `capacity` is the physical maximum.
        capacity: dam.storage,
        percent: dam.percent_storage,
        inflow: dam.inflow,
        released: dam.outflow,
        reportDate: data.date,
        damGroup: meta.group,
      } satisfies DamRow);
    }
  }
  return rows;
}

export { FEATURED_DAM_IDS };
