import { fetchBmaStations } from "@/lib/sources/bma";
import { sourceRoute } from "@/lib/sourceRoute";

export const dynamic = "force-dynamic";

export const GET = sourceRoute("bangkok", 5 * 60_000, fetchBmaStations);
