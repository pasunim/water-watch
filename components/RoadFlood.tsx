import type { RoadRow } from "@/lib/types";
import { formatDate, fmt } from "@/lib/format";
import { ROAD_COLORS, ROAD_LABELS, ROAD_SEVERITIES, roadDepthText, roadSeverity, type RoadSeverity } from "@/lib/roadFlood";
import { StackBar, SummaryHeader } from "./MapSidebar";
import { Section, SourceNote } from "./Section";

const WET: RoadSeverity[] = ["severe", "moderate", "minor"];

function countBySeverity(rows: RoadRow[]) {
  return rows.reduce<Partial<Record<RoadSeverity, number>>>((acc, r) => {
    const s = roadSeverity(r);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
}

export function RoadSummary({ rows }: { rows: RoadRow[] }) {
  const counts = countBySeverity(rows);
  const wet = WET.reduce((n, s) => n + (counts[s] ?? 0), 0);
  return (
    <div className="flex flex-col gap-4">
      <SummaryHeader label="ถนนมีน้ำขังตอนนี้" count={wet} total={rows.length} />
      <StackBar parts={ROAD_SEVERITIES.map((s) => ({ key: s, color: ROAD_COLORS[s], count: counts[s] ?? 0 }))} />
      <div className="grid grid-cols-2 gap-2">
        {ROAD_SEVERITIES.map((s) => (
          <div key={s} className="rounded-2xl border border-line bg-subtle px-3 py-2.5">
            <b className="num block text-xl font-semibold">{counts[s] ?? 0}</b>
            <span className="flex items-center gap-1.5 text-xs text-ink-muted">
              <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: ROAD_COLORS[s] }} />
              {ROAD_LABELS[s]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadItem({ row, onSelect }: { row: RoadRow; onSelect: (row: RoadRow) => void }) {
  const color = ROAD_COLORS[roadSeverity(row)];
  return (
    <li className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
      <span className="h-10 w-1 shrink-0 self-center rounded-full" style={{ background: color }} aria-hidden />
      <div className="min-w-0 flex-1">
        <button className="link text-left text-[15px] font-medium" onClick={() => onSelect(row)}>
          {row.name}
        </button>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
          {row.district && `เขต${row.district} · `}
          {row.floodStart ? `ขังตั้งแต่ ${formatDate(row.floodStart)}` : `วัดเมื่อ ${formatDate(row.observedAt)}`}
          {row.floodMax !== null && ` · สูงสุด ${fmt(row.floodMax, 1)} ซม.`}
        </p>
      </div>
      <b className="num shrink-0 text-2xl font-semibold" style={{ color }}>
        {roadDepthText(row)}
        <small className="ml-1 font-sans text-xs font-normal text-ink-muted">ซม.</small>
      </b>
    </li>
  );
}

function TunnelCard({ row, onSelect }: { row: RoadRow; onSelect: (row: RoadRow) => void }) {
  const severity = roadSeverity(row);
  const badge = severity === "dry" ? "ผ่านได้" : severity === "unknown" ? "ไม่รายงาน" : "มีน้ำขัง";
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-line bg-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <button className="link text-left text-sm font-medium" onClick={() => onSelect(row)}>
          {row.name.replace(/^อุโมงค์ทางลอด/, "")}
        </button>
        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-white" style={{ background: ROAD_COLORS[severity] }}>
          {badge}
        </span>
      </div>
      <p className="text-xs text-ink-muted">{row.area}</p>
      <ul className="flex flex-col gap-1 text-xs">
        {(row.tunnel ?? []).map((d) => (
          <li key={d.label} className="flex justify-between gap-3">
            <span className="text-ink-muted">{d.label}</span>
            <b className={`num ${(d.depth ?? 0) > 0 ? "text-critical" : "text-ink"}`}>{d.depth === null ? "—" : `${fmt(d.depth, 1)} ซม.`}</b>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function RoadFloodSection({
  rows,
  totalSensors,
  onSelect,
}: {
  rows: RoadRow[];
  totalSensors: number;
  onSelect: (row: RoadRow) => void;
}) {
  const roads = rows.filter((r) => !r.tunnel);
  const tunnels = rows.filter((r) => r.tunnel);
  const wet = roads.filter((r) => WET.includes(roadSeverity(r))).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const silent = roads.filter((r) => roadSeverity(r) === "unknown").length;
  const counts = countBySeverity(roads);

  return (
    <Section
      id="roads"
      eyebrow="LIVE · น้ำท่วมถนน"
      title="เลี่ยงถนนที่มีน้ำขัง"
      description={`จากเซ็นเซอร์วัดน้ำบนถนนของ กทม. ${totalSensors} จุด อัปเดตทุก 5 นาที เรียงจากจุดที่ลึกที่สุด`}
      aside={
        <div className="flex flex-wrap gap-2">
          {WET.map((s) => (
            <span key={s} className="pill">
              <i className="h-2 w-2 rounded-full" style={{ background: ROAD_COLORS[s] }} />
              {ROAD_LABELS[s]} <b className="num text-ink">{counts[s] ?? 0}</b>
            </span>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="surface-card p-5 sm:p-7 lg:col-span-7">
          {rows.length === 0 ? (
            <p className="text-sm text-ink-muted">กำลังอ่านเซ็นเซอร์น้ำท่วมถนน… ครั้งแรกอาจใช้เวลาราว 30–50 วินาที</p>
          ) : wet.length === 0 ? (
            <p className="rounded-2xl bg-[#e8f5ef] px-4 py-3 text-sm text-[#247760]">ตอนนี้เซ็นเซอร์ในพื้นที่ที่เลือกไม่พบน้ำขังบนถนน</p>
          ) : (
            <ul className="max-h-[560px] divide-y divide-line overflow-y-auto pr-1">
              {wet.map((r) => (
                <RoadItem key={r.id} row={r} onSelect={onSelect} />
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="surface-card flex flex-col gap-4 p-5 sm:p-7">
            <h3 className="text-base font-semibold">อุโมงค์ทางลอด</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {tunnels.map((t) => (
                <TunnelCard key={t.id} row={t} onSelect={onSelect} />
              ))}
            </div>
          </div>
          <div className="rounded-[1.375rem] bg-accent-soft p-5 text-[13px] leading-relaxed text-[#8a3a1c]">
            เซ็นเซอร์วัดได้เฉพาะจุดที่ติดตั้ง ถนนที่ไม่มีเซ็นเซอร์อาจมีน้ำขังได้ เซ็นเซอร์รุ่นใหม่บางจุดรายงานเป็นขั้นละ 5 ซม. ค่า “20+”
            หมายถึงน้ำอาจลึกกว่า 20 ซม.
            {silent > 0 && ` · ขณะนี้มีเซ็นเซอร์ไม่รายงานหรือข้อมูลเก่า ${silent} จุด`}
          </div>
        </div>
      </div>
      <SourceNote>
        <a className="link" href="https://weather.bangkok.go.th/flood" target="_blank" rel="noopener noreferrer">
          ระบบตรวจวัดน้ำท่วมถนน สำนักการระบายน้ำ กทม. ↗
        </a>{" "}
        · ข้อมูลเขตจาก ThaiWater · ความลึกน้ำบนผิวถนน ไม่ใช่ระดับน้ำทะเล
      </SourceNote>
    </Section>
  );
}
