import type { AnyRow, StationStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/status";

export const DEFAULT_PROVINCES = ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "สมุทรสาคร", "นครปฐม"];

const COVERED_PROVINCES = [
  "กรุงเทพมหานคร", "นนทบุรี", "สมุทรปราการ", "ปทุมธานี", "นครปฐม", "สมุทรสาคร",
  "ฉะเชิงเทรา", "สุพรรณบุรี", "ระยอง", "ชลบุรี", "เชียงใหม่", "นครราชสีมา", "ตาก", "นครนายก", "ศรีสะเกษ",
];

const STATUS_OPTIONS: StationStatus[] = ["critical", "alert", "normal", "high", "overflow", "low", "lowcritical", "unknown"];

function FilterSelect({
  label,
  value,
  active,
  disabled,
  onChange,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  disabled?: boolean;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`relative flex min-w-0 flex-col rounded-2xl border px-4 py-2 transition-colors ${
        active ? "border-ink bg-surface" : "border-line bg-surface hover:border-line-strong"
      } ${disabled ? "opacity-50" : "cursor-pointer"}`}
    >
      <span className="text-[11px] font-medium tracking-[0.06em] text-ink-muted">{label}</span>
      <select
        className="w-full cursor-pointer appearance-none truncate border-0 bg-transparent pr-5 text-sm font-medium text-ink outline-none disabled:cursor-default"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

export function AreaFilters({
  rows,
  province,
  district,
  status,
  onProvinceChange,
  onDistrictChange,
  onStatusChange,
  onClear,
  statusDisabled,
}: {
  rows: AnyRow[];
  province: string;
  district: string;
  status: string;
  onProvinceChange: (v: string) => void;
  onDistrictChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onClear: () => void;
  statusDisabled?: boolean;
}) {
  const available = new Set(rows.map((r) => r.province));
  const provinces = Array.from(new Set([...COVERED_PROVINCES, ...(rows.map((r) => r.province).filter(Boolean) as string[])])).sort((a, b) =>
    a.localeCompare(b, "th"),
  );
  const hasDefault = DEFAULT_PROVINCES.some((p) => available.has(p));
  const multiProvince = province === "all" || province === "bangkok-metropolitan";
  const inProvince = (r: AnyRow) =>
    province === "all" || (province === "bangkok-metropolitan" ? DEFAULT_PROVINCES.includes(r.province ?? "") : r.province === province);

  const districts = new Map<string, string>();
  for (const r of rows) {
    if (!r.district || !inProvince(r)) continue;
    districts.set(JSON.stringify([r.province ?? "", r.district]), multiProvince ? `${r.district} · ${r.province}` : r.district);
  }
  const districtOptions = [...districts.entries()].sort((a, b) => a[1].localeCompare(b[1], "th"));
  const nothingSet = province === "all" && district === "all" && status === "all";

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
      <FilterSelect label="จังหวัด" value={province} active={province !== "all"} onChange={onProvinceChange}>
        <option value="bangkok-metropolitan" disabled={!hasDefault}>
          กทม. + ปริมณฑล
        </option>
        <option value="all">ทุกจังหวัด</option>
        {provinces.map((p) => (
          <option key={p} value={p} disabled={!available.has(p)}>
            {p}
            {available.has(p) ? "" : " — ไม่มีข้อมูล"}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="เขต / อำเภอ" value={district} active={district !== "all"} onChange={onDistrictChange}>
        <option value="all">ทุกเขต / อำเภอ</option>
        {districtOptions.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect label="สถานะระดับน้ำ" value={status} active={status !== "all"} disabled={statusDisabled} onChange={onStatusChange}>
        <option value="all">ทุกสถานะ</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </FilterSelect>

      <button
        type="button"
        onClick={onClear}
        disabled={nothingSet}
        className="rounded-2xl border border-line bg-surface px-4 text-sm font-medium text-ink transition-colors hover:border-line-strong disabled:border-transparent disabled:bg-transparent disabled:text-ink-muted/60"
      >
        ล้างตัวกรอง
      </button>
    </div>
  );
}
