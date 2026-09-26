"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { SOURCE_KEYS, useWaterData } from "@/lib/useWaterData";
import type { AnyRow, DamRow, FlowRow, RainRow, RoadRow, WaterRow } from "@/lib/types";
import { BRAND } from "@/lib/brand";
import { fmt, formatDate } from "@/lib/format";
import { rowStatus } from "@/lib/status";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Section, SourceNote } from "@/components/Section";
import { Kpis } from "@/components/Kpis";
import { DamList, DamMeter } from "@/components/DamList";
import { StationTable } from "@/components/StationTable";
import { RainList } from "@/components/RainList";
import { MapSummary, StationDetail } from "@/components/MapSidebar";
import { AreaFilters, DEFAULT_PROVINCES } from "@/components/AreaFilters";
import { RoadFloodSection, RoadSummary } from "@/components/RoadFlood";

const WaterMap = dynamic(() => import("@/components/WaterMap").then((m) => m.WaterMap), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-ink-muted">กำลังโหลดแผนที่…</div>,
});

type Layer = "water" | "road" | "rain" | "basin";

const LAYER_TITLES: Record<Layer, string> = {
  water: "ระดับน้ำในคลองและแม่น้ำ",
  road: "น้ำท่วมขังบนถนน กทม.",
  rain: "ฝนสะสม 24 ชั่วโมง",
  basin: "เขื่อนและน้ำไหลผ่าน",
};

const LAYER_BUTTONS: Record<Layer, string> = {
  water: "ระดับน้ำ",
  road: "น้ำท่วมถนน",
  rain: "ฝน 24 ชม.",
  basin: "เขื่อน",
};

const MAIN_DAM_IDS = ["dam-200101", "dam-200102", "dam-100107", "dam-100301"];

const STATUS_PRIORITY: Record<string, number> = { critical: 0, overflow: 0, lowcritical: 0, alert: 1, high: 1, normal: 2, low: 2, unknown: 3 };

