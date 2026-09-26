"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { AnyRow } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { drawOrder, markerRadius, rowColor, rowLabel, rowValueText } from "@/lib/display";

function FitBounds({ points, fitKey }: { points: AnyRow[]; fitKey: string }) {
  const map = useMap();
  const fittedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!points.length || fittedKey.current === fitKey) return;
    const bounds: LatLngBoundsExpression = points.map((r) => [r.lat as number, r.lng as number]);
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 12 });
    fittedKey.current = fitKey;
  }, [points, fitKey, map]);

  return null;
}

function FocusSelected({ selected }: { selected: AnyRow | null }) {
  const map = useMap();
  const id = selected?.id;
  const lat = selected?.lat;
  const lng = selected?.lng;
  const kind = selected?.kind;

  useEffect(() => {
    if (!id || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const target = kind === "dam" || kind === "flow" ? 10 : 14;
    map.flyTo([lat as number, lng as number], Math.max(map.getZoom(), target), { duration: 0.6 });
  }, [id, lat, lng, kind, map]);

  return null;
}

export function WaterMap({
  points,
  fitKey,
  selected,
  onSelect,
}: {
  points: AnyRow[];
  fitKey: string;
  selected: AnyRow | null;
  onSelect: (row: AnyRow) => void;
}) {
  const selectedId = selected?.id ?? null;
  const validPoints = useMemo(
    () =>
      points.filter(
        (r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && r.lat! >= 5 && r.lat! <= 21 && r.lng! >= 97 && r.lng! <= 106,
      ).sort((a, b) => drawOrder(a) - drawOrder(b)),
    [points],
  );

  return (
    <MapContainer
      center={[13.77, 100.63]}
      zoom={11}
      scrollWheelZoom={false}
      className="h-full w-full z-0"
      style={{ background: "#e4edf0" }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        maxZoom={19}
      />
      <FitBounds points={validPoints} fitKey={fitKey} />
      <FocusSelected selected={selected} />
      {validPoints.map((r) => {
        const color = rowColor(r);
        const radius = markerRadius(r);
        const isSelected = r.id === selectedId;
        return (
          <CircleMarker
            key={r.id}
            center={[r.lat as number, r.lng as number]}
            radius={isSelected ? radius + 2 : radius}
            pathOptions={{ color: "#fff", weight: isSelected ? 3 : 1.7, fillColor: color, fillOpacity: 0.93 }}
            eventHandlers={{ click: () => onSelect(r) }}
          >
            <Tooltip direction="top" offset={[0, -7]} opacity={1}>
              <div>
                <strong>{r.name}</strong>
                <span className="block text-xs text-ink-muted">{r.area}</span>
                <span className="num my-1 block text-[26px] font-semibold leading-tight" style={{ color }}>
                  {rowValueText(r)} <small className="text-xs text-ink-muted font-normal">{r.unit}</small>
                </span>
                {r.kind === "road" && <span className="block text-xs font-medium" style={{ color }}>{rowLabel(r)}</span>}
                <span className="block text-xs text-ink-muted mt-2">
                  {r.kind === "road" && r.floodStart && `เริ่มขัง ${formatDate(r.floodStart)} · `}
                  {r.kind === "dam" ? "รายงาน" : "วัดเมื่อ"} {formatDate(r.observedAt, r.kind === "dam")}
                </span>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
