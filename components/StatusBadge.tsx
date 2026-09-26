import { STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import type { StationStatus } from "@/lib/types";

const BADGE_CLASSES: Record<StationStatus, string> = {
  normal: "text-[#247760] bg-[#e8f5ef]",
  alert: "text-[#906311] bg-[#fff4db]",
  critical: "text-[#b34051] bg-[#fcecee]",
  high: "text-[#247389] bg-[#e7f3f7]",
  overflow: "text-[#b34051] bg-[#fcecee]",
  low: "text-[#906311] bg-[#fff4db]",
  lowcritical: "text-[#9b4a23] bg-[#fbeddf]",
  unknown: "text-[#657687] bg-[#edf1f4]",
};

export function StatusBadge({ status, label }: { status: StationStatus; label?: string }) {
  return (
    <span className={`inline-flex text-xs font-medium px-3 py-1 rounded-md leading-relaxed max-w-full ${BADGE_CLASSES[status]}`}>
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}

export function LegendDot({ status }: { status: StationStatus }) {
  return (
    <i
      className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
      style={{ background: STATUS_COLORS[status] }}
      aria-hidden
    />
  );
}
