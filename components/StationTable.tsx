import { formatDate, signed } from "@/lib/format";
import type { WaterRow } from "@/lib/types";
import { rowStatus, STATUS_COLORS } from "@/lib/status";
import { StatusBadge } from "./StatusBadge";

const HEADERS = ["สถานี", "เขต / พื้นที่", "ระดับน้ำ (ม.รทก.)", "สถานะ", "เวลาวัด"];

export function StationTable({ rows, onSelect }: { rows: WaterRow[]; onSelect: (row: WaterRow) => void }) {
  return (
    <div className="max-h-[460px] overflow-auto" tabIndex={0} role="region" aria-label="ตารางระดับน้ำ">
      <table className="w-full min-w-[680px] border-collapse text-left text-sm">
        <thead>
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h}
                className="sticky top-0 z-10 whitespace-nowrap border-b border-line bg-subtle px-6 py-3 text-xs font-medium text-ink-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-6 text-ink-muted">
                ไม่มีสถานีที่แสดงได้สำหรับตัวเลือกนี้
              </td>
            </tr>
          )}
          {rows.map((r) => {
            const status = rowStatus(r);
            return (
              <tr key={r.id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-subtle">
                <td className="px-6 py-3.5">
                  {Number.isFinite(r.lat) && Number.isFinite(r.lng) ? (
                    <button className="link text-left font-medium" onClick={() => onSelect(r)}>
                      {r.shortName || r.name}
                    </button>
                  ) : (
                    <span className="font-medium">{r.name}</span>
                  )}
                  {r.river && <small className="mt-0.5 block text-xs text-ink-muted">{r.river}</small>}
                </td>
                <td className="px-6 py-3.5 text-ink-muted">{r.area}</td>
                <td className="num px-6 py-3.5 text-base font-semibold" style={{ color: STATUS_COLORS[status] }}>
                  {signed(r.value)}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge status={status} />
                </td>
                <td className="whitespace-nowrap px-6 py-3.5 text-ink-muted">{formatDate(r.observedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
