import { fmt, formatDate } from "@/lib/format";
import type { DamRow } from "@/lib/types";

export function DamMeter({ percent }: { percent: number | null }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#efebe3]">
      <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }} />
    </div>
  );
}

export function DamList({ dams, onSelect }: { dams: DamRow[]; onSelect: (row: DamRow) => void }) {
  if (!dams.length) {
    return <p className="text-sm text-ink-muted">ยังไม่มีรายงานเขื่อนที่อ่านได้ ระบบจะลองใหม่อัตโนมัติ</p>;
  }
  return (
    <div className="flex flex-col divide-y divide-line">
      {dams.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-4">
            <button className="link text-left text-[15px] font-medium" onClick={() => onSelect(r)}>
              {r.name}
            </button>
            <span className="num text-xl font-semibold">{fmt(r.percent)}%</span>
          </div>
          <DamMeter percent={r.percent} />
          <div className="flex flex-wrap justify-between gap-3 text-xs text-ink-muted">
            <span>
              น้ำในอ่าง <b className="num font-semibold text-ink">{fmt(r.value)}</b> ล้าน ลบ.ม.
            </span>
            <span>
              รับได้อีก{" "}
              <b className="num font-semibold text-ink">{r.capacity !== null && r.value !== null ? fmt(r.capacity - r.value) : "—"}</b>
            </span>
          </div>
          <div className="text-xs text-ink-muted">รายงาน {formatDate(r.observedAt, true)}</div>
        </div>
      ))}
    </div>
  );
}
