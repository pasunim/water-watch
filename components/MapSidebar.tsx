import { fmt, formatDate, signed } from "@/lib/format";
import type { AnyRow, StationStatus } from "@/lib/types";
import { rowStatus, STATUS_COLORS, STATUS_LABELS } from "@/lib/status";
import { rowColor, rowLabel, rowValueText } from "@/lib/display";

const WATER_KINDS: StationStatus[] = ["critical", "overflow", "alert", "high", "normal", "low", "lowcritical", "unknown"];

export function SummaryHeader({ label, count, total }: { label: string; count: number; total?: number }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[13px] text-ink-muted">{label}</span>
      <b className="num text-3xl font-semibold">
        {count}
        {total !== undefined && <small className="font-sans text-xs font-normal text-ink-muted"> / {total}</small>}
        <small className="ml-1 font-sans text-xs font-normal text-ink-muted">จุด</small>
      </b>
    </div>
  );
}

export function StackBar({ parts }: { parts: { key: string; color: string; count: number }[] }) {
  return (
    <div className="flex h-1.5 gap-[3px] overflow-hidden rounded-full">
      {parts.map((p) => (
        <i key={p.key} style={{ background: p.color, flex: p.count, minWidth: p.count ? 3 : 0 }} />
      ))}
    </div>
  );
}

export function MapSummary({
  points,
  layer,
  filter,
  onToggleFilter,
}: {
  points: AnyRow[];
  layer: string;
  filter: string;
  onToggleFilter: (status: string) => void;
}) {
  const counts = points.reduce<Record<string, number>>((acc, r) => {
    const s = rowStatus(r);
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const interactive = layer === "water";
  const kinds: StationStatus[] = interactive
    ? WATER_KINDS.filter((k) => counts[k] || filter === k)
    : (["normal", "unknown"] as StationStatus[]);
  const label = (k: StationStatus) => (!interactive && k === "normal" ? "มีข้อมูลล่าสุด" : STATUS_LABELS[k]);

  return (
    <div className="flex flex-col gap-4">
      <SummaryHeader label="จุดตรวจวัดในพื้นที่" count={points.length} />
      <StackBar parts={kinds.map((k) => ({ key: k, color: STATUS_COLORS[k], count: counts[k] ?? 0 }))} />
      {interactive && (
        <p className="text-xs text-ink-muted">{filter === "all" ? "แตะสถานะเพื่อกรองแผนที่และตาราง" : "แตะสถานะเดิมอีกครั้งเพื่อล้าง"}</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {kinds.map((k) => {
          const pressed = filter === k;
          const body = (
            <>
              <b className="num block text-xl font-semibold">{counts[k] ?? 0}</b>
              <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLORS[k] }} />
                {label(k)}
              </span>
            </>
          );
          return interactive ? (
            <button
              key={k}
              onClick={() => onToggleFilter(k)}
              aria-pressed={pressed}
              className={`rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                pressed ? "border-ink bg-ink text-white [&_span]:text-white/80" : "border-line bg-subtle hover:border-line-strong"
              }`}
            >
              {body}
            </button>
          ) : (
            <div key={k} className="rounded-2xl border border-line bg-subtle px-3 py-2.5">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StationDetail({ row, onClose }: { row: AnyRow | null; onClose: () => void }) {
  if (!row) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong p-4">
        <h3 className="text-sm font-medium">เลือกจุดที่อยากติดตาม</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">ชี้หรือแตะจุดบนแผนที่ เพื่อดูค่าและเวลาวัดล่าสุด</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug">{row.name}</h3>
          <p className="mt-0.5 text-xs text-ink-muted">{row.district || row.area}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted hover:text-ink"
          aria-label="ปิดรายละเอียด"
        >
          ×
        </button>
      </div>
      <div className="my-3 flex items-baseline gap-2">
        <span className="num text-4xl font-semibold" style={{ color: rowColor(row) }}>
          {rowValueText(row)}
        </span>
        <span className="text-xs text-ink-muted">{row.unit}</span>
      </div>
      <span className="inline-flex rounded-full px-3 py-1 text-xs font-medium text-white" style={{ background: rowColor(row) }}>
        {rowLabel(row)}
      </span>
      <dl className="mt-4 flex flex-col gap-1.5 text-xs text-ink-muted">
        <div>
          {row.kind === "dam" ? "วันที่รายงาน" : "เวลาวัด"} <b className="font-medium text-ink">{formatDate(row.observedAt, row.kind === "dam")}</b>
        </div>
        {row.kind === "water" && (
          <div>
            เกณฑ์เตือน <b className="num text-ink">{signed(row.warning)}</b> · วิกฤติ <b className="num text-ink">{signed(row.critical)}</b> ม.รทก.
          </div>
        )}
        {row.kind === "dam" && (
          <>
            <div>สัดส่วนน้ำ {fmt(row.percent)}% ของความจุปกติ</div>
            <div>
              น้ำเข้า {fmt(row.inflow)} · ระบาย {fmt(row.released)} ล้าน ลบ.ม./วัน
            </div>
          </>
        )}
        {row.kind === "road" && row.floodStart && (
          <div>
            เริ่มขัง {formatDate(row.floodStart)}
            {row.floodMax !== null && ` · สูงสุด ${fmt(row.floodMax, 1)} ซม.`}
          </div>
        )}
        {row.kind === "road" &&
          row.tunnel?.map((d) => (
            <div key={d.label}>
              {d.label}: <b className="num text-ink">{d.depth === null ? "—" : `${fmt(d.depth, 1)} ซม.`}</b>
            </div>
          ))}
        <div>{row.source}</div>
      </dl>
      <a href={row.url} target="_blank" rel="noopener noreferrer" className="link mt-3 inline-flex text-[13px] font-medium text-ink">
        ดูข้อมูลต้นทาง ↗
      </a>
    </div>
  );
}
