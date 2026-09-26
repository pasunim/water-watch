import { fetchRoadFlood } from "@/lib/sources/roads";
import { sourceRoute } from "@/lib/sourceRoute";

export const dynamic = "force-dynamic";

export const GET = sourceRoute("roads", 5 * 60_000, fetchRoadFlood);
