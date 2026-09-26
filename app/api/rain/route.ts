import { fetchThaiWaterRain } from "@/lib/sources/thaiwater";
import { sourceRoute } from "@/lib/sourceRoute";

export const dynamic = "force-dynamic";

export const GET = sourceRoute("rain", 5 * 60_000, fetchThaiWaterRain);
