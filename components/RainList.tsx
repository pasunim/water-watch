import { fmt, formatDate } from "@/lib/format";
import type { RainRow } from "@/lib/types";
import { isStale } from "@/lib/status";

export function RainList({ rows, onSelect }: { rows: RainRow[]; onSelect: (row: RainRow) => void }) {
  const top = rows
    .filter((r) => r.value !== null && !isStale(r))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, 5);
  if (!top.length) {
    return <p className="text-sm text-ink-muted">ยังไม่มีข้อมูลฝนที่สดพอสำหรับจัดอันดับในพื้นที่นี้</p>;
  }
  const max = top[0].value || 1;
  return (
    <ol className="flex flex-col gap-4">
      {top.map((r, i) => (
        <li key={r.id} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <span className="num mr-2 text-xs text-ink-muted">{String(i + 1).padStart(2, "0")}</span>
              <button className="link text-left text-sm font-medium" onClick={() => onSelect(r)}>
                {r.name}
              </button>
              <p className="text-xs text-ink-muted">
                {r.area} · {formatDate(r.observedAt)}
              </p>
            </div>
            <b className="num whitespace-nowrap text-xl font-semibold">
              {fmt(r.value, 1)} <small className="font-sans text-xs font-normal text-ink-muted">มม.</small>
            </b>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[#efebe3]">
            <span className="block h-full rounded-full bg-[#287fb6]" style={{ width: `${((r.value ?? 0) / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}
