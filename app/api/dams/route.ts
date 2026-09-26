import { fetchRidDams } from "@/lib/sources/rid";
import { sourceRoute } from "@/lib/sourceRoute";

export const dynamic = "force-dynamic";

export const GET = sourceRoute("dams", 60 * 60_000, fetchRidDams);
