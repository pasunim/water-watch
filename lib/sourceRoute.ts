import { NextResponse } from "next/server";
import { cached, cachedStale } from "./cache";

export function sourceRoute<T>(key: string, ttlMs: number, load: () => Promise<T[]>) {
  return async function GET() {
    try {
      const { value, fetchedAt } = await cached(key, ttlMs, load);
      return NextResponse.json(
        { rows: value, fetchedAt },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
      );
    } catch (err) {
      console.error(`[api/${key}]`, err);
      const stale = cachedStale<T[]>(key);
      return NextResponse.json(
        { rows: stale?.value ?? [], fetchedAt: stale?.fetchedAt ?? null, stale: true, error: "แหล่งข้อมูลต้นทางไม่ตอบสนอง" },
        { status: stale ? 200 : 502, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
