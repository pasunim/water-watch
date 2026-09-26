import { BRAND } from "@/lib/brand";

const NAV_LINKS = [
  ["#overview", "แผนที่"],
  ["#roads", "ถนนน้ำท่วม"],
  ["#reservoirs", "เขื่อน"],
  ["#stations", "จุดเฝ้าระวัง"],
  ["#sources", "แหล่งข้อมูล"],
] as const;

export function Wordmark() {
  return (
    <span className="text-[19px] font-semibold tracking-[-0.03em] text-ink">
      {BRAND.name}
      <span className="text-accent">.</span>
    </span>
  );
}

export function SiteHeader({
  inFlight,
  status,
  onRefresh,
}: {
  inFlight: boolean;
  status: string;
  onRefresh: () => void;
}) {
  return (
    <nav className="sticky top-0 z-[1000] border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-8">
        <a href="#top" className="flex items-baseline gap-2.5">
          <Wordmark />
          <span className="hidden text-xs text-ink-muted sm:inline">by {BRAND.author}</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-sm text-ink-muted transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-ink-muted md:inline" role="status">
            {status}
          </span>
          <button
            onClick={onRefresh}
            disabled={inFlight}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className={`h-4 w-4 ${inFlight ? "animate-[spin-slow_1.6s_linear_infinite]" : ""}`}
              aria-hidden
            >
              <path d="M20 7v5h-5M4 17v-5h5" />
              <path d="M6 7a7 7 0 0 1 11.5-1L20 9M4 15l2.5 3A7 7 0 0 0 18 17" />
            </svg>
            {inFlight ? "กำลังอัปเดต" : "รีเฟรช"}
          </button>
        </div>
      </div>
      <div className="flex gap-6 overflow-x-auto px-5 pb-3 sm:px-8 lg:hidden">
        {NAV_LINKS.map(([href, label]) => (
          <a key={href} href={href} className="whitespace-nowrap text-sm text-ink-muted hover:text-ink">
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-5 py-10 text-sm text-ink-muted sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <Wordmark />
          <span>
            ออกแบบและพัฒนาโดย{" "}
            <a href={BRAND.authorUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ink link">
              {BRAND.author}
            </a>
          </span>
        </div>
        <div className="flex flex-col gap-1 md:items-end">
          <span suppressHydrationWarning>
            © {new Date().getFullYear()} {BRAND.author} · Bangkok, Thailand
          </span>
          <span className="text-xs">เวลาไทย (UTC+7) · ไม่ใช่ระบบประกาศเตือนภัยทางการ</span>
        </div>
      </div>
    </footer>
  );
}
