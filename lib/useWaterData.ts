"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GroupResponse } from "./types";

export type SourceKey = "bangkok" | "regional" | "roads" | "dams" | "flow" | "rain";

export const SOURCE_KEYS: SourceKey[] = ["bangkok", "regional", "roads", "dams", "flow", "rain"];

const REFRESH_MS: Record<SourceKey, number> = {
  bangkok: 5 * 60_000,
  roads: 5 * 60_000,
  regional: 5 * 60_000,
  flow: 5 * 60_000,
  rain: 5 * 60_000,
  dams: 60 * 60_000,
};

export type Groups = Partial<Record<SourceKey, GroupResponse>>;

export function useWaterData() {
  const [groups, setGroups] = useState<Groups>({});
  const [inFlight, setInFlight] = useState(false);
  const nextDue = useRef<Partial<Record<SourceKey, number>>>({});
  const running = useRef(false);

  const refresh = useCallback(async (force = false) => {
    if (document.hidden || running.current) return;
    const due = SOURCE_KEYS.filter((key) => force || Date.now() >= (nextDue.current[key] ?? 0));
    if (!due.length) return;
    running.current = true;
    setInFlight(true);
    await Promise.allSettled(
      due.map(async (key) => {
        try {
          const res = await fetch(`/api/${key}`, { cache: "no-store", signal: AbortSignal.timeout(90_000) });
          const data: GroupResponse = await res.json();
          if (!Array.isArray(data.rows)) throw new Error("Invalid response");
          setGroups((prev) => ({ ...prev, [key]: data }));
          nextDue.current[key] = Date.now() + (data.stale ? 60_000 : REFRESH_MS[key]);
        } catch {
          setGroups((prev) => ({
            ...prev,
            [key]: { rows: prev[key]?.rows ?? [], fetchedAt: prev[key]?.fetchedAt ?? null, stale: true, error: "เชื่อมต่อไม่ได้" },
          }));
          nextDue.current[key] = Date.now() + 60_000;
        }
      }),
    );
    running.current = false;
    setInFlight(false);
  }, []);

  useEffect(() => {
    refresh();
    const onVisibility = () => {
      if (!document.hidden) refresh();
    };
    const interval = setInterval(() => {
      if (!document.hidden) refresh();
    }, 15_000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onVisibility);
    };
  }, [refresh]);

  return { groups, inFlight, refresh };
}