export default function Home() {
  const { groups, inFlight, refresh } = useWaterData();
  const [layer, setLayer] = useState<Layer>("water");
  const [province, setProvince] = useState("bangkok-metropolitan");
  const [district, setDistrict] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const waterRows = useMemo(
    () => [...(groups.bangkok?.rows ?? []), ...(groups.regional?.rows ?? [])] as WaterRow[],
    [groups.bangkok, groups.regional],
  );
  const damRows = useMemo(() => (groups.dams?.rows ?? []) as DamRow[], [groups.dams]);
  const flowRows = useMemo(() => (groups.flow?.rows ?? []) as FlowRow[], [groups.flow]);
  const rainRows = useMemo(() => (groups.rain?.rows ?? []) as RainRow[], [groups.rain]);
  const roadRows = useMemo(() => (groups.roads?.rows ?? []) as RoadRow[], [groups.roads]);

  const mainDams = MAIN_DAM_IDS.map((id) => damRows.find((d) => d.id === id)).filter(Boolean) as DamRow[];
  const eastDams = damRows.filter((d) => d.damGroup === "east");
  const pakklongRow = waterRows.find((r) => r.code === "WL.PKG.01");
  const sortedFlows = [...flowRows].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));

  const inProvince = (r: AnyRow) =>
    province === "all" || (province === "bangkok-metropolitan" ? DEFAULT_PROVINCES.includes(r.province ?? "") : r.province === province);
  const inArea = (r: AnyRow) => inProvince(r) && (district === "all" || JSON.stringify([r.province ?? "", r.district ?? ""]) === district);

  const layerRows = useMemo<AnyRow[]>(() => {
    if (layer === "water") return waterRows;
    if (layer === "rain") return rainRows;
    if (layer === "road") return roadRows;
    return [...damRows, ...flowRows];
  }, [layer, waterRows, rainRows, roadRows, damRows, flowRows]);

  const scopedLayer = layerRows.filter(inArea);
  const mapPoints =
    layer === "water" && statusFilter !== "all" ? scopedLayer.filter((r) => rowStatus(r) === statusFilter) : scopedLayer;

  const stationRows = waterRows
    .filter(inArea)
    .filter((r) => statusFilter === "all" || rowStatus(r) === statusFilter)
    .sort((a, b) => (STATUS_PRIORITY[rowStatus(a)] ?? 9) - (STATUS_PRIORITY[rowStatus(b)] ?? 9) || a.name.localeCompare(b.name, "th"));

  const selected = selectedId ? [...waterRows, ...roadRows, ...rainRows, ...damRows, ...flowRows].find((r) => r.id === selectedId) ?? null : null;
  const sourcesOk = Object.values(groups).filter((g) => g && !g.stale).length;

  function changeLayer(next: Layer) {
    setLayer(next);
    // Dams sit far outside the metro area, so the default area filter would hide the whole layer.
    if (next === "basin") {
      setProvince("all");
      setDistrict("all");
    }
  }

  function selectRow(row: AnyRow) {
    if (!inArea(row)) {
      setProvince("all");
      setDistrict("all");
    }
    if (row.kind === "water" && statusFilter !== "all" && rowStatus(row) !== statusFilter) setStatusFilter("all");
    changeLayer(row.kind === "water" || row.kind === "rain" || row.kind === "road" ? row.kind : "basin");
    setSelectedId(row.id);
    document.getElementById("overview")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <SiteHeader
        inFlight={inFlight}
        status={`${sourcesOk}/${SOURCE_KEYS.length} แหล่งข้อมูลพร้อม`}
        onRefresh={() => refresh(true)}
      />

      <main id="top" className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        {/* Hero */}
        <section className="relative pt-12 sm:pt-20">
          <div
            className="aurora pointer-events-none absolute -top-10 right-[-10%] -z-10 h-[420px] w-[720px] rounded-full opacity-[0.22]"
            style={{ background: "conic-gradient(from 90deg at 50% 50%, #9ad8ff, #c9b6ff, #ff8e6e, #ffd6a5, #9ad8ff)" }}
            aria-hidden
          />
          <div className="flex flex-col gap-6">
            <div className="reveal reveal-1 pill w-fit bg-surface shadow-[0_4px_16px_-8px_rgba(0,0,0,0.1)]">
              <span className="live-dot h-2 w-2 rounded-full bg-[#34c759]" />
              อัปเดตสด · น้ำและฝนทุก 5 นาที · เขื่อนทุกชั่วโมง
            </div>
            <h1 className="reveal reveal-2 max-w-3xl text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-balance sm:text-6xl lg:text-7xl">
              {BRAND.tagline}
            </h1>
            <p className="reveal reveal-3 max-w-2xl text-lg font-light leading-relaxed text-ink-muted sm:text-xl">
              ระดับน้ำในคลอง น้ำท่วมขังบนถนน ฝน และเขื่อน กรุงเทพและปริมณฑล รวมไว้ในที่เดียว จากแหล่งตรวจวัดทางการ
            </p>
            <div className="reveal reveal-4 flex flex-wrap gap-3">
              <a href="#roads" className="inline-flex h-12 items-center rounded-full bg-ink px-6 font-medium text-white transition hover:-translate-y-px hover:bg-black">
                ถนนที่ควรเลี่ยง
              </a>
              <a
                href="#overview"
                className="inline-flex h-12 items-center rounded-full border border-line bg-surface px-6 font-medium text-ink transition hover:-translate-y-px hover:border-line-strong"
              >
                ดูแผนที่
              </a>
            </div>
          </div>
          <div className="reveal reveal-4 pt-12">
            <Kpis waterRows={waterRows} roadRows={roadRows} mainDams={mainDams} flowRow={sortedFlows[0]} pakklongRow={pakklongRow} />
          </div>
        </section>

        {/* Map */}
        <Section
          id="overview"
          eyebrow="แผนที่สถานการณ์"
          title={LAYER_TITLES[layer]}
          aside={
            <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 sm:w-auto" role="group" aria-label="ชั้นข้อมูลแผนที่">
              {(Object.keys(LAYER_BUTTONS) as Layer[]).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLayer(l)}
                  aria-pressed={layer === l}
                  className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors sm:flex-none ${
                    layer === l ? "bg-ink text-white" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {LAYER_BUTTONS[l]}
                </button>
              ))}
            </div>
          }
        >
          <div className="surface-card overflow-hidden shadow-card">
            <div className="border-b border-line p-3 sm:p-4">
              <AreaFilters
                rows={layerRows.filter((r) => Number.isFinite(r.lat))}
                province={province}
                district={district}
                status={statusFilter}
                onProvinceChange={(v) => {
                  setProvince(v);
                  setDistrict("all");
                }}
                onDistrictChange={setDistrict}
                onStatusChange={setStatusFilter}
                onClear={() => {
                  setProvince("all");
                  setDistrict("all");
                  setStatusFilter("all");
                }}
                statusDisabled={layer !== "water"}
              />
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="relative h-[420px] min-w-0 sm:h-[560px]">
                <WaterMap
                  points={mapPoints}
                  fitKey={`${layer}|${province}|${district}|${statusFilter}`}
                  selected={selected}
                  onSelect={selectRow}
                />
              </div>
              <aside className="flex flex-col gap-5 border-t border-line p-5 lg:max-h-[560px] lg:overflow-y-auto lg:border-l lg:border-t-0">
                {layer === "road" ? (
                  <RoadSummary rows={scopedLayer.filter((r): r is RoadRow => r.kind === "road")} />
                ) : (
                  <MapSummary
                    points={scopedLayer.filter((r) => Number.isFinite(r.lat))}
                    layer={layer}
                    filter={statusFilter}
                    onToggleFilter={(s) => setStatusFilter((prev) => (prev === s ? "all" : s))}
                  />
                )}
                <StationDetail row={selected} onClose={() => setSelectedId(null)} />
                <p className="text-xs leading-relaxed text-ink-muted">
                  ม.รทก. คือระดับเทียบทะเลปานกลาง ไม่ใช่ความลึกน้ำบนถนน สีของจุดเป็นสถานะตามแหล่งข้อมูล ไม่ใช่ขอบเขตน้ำท่วม
                </p>
              </aside>
            </div>
          </div>
          <SourceNote>
            ข้อมูลแต่ละแหล่งมีรอบเวลาต่างกัน · แผนที่ © OpenStreetMap contributors
          </SourceNote>
        </Section>

        <RoadFloodSection rows={roadRows.filter(inArea)} totalSensors={roadRows.filter((r) => !r.tunnel).length} onSelect={selectRow} />

        {/* Upstream */}
        <Section
          id="reservoirs"
          eyebrow="ต้นน้ำถึงกรุงเทพ"
          title="เขื่อนหลักและน้ำไหลผ่าน"
          description="น้ำในเขื่อนลุ่มเจ้าพระยาตามรอบรายงานประจำวัน และน้ำไหลผ่านคลองหลักใน กทม. ทุก 5 นาที"
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="surface-card flex flex-col gap-5 p-5 sm:p-7 lg:col-span-7">
              <h3 className="text-base font-semibold">4 เขื่อนหลัก ลุ่มเจ้าพระยา</h3>
              <DamList dams={mainDams} onSelect={selectRow} />
            </div>
            <div className="surface-card flex flex-col gap-5 p-5 sm:p-7 lg:col-span-5">
              <h3 className="text-base font-semibold">
                น้ำไหลผ่านคลองหลัก กทม. <span className="text-xs font-normal text-ink-muted">ลบ.ม./วินาที</span>
              </h3>
              {sortedFlows.length === 0 ? (
                <p className="text-sm text-ink-muted">ยังอ่านสถานีน้ำไหลผ่านไม่ได้</p>
              ) : (
                <ol className="flex flex-col divide-y divide-line">
                  {sortedFlows.slice(0, 8).map((r) => (
                    <li key={r.id} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <button className="link text-left text-sm font-medium" onClick={() => selectRow(r)}>
                          {r.name}
                        </button>
                        <p className="text-xs text-ink-muted">{formatDate(r.observedAt)}</p>
                      </div>
                      <b className="num text-xl font-semibold">{fmt(r.value)}</b>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          <SourceNote>กรมชลประทาน / กฟผ. ผ่าน RID Reservoir API · น้ำไหลผ่านจากสำนักการระบายน้ำ กทม. ผ่าน ThaiWater · ไม่ใช่ค่าคาดการณ์น้ำท่วม</SourceNote>
        </Section>

        {eastDams.length > 0 && (
          <Section id="east" eyebrow="ลุ่มน้ำตะวันออก" title="นครนายกและบางปะกง" description="อ่างเก็บน้ำฝั่งตะวันออกที่เกี่ยวข้องกับการบริหารน้ำรังสิตและตะวันออกของกรุงเทพฯ">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eastDams.map((r) => (
                <article key={r.id} className="surface-card flex flex-col gap-3 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <button className="link text-left font-medium" onClick={() => selectRow(r)}>
                      {r.name}
                    </button>
                    <span className="num text-lg font-semibold">{fmt(r.percent)}%</span>
                  </div>
                  <p className="-mt-2 text-xs text-ink-muted">
                    {r.area} · {r.province}
                  </p>
                  <DamMeter percent={r.percent} />
                  <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted">
                    <div>
                      น้ำในอ่าง<b className="num block text-base font-semibold text-ink">{fmt(r.value)}</b>
                    </div>
                    <div>
                      ความจุปกติ<b className="num block text-base font-semibold text-ink">{fmt(r.capacity)}</b>
                    </div>
                  </div>
                  <p className="text-xs text-ink-muted">ล้าน ลบ.ม. · รายงาน {formatDate(r.observedAt, true)}</p>
                </article>
              ))}
            </div>
          </Section>
        )}

        {/* Stations */}
        <Section
          id="stations"
          eyebrow="จุดเฝ้าระวัง"
          title="ระดับน้ำรายสถานี"
          description={`แสดง ${stationRows.length} จาก ${waterRows.length} สถานี เรียงจุดวิกฤติก่อน ใช้ตัวกรองบนแผนที่เพื่อเลือกพื้นที่`}
        >
          <div className="surface-card overflow-hidden">
            <StationTable rows={stationRows} onSelect={selectRow} />
          </div>
          <SourceNote>
            กรุงเทพฯ จากสำนักการระบายน้ำ กทม. · จังหวัดอื่นจาก ThaiWater · สถานะน้ำมาก/ล้นตลิ่ง/น้ำน้อยเป็นเกณฑ์ของ ThaiWater ส่วนเตือนภัย/วิกฤติเป็นเกณฑ์ของ กทม.
          </SourceNote>
        </Section>

        {/* Rain */}
        <Section id="rain" eyebrow="ฝน" title="ฝนสะสม 24 ชั่วโมง" description="5 จุดที่ฝนตกหนักที่สุดในพื้นที่ที่เลือก จากข้อมูลที่ยังไม่เก่า">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="surface-card p-5 sm:p-7 lg:col-span-7">
              <RainList rows={rainRows.filter(inArea)} onSelect={selectRow} />
            </div>
            <div className="surface-card flex flex-col gap-4 p-5 sm:p-7 lg:col-span-5">
              <h3 className="text-base font-semibold">สิ่งที่ควรติดตาม</h3>
              <ul className="flex flex-col divide-y divide-line text-sm text-ink-muted">
                {["ฝนสะสมและระดับน้ำในคลองใกล้บ้านคุณ", "ถนนและอุโมงค์ที่มีน้ำขังก่อนออกเดินทาง", "น้ำไหลผ่านจากเขื่อนและลำน้ำสาขา", "น้ำทะเลหนุนในช่วงฝนหนัก"].map((t) => (
                  <li key={t} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Sources */}
        <section id="sources" className="pt-16 sm:pt-24">
          <details className="surface-card group p-5 sm:p-7">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              แหล่งข้อมูล รอบอัปเดต และวิธีอ่าน
              <span className="text-xl text-ink-muted transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="flex flex-col gap-3 pt-4 text-sm font-light leading-relaxed text-ink-muted">
              <p>ระดับน้ำ น้ำท่วมถนน น้ำไหลผ่าน และฝน ตรวจใหม่ทุก 5 นาที ส่วนเขื่อนทุก 1 ชั่วโมง ข้อมูลต้นทางอาจอัปเดตช้ากว่านั้น</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>
                  <a className="link font-normal text-ink" href="https://weather.bangkok.go.th/water/summary" target="_blank" rel="noopener noreferrer">
                    สำนักการระบายน้ำ กรุงเทพมหานคร
                  </a>{" "}
                  — ระดับน้ำในคลองและน้ำท่วมถนน พร้อมพิกัดและเวลาวัด
                </li>
                <li>
                  <a className="link font-normal text-ink" href="https://www.thaiwater.net/" target="_blank" rel="noopener noreferrer">
                    คลังข้อมูลน้ำแห่งชาติ ThaiWater
                  </a>{" "}
                  — ระดับน้ำจังหวัดอื่น น้ำไหลผ่าน ฝนสะสม และเขตของเซ็นเซอร์ถนน
                </li>
                <li>
                  <a className="link font-normal text-ink" href="https://app.rid.go.th/reservoir/" target="_blank" rel="noopener noreferrer">
                    กรมชลประทาน
                  </a>{" "}
                  — รายงานเขื่อนขนาดใหญ่
                </li>
                <li>
                  <a className="link font-normal text-ink" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">
                    OpenStreetMap
                  </a>{" "}
                  — แผนที่พื้นฐาน
                </li>
              </ol>
              <p>
                ระดับน้ำเกิน 60 นาที น้ำไหลผ่านและฝนเกิน 3 ชั่วโมง และเขื่อนเกิน 48 ชั่วโมง จะถือว่าเป็นข้อมูลเก่า เวลาทั้งหมดเป็นเวลาไทย (UTC+7)
                และระบบนี้ไม่ใช่การประกาศเตือนภัยทางการ
              </p>
            </div>
          </details>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
