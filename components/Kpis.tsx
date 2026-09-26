import { fmt, formatDate, signed } from "@/lib/format";
import type { DamRow, FlowRow, RoadRow, WaterRow } from "@/lib/types";
import { rowStatus } from "@/lib/status";
import { roadSeverity } from "@/lib/roadFlood";

function Kpi({
  label,
  value,
  unit,
  foot,
  highlight,
}: {
  label: string;
  value: string;
  unit: string;
  foot: string;
  highlight?: boolean;
}) {
  return (
    <section className="surface-card flex min-w-0 flex-col gap-2 p-5 sm:p-6">
      <div className="text-[13px] font-medium text-ink-muted">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={`num text-[32px] font-semibold leading-none sm:text-[40px] ${highlight ? "text-accent" : "text-ink"}`}>{value}</span>
        <span className="text-xs text-ink-muted">{unit}</span>
      </div>
      <div className="text-xs leading-relaxed text-ink-muted">{foot}</div>
    </section>
  );
}

export function Kpis({
  waterRows,
  roadRows,
  mainDams,
  flowRow,
  pakklongRow,
}: {
  waterRows: WaterRow[];
  roadRows: RoadRow[];
  mainDams: DamRow[];
  flowRow: FlowRow | undefined;
  pakklongRow: WaterRow | undefined;
}) {
  const complete =
    mainDams.length === 4 &&
    mainDams.every((r) => r.value !== null && r.capacity !== null) &&
    new Set(mainDams.map((r) => r.reportDate)).size === 1;
  const storage = complete ? mainDams.reduce((s, r) => s + (r.value ?? 0), 0) : null;
  const capacity = complete ? mainDams.reduce((s, r) => s + (r.capacity ?? 0), 0) : null;
  const alerts = waterRows.filter((r) => ["alert", "critical", "high", "overflow", "lowcritical"].includes(rowStatus(r))).length;
  const roads = roadRows.filter((r) => !r.tunnel);
  const wetRoads = roads.filter((r) => ["severe", "moderate", "minor"].includes(roadSeverity(r))).length;
  const severeRoads = roads.filter((r) => roadSeverity(r) === "severe").length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Kpi
        label="ถนนมีน้ำขังตอนนี้"
        value={roads.length ? fmt(wetRoads, 0) : "—"}
        unit="จุด"
        foot={roads.length ? `หนัก 20 ซม.+ ${severeRoads} จุด · จากเซ็นเซอร์ ${roads.length} จุด` : "กำลังอ่านเซ็นเซอร์ถนน"}
        highlight={wetRoads > 0}
      />
      <Kpi
        label="สถานีเฝ้าระวัง / วิกฤติ"
        value={waterRows.length ? fmt(alerts, 0) : "—"}
        unit="สถานี"
        foot={waterRows.length ? `จากทั้งหมด ${waterRows.length} สถานี` : "รอข้อมูลต้นทาง"}
      />
      <Kpi
        label="เจ้าพระยา · ปากคลองตลาด"
        value={pakklongRow ? signed(pakklongRow.value) : "—"}
        unit="ม.รทก."
        foot={pakklongRow ? formatDate(pakklongRow.observedAt) : "รอข้อมูลต้นทาง"}
      />
      <Kpi
        label="พื้นที่รับน้ำได้อีก · 4 เขื่อนหลัก"
        value={complete && capacity !== null && storage !== null ? fmt(capacity - storage, 0) : "—"}
        unit="ล้าน ลบ.ม."
        foot={complete && mainDams[0] ? `อิงความจุปกติ · ${formatDate(mainDams[0].observedAt, true)}` : "รอรายงานครบ 4 เขื่อน"}
      />
      {flowRow && (
        <p className="col-span-2 text-xs text-ink-muted lg:col-span-4">
          น้ำไหลผ่านคลองสูงสุดใน กทม. ตอนนี้: <span className="font-medium text-ink">{flowRow.name}</span>{" "}
          <span className="num text-ink">{fmt(flowRow.value, 0)}</span> ลบ.ม./วินาที · {formatDate(flowRow.observedAt)}
        </p>
      )}
    </div>
  );
}
