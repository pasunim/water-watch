# 🌊 Floodline — เช็กน้ำก่อนออกจากบ้าน

[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)](https://leafletjs.com/)

A live, Thai-language water situation dashboard for Bangkok and its surrounding provinces: canal and river water levels, flooded roads and underpasses, 24-hour rainfall, canal flow, and major dam storage, in one place. Designed and built by [Pasu Nimsuwan](https://pasu.app).

**No database, no API keys, no user accounts.** Every number is fetched live from official public sources (Bangkok Metropolitan Administration, ThaiWater, Royal Irrigation Department). The Next.js server fetches, normalizes and caches them; the browser only ever talks to this app's own API routes.

> **ภาษาไทยโดยย่อ** — Floodline รวมข้อมูลระดับน้ำในคลอง น้ำท่วมขังบนถนนและอุโมงค์ ฝนสะสม 24 ชั่วโมง น้ำไหลผ่าน และน้ำในเขื่อน ของกรุงเทพฯ และปริมณฑล ดึงสดจากสำนักการระบายน้ำ กทม. ThaiWater และกรมชลประทาน อัปเดตทุก 5 นาที ไม่ต้องใช้ API key หรือฐานข้อมูล รันได้ด้วย `npm install && npm run dev`

> ⚠️ Floodline is an information tool, **not an official warning system**. Station colors reflect each source's own status, not flood boundaries, and sensors only measure where they are installed.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Architecture](#-architecture)
- [Data Sources in Detail](#-data-sources-in-detail)
- [Data Model](#-data-model)
- [API Routes](#-api-routes)
- [Caching, Timeouts & Upstream Protection](#-caching-timeouts--upstream-protection)
- [Client Data Lifecycle](#-client-data-lifecycle)
- [UI Walkthrough](#-ui-walkthrough)
- [Status, Severity & Staleness Rules](#-status-severity--staleness-rules)
- [Design System](#-design-system)
- [Project Structure](#-project-structure)
- [Customization Guide](#-customization-guide)
- [Security](#-security)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Known Limitations](#-known-limitations)
- [Author](#-author)

## ✨ Features

- **Interactive map** (Leaflet + OpenStreetMap) with four switchable layers: water level, flooded roads, 24h rain, dams & flow
- **Flooded-road finder**: 236 BMA road sensors plus 8 underpasses, sorted deepest first, showing when flooding started and its peak depth
- **Underpass status**: inbound/outbound water depth for each of Bangkok's monitored underpasses
- **Four KPI cards**: roads flooded right now, water stations on alert, Chao Phraya level at Pak Khlong Talat, remaining capacity of the 4 main dams
- **Area filters** by province, district and water status, shared by the map, flooded-road list, station table and rain ranking
- **Station table** of ~1,100 water-level stations, critical ones first
- **Dam panels**: the 4 main Chao Phraya basin dams and the eastern (Nakhon Nayok / Bang Pakong) group
- **Rainfall ranking**: top 5 stations by 24h accumulated rain in the selected area
- **Auto refresh** every 5 minutes (dams hourly); pauses while the tab is hidden and catches up when you return or reconnect
- **Staleness handling**: readings older than their source's normal cadence are greyed out instead of being shown as current
- **Resilience**: if a source fails, the last good data keeps showing, marked as stale
- **Design system shared with [pasu.app](https://pasu.app)** ("Warm Premium")

## 🧰 Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 with `@theme` design tokens |
| Map | Leaflet 1.9 + react-leaflet 5, OpenStreetMap raster tiles |
| Fonts | Prompt (Thai + Latin), JetBrains Mono (numbers), self-hosted via `next/font` |
| Data | Server-side `fetch` in Route Handlers, in-memory cache |
| Linting | ESLint 9 + `eslint-config-next` |

No state library, no UI kit, no database: the whole app is one client page plus six API routes.

## 🚀 Getting Started

### Prerequisites

- Node.js **20.9+** (required by Next.js 16)
- npm

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### What to expect on first load

| Data | First load | After that |
| --- | --- | --- |
| Rain, provincial water levels, flow, dams | ~1–3 s | instant (cached) |
| Bangkok water levels | ~13–30 s | instant (cached) |
| Flooded roads + underpasses | **~30–50 s** | instant (cached) |

BMA's pages are large (1.4 MB and 3 MB) and slow, and they are fetched one at a time (see [Caching](#-caching-timeouts--upstream-protection)). Each map layer appears as soon as its own source arrives; nothing waits for the slowest one.

### Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Development server with Turbopack and hot reload |
| `npm run build` | Production build (type-checks as part of the build) |
| `npm start` | Serve the production build on port 3000 |
| `npm run lint` | ESLint over the project |
| `npx tsc --noEmit` | Type-check only |

### Quick API check

With the dev server running:

```bash
curl -s localhost:3000/api/dams | head -c 400
curl -s localhost:3000/api/roads | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d['rows']), 'rows, stale:', d.get('stale'))"
```

## 🔑 Environment Variables

**None required.** Every upstream source is public and key-free.

| Variable | Set by | Effect |
| --- | --- | --- |
| `NODE_ENV` | Next.js, automatically | In `production`: adds HSTS, `upgrade-insecure-requests`, and drops `'unsafe-eval'` / `ws:` from the CSP |

If you later add something that needs a key (analytics, a paid tile provider), put it in `.env.local`, which is already git-ignored.

## 🏛️ Architecture

```
┌────────────────────────── Browser ──────────────────────────┐
│ app/page.tsx (client)                                        │
│   useWaterData() ── polls /api/<source> per its own schedule │
│   filters + selection state → map, lists, tables             │
└───────────────┬─────────────────────────────────────────────┘
                │ GET /api/{bangkok,roads,regional,rain,flow,dams}
┌───────────────▼──────────── Next.js server ──────────────────┐
│ app/api/*/route.ts → sourceRoute(key, ttl, loader)           │
│   lib/cache.ts: TTL cache · in-flight dedup · 60 s backoff   │
│   stale fallback · Cache-Control for CDNs                    │
│                                                              │
│ lib/sources/* adapters → normalized rows (lib/types.ts)      │
│   bma.ts ───────┐                                            │
│   roads.ts ─────┼─ bmaPage.ts: serialized fetch, 403 retry,  │
│                 │               embedded-array extraction    │
│   thaiwater.ts ─ JSON API                                    │
│   rid.ts ─────── JSON API + coordinate lookup                │
└───────┬────────────────────┬───────────────────┬─────────────┘
        ▼                    ▼                   ▼
 weather.bangkok.go.th  api-v3.thaiwater.net  app.rid.go.th
```

Design choices:

- **Server-side fetching only.** The browser never calls government sites directly: no CORS issues, one cached upstream request serves every visitor, and upstream quirks (HTML scraping, timezones, field names) stay on the server.
- **One normalized row shape.** Every source becomes an `AnyRow` with coordinates, value, unit, ISO timestamp, source name and link, so the map, filters, detail panel and staleness logic work the same for every layer.
- **One route per source.** Each source has its own cache, schedule and failure state, so a slow or broken source never blocks the others.

## 🛰️ Data Sources in Detail

### 1. BMA canal water levels → `/api/bangkok`

- **URL:** `https://weather.bangkok.go.th/water/summary`
- **Method:** the page embeds its data as an inline JS array, `waterSummaryList = [...]`, which is extracted by bracket-matching and parsed as JSON (`lib/sources/bmaPage.ts`)
- **Rows:** ~304 active stations (`active !== 0`)

| BMA field | Row field | Notes |
| --- | --- | --- |
| `water_id` | `id` = `bkk-<id>` | |
| `water_name`, `water_shortname` | `name`, `shortName` | |
| `river_name` | `river` | |
| `district_id` | `district`, `province` | Mapped via `lib/districts.ts`; ids 51–58 are outside Bangkok (Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, Nakhon Pathom, Chachoengsao) |
| `latitude`, `longitude` | `lat`, `lng` | |
| `wl_in` | `value` | m above mean sea level (ม.รทก.) |
| `warning`, `critical` | `warning`, `critical` | Per-station thresholds |
| `right_bank` / `left_bank` | `bank` | |
| `water_status_flood` | `statusKey` | 1 = normal, 2 = alert, 3 = critical. If missing, derived from `wl_in` vs thresholds |
| `site_timestamp` | `observedAt` | Local time without offset → `+07:00` appended |
| `water_code` | `code` | e.g. `WL.PKG.01` (Pak Khlong Talat, used by a KPI) |

`water_status_flood` was checked against the thresholds on live data: it matched the derived status for 301 of 304 stations.

### 2. BMA road flooding & underpasses → `/api/roads`

- **URL:** `https://weather.bangkok.go.th/flood` (~3 MB)
- **Embedded arrays:** `const floodData = [...]` (road sensors) and `const tunnelData = [...]` (underpasses)
- **Rows:** 236 road sensors + 8 underpasses

Road sensor mapping:

| BMA field | Row field | Notes |
| --- | --- | --- |
| `flood_code` | `id` = `road-<code>`, `code` | e.g. `FL.PYT.09` |
| `flood_name` | `name` | Trailing `*` (marks newer sensors) is stripped |
| `road_name` | `area` | Replaced by the district when ThaiWater provides one |
| `flood` | `value` | Water depth on the road surface, cm |
| `flood_start`, `flood_max` | `floodStart`, `floodMax` | Only kept while the sensor currently reads > 0 (otherwise they describe a past event) |
| `flood_system_id` | `stepped` | `2` = newer sensors reporting in 5 cm steps (see [notes](#stepped-road-sensors)) |
| `web_url` | `url` | Only used if it starts with `https://` |
| `site_timestamp` | `observedAt` | `+07:00` appended |

Underpass mapping: each tunnel becomes one row whose `value` is the deeper of its two directions. `listTunnelSubLastDetail` entries become `tunnel[]`, with `IN` labelled by `direction_left` and `OUT` by `direction_right` (e.g. "ขาเข้า(ไปปิ่นเกล้า)").

**Merge with ThaiWater:** BMA's flood page has no district field, so `lib/sources/roads.ts` fetches ThaiWater's `flood_road` feed in parallel and joins on sensor code (`floodroad_oldcode` = `flood_code`) to fill in `district` and `province`. If BMA fails entirely, the ThaiWater rows are served on their own (no underpasses, no flood start/peak).

### 3. ThaiWater → `/api/regional`, `/api/rain`, `/api/flow`

- **Base URL:** `https://api-v3.thaiwater.net/api/v1/thaiwater30/public/`
- Public JSON endpoints used by thaiwater.net's own frontend; no key, no CSRF token
- Requests send a browser User-Agent and `Referer: https://www.thaiwater.net/`
- Timestamps like `2026-09-26 21:30` are converted to `2026-09-26T21:30+07:00`
- Rows without coordinates are dropped

| Endpoint | Route | Rows | Value |
| --- | --- | --- | --- |
| `waterlevel_load` | `/api/regional` | ~800 stations nationwide | `waterlevel_msl` (ม.รทก.); status from `situation_level` |
| `rain_24h` | `/api/rain` | ~4,400 stations | `rain_24h` (mm) |
| `flow` | `/api/flow` | ~55 Bangkok canal stations | `flow_value` (m³/s) |
| `flood_road` | used inside `/api/roads` | ~262 road sensors | district/province enrichment + fallback |

Province and district come from each row's `geocode.province_name.th` / `geocode.amphoe_name.th`. ThaiWater's Bangkok water-level stations use different codes from BMA's (checked: zero overlap), so they are not duplicates.

### 4. RID large dams → `/api/dams`

- **URL:** `https://app.rid.go.th/reservoir/api/dam/public`
- Clean JSON, 35 large dams grouped by region, reported daily

| RID field | Row field | Meaning |
| --- | --- | --- |
| `volume` | `value` | Water currently in the reservoir (million m³) |
| `storage` | `capacity` | Normal retention capacity (million m³) |
| `percent_storage` | `percent` | `volume / storage` |
| `inflow`, `outflow` | `inflow`, `released` | million m³/day |
| `capacity` | *(not used)* | Physical maximum, above normal retention |

The API has no coordinates, so only dams listed in `DAM_META` (`lib/sources/rid.ts`) are shown: 4 main Chao Phraya basin dams (Bhumibol, Sirikit, Khwae Noi Bamrung Dan, Pasak Jolasid) and 6 eastern dams.

## 🧬 Data Model

All rows share `BaseRow` (`lib/types.ts`):

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique across all sources (prefixed: `bkk-`, `tw-wl-`, `road-`, `tunnel-`, `tw-rain-`, `tw-flow-`, `dam-`) |
| `kind` | `"water" \| "road" \| "rain" \| "flow" \| "dam"` | Discriminant |
| `name`, `shortName?` | `string` | Display names |
| `area` | `string` | Short location line under the name |
| `province?`, `district?` | `string` | Used by the area filters |
| `lat`, `lng` | `number \| null` | Rows outside Thailand's bounding box (lat 5–21, lng 97–106) are not drawn |
| `value` | `number \| null` | The headline number, in `unit` |
| `unit` | `string` | `ม.รทก.`, `ซม.`, `มม.`, `ลบ.ม./วินาที`, `ล้าน ลบ.ม.` |
| `observedAt` | `string \| null` | ISO timestamp with offset |
| `source`, `url` | `string` | Attribution and "view at source" link |
| `code?` | `string` | Upstream station code |

Kind-specific fields:

- **`WaterRow`** — `dataGroup` (`bangkok` / `regional`), `statusKey`, `warning`, `critical`, `bank`, `river`
- **`RoadRow`** — `floodStart`, `floodMax`, `stepped`, `tunnel?: { label, depth, floodStart, floodMax }[]`
- **`DamRow`** — `capacity`, `percent`, `inflow`, `released`, `reportDate`, `damGroup` (`main` / `east`)
- **`FlowRow`** — `level` (always `null` for now; ThaiWater's flow feed has no level)
- **`RainRow`** — no extra fields

## 🔌 API Routes

All routes are `GET`, take no parameters, and share one handler (`lib/sourceRoute.ts`).

**Success (HTTP 200):**

```json
{
  "rows": [ { "id": "road-FL.SNN.01", "kind": "road", "value": 63.9, "unit": "ซม.", "...": "..." } ],
  "fetchedAt": "2026-09-26T15:05:12.000Z"
}
```

`fetchedAt` is when the server last fetched the upstream, not the measurement time (that's each row's `observedAt`).

**Upstream failed, earlier data cached (HTTP 200):**

```json
{ "rows": [ "...last good rows..." ], "fetchedAt": "...", "stale": true, "error": "แหล่งข้อมูลต้นทางไม่ตอบสนอง" }
```

**Upstream failed, nothing cached yet (HTTP 502):**

```json
{ "rows": [], "fetchedAt": null, "stale": true, "error": "แหล่งข้อมูลต้นทางไม่ตอบสนอง" }
```

The public error message is always generic; the real error is logged on the server as `[api/<key>] <error>`.

| Route | Upstream | Server TTL | Upstream timeout |
| --- | --- | --- | --- |
| `/api/bangkok` | BMA water summary | 5 min | 30 s |
| `/api/roads` | BMA flood page + ThaiWater `flood_road` | 5 min | 45 s (BMA), 20 s (ThaiWater) |
| `/api/regional` | ThaiWater `waterlevel_load` | 5 min | 20 s |
| `/api/rain` | ThaiWater `rain_24h` | 5 min | 20 s |
| `/api/flow` | ThaiWater `flow` | 5 min | 20 s |
| `/api/dams` | RID dam API | 60 min | 15 s |

Other routes: `/login` redirects to `/` (307). Unknown paths render a branded 404 (`app/not-found.tsx`).

## 🛡️ Caching, Timeouts & Upstream Protection

The upstreams are public government services, some of them slow, so the server is deliberately gentle with them.

1. **TTL cache** (`lib/cache.ts`) — each source is fetched at most once per TTL (5 min, dams 60 min), regardless of visitor count.
2. **In-flight dedup** — if a fetch is already running, concurrent requests wait for it instead of starting another.
3. **Failure backoff** — after an upstream error, that source isn't retried for 60 s; requests in that window get the stale cache (or a 502). A burst of traffic during an outage therefore can't turn this server into a hammer against a struggling government site.
4. **Stale fallback** — the last successful result is kept indefinitely and served with `stale: true` when a refresh fails.
5. **Serialized BMA requests** (`lib/sources/bmaPage.ts`) — `weather.bangkok.go.th` answers concurrent requests with **403**. All BMA page fetches go through a single queue, and a 403 is retried once after 3 s.
6. **CDN headers** — successful responses send `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`, so a CDN in front can absorb most traffic. Failures send `no-store`.

The cache lives in process memory: it resets on restart, and each serverless instance has its own copy.

## 🔄 Client Data Lifecycle

`lib/useWaterData.ts` manages polling in the browser:

- On mount, all six sources are requested in parallel.
- Every 15 s the hook checks which sources are **due**: 5 min after a good response (dams 60 min), or 60 s after a stale or failed one.
- A `running` guard stops a new round from starting while the previous one is still in flight (BMA can take 30–50 s).
- Each browser request times out after 90 s (enough for a cold `/api/roads`).
- Polling pauses while the tab is hidden, and runs immediately when the tab becomes visible again or the browser comes back online.
- The **รีเฟรช** button forces all sources to refresh now (the server still answers from cache if it's fresh).
- A failed request keeps the previous rows and marks the group stale, so the screen never goes blank.

## 🖥️ UI Walkthrough

### Header

Sticky, frosted navbar with the Floodline wordmark, "by Pasu Nimsuwan", section links, a live "x/6 แหล่งข้อมูลพร้อม" counter, and the refresh button. On small screens the section links scroll horizontally under the bar.

### Hero & KPIs

| KPI | Definition |
| --- | --- |
| ถนนมีน้ำขังตอนนี้ | Road sensors (not underpasses) with fresh readings > 0 cm; footer shows how many are 20 cm+ |
| สถานีเฝ้าระวัง / วิกฤติ | Water stations whose status is alert, critical, high, overflow or critically low |
| เจ้าพระยา · ปากคลองตลาด | Latest level at BMA station `WL.PKG.01` |
| พื้นที่รับน้ำได้อีก · 4 เขื่อนหลัก | Σ(normal capacity − current volume) of the 4 main dams; only shown when all 4 report for the same date |

Below the cards: the Bangkok canal with the highest flow right now.

### Map

- **Layers:** ระดับน้ำ (water level), น้ำท่วมถนน (road flooding), ฝน 24 ชม. (rain), เขื่อน (dams + canal flow)
- **Filters:** province (default "กทม. + ปริมณฑล" = Bangkok, Nonthaburi, Pathum Thani, Samut Prakan, Samut Sakhon, Nakhon Pathom), district, and water status (water layer only). Provinces with no data in the current layer are disabled.
- **Markers:** colored by status/severity. Flooded road sensors are drawn larger and on top of dry ones.
- **Hover** shows a tooltip; **click** pins the station in the side panel.
- **Side panel:** counts per status (water layer: tap to filter map and table; tap again to clear), then the selected station's value, status, thresholds or flood details, source and link.
- The map re-fits to the visible stations whenever the layer or filters change, and flies to a station selected from any list.
- Selecting a station outside the current filter clears the filter so it becomes visible. Switching to the dam layer resets the area to all provinces, since the dams are far outside Bangkok.

### เลี่ยงถนนที่มีน้ำขัง (flooded roads)

- Chips with counts per severity
- All currently wet road sensors in the selected area, deepest first: road name, district, flooding since, peak, depth
- Underpass cards: "ผ่านได้" / "มีน้ำขัง" / "ไม่รายงาน", with depth per direction
- A note on sensor coverage, stepped sensors and how many sensors are silent

### Dams & flow

The 4 main dams with % full, current volume and remaining capacity; the top 8 Bangkok canals by flow; eastern-basin dam cards.

### Stations table

Every water-level station in the selected area and status: critical/overflow first, then alert/high, normal/low, and stale last; alphabetical within each group.

### Rain

Top 5 stations by 24h rainfall in the selected area (stale readings excluded), with a relative bar, plus a "what to watch" list.

### Sources

A collapsible panel describing sources, refresh cadence and staleness rules.

## 🚦 Status, Severity & Staleness Rules

### Water level status

| Key | Label | Source | Color |
| --- | --- | --- | --- |
| `normal` | ปกติ | BMA / ThaiWater (30–70% of bank) | `#168b78` |
| `alert` | เตือนภัย | BMA threshold | `#d39516` |
| `critical` | วิกฤติ | BMA threshold | `#d74754` |
| `high` | น้ำมาก | ThaiWater, 70–100% of bank | `#287fb6` |
| `overflow` | น้ำล้นตลิ่ง | ThaiWater, > 100% of bank | `#d74754` |
| `low` | น้ำน้อย | ThaiWater, 10–30% of bank | `#d39516` |
| `lowcritical` | น้ำน้อยวิกฤติ | ThaiWater, < 10% of bank | `#b4672b` |
| `unknown` | เก่า / ขัดข้อง / ไม่มีเกณฑ์ | No value, stale, or no threshold | `#84919b` |

ThaiWater's `situation_level` 1–5 buckets the water level as a percentage of bank height; the mapping above was verified against `storage_percent` on live data.

### Road flood severity

| Severity | Depth | Color |
| --- | --- | --- |
| หนัก (severe) | ≥ 20 cm | `#a8203a` |
| ปานกลาง (moderate) | 10 – < 20 cm | `#d74754` |
| เล็กน้อย (minor) | > 0 – < 10 cm | `#d39516` |
| ไม่มีน้ำขัง (dry) | 0 cm | `#168b78` |
| ไม่รายงาน (unknown) | no value or stale | `#84919b` |

These tiers are Floodline's own guidance, not an official BMA classification.

### Stepped road sensors

BMA's newer road sensors (`flood_system_id = 2`, 139 of 236) only ever report 0, 5, 10, 15 or 20 cm, so their 20 is displayed as **"20+"**: the water may be deeper. This is **inferred from the data** (every value is a multiple of 5 and none exceed 20), not from BMA documentation.

### Staleness

A reading counts as stale (shown grey, labelled old/unavailable) when it is older than:

| Kind | Threshold |
| --- | --- |
| Water level | 60 min |
| Road sensor / underpass | 60 min |
| Rain 24h | 3 h |
| Canal flow | 3 h |
| Dam report | 48 h |

A timestamp more than 10 minutes in the future is also treated as stale (bad upstream clock). These thresholds indicate data freshness only; they are not alert thresholds.

## 🎨 Design System

Shared with [pasu.app](https://pasu.app) ("Warm Premium"), defined as Tailwind `@theme` tokens in `app/globals.css`:

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#f7f5f0` | Page background |
| `surface` | `#ffffff` | Cards |
| `subtle` | `#faf8f4` | Inner tiles, table header |
| `line` / `line-strong` | `#e8e4dc` / `#cfc9be` | Borders, hover borders |
| `ink` / `ink-muted` | `#1d1d1f` / `#6e6e73` | Text, primary buttons |
| `accent` / `accent-soft` | `#ff6b3d` / `#fff0ea` | The one accent color, notices |

Conventions:

- **Type:** Prompt 300–600 for text; JetBrains Mono (`.num`) for every number, with tabular figures
- **Shapes:** cards `rounded-[1.375rem]` (`.surface-card`); buttons, chips and the layer switcher are pills
- **Section header:** small tracked label (`.eyebrow`) + large tight title (`.section-title`), via `components/Section.tsx`
- **Motion:** hero `.reveal` fade-up, slow `.aurora` gradient glow, pulsing live dot; all disabled under `prefers-reduced-motion`
- **Light only:** `color-scheme: light`, matching pasu.app
- Status colors stay semantic (green/amber/red) and are never used for decoration

## 📁 Project Structure

```
app/
├── page.tsx               Dashboard: state, filters, all sections (client component)
├── layout.tsx             Fonts, metadata (title, author), viewport
├── globals.css            Design tokens, component classes, motion, Leaflet overrides
├── not-found.tsx          Branded 404
└── api/
    ├── bangkok/route.ts   BMA canal stations
    ├── roads/route.ts     BMA road flooding + underpasses (+ ThaiWater)
    ├── regional/route.ts  ThaiWater provincial water levels
    ├── rain/route.ts      ThaiWater 24h rainfall
    ├── flow/route.ts      ThaiWater canal flow
    └── dams/route.ts      RID dams
components/
├── SiteChrome.tsx         Navbar, footer, wordmark
├── Section.tsx            Section header + source note
├── WaterMap.tsx           Leaflet map, fit-to-bounds, fly-to-selection (client-only)
├── MapSidebar.tsx         Status summary, stack bar, selected-station detail
├── RoadFlood.tsx          Flooded-roads section, underpass cards, road summary
├── Kpis.tsx               KPI cards
├── AreaFilters.tsx        Province / district / status filters
├── DamList.tsx            Main dams list + meter
├── StationTable.tsx       Water-level table
├── RainList.tsx           Top-5 rainfall
└── StatusBadge.tsx        Status pill
lib/
├── brand.ts               Product name, tagline, description, author
├── types.ts               Normalized row types
├── sourceRoute.ts         Shared API route handler
├── cache.ts               TTL cache, in-flight dedup, failure backoff
├── useWaterData.ts        Client polling hook
├── status.ts              Water status labels/colors, staleness rules
├── roadFlood.ts           Road severity tiers, depth formatting
├── display.ts             Per-row color, label, value text, marker size, draw order
├── format.ts              Thai number/date formatting (Asia/Bangkok)
├── districts.ts           BMA district id → name / province
└── sources/
    ├── bmaPage.ts         Serialized BMA fetch, 403 retry, embedded-array parser, timezone
    ├── bma.ts             Canal water levels
    ├── roads.ts           Road sensors + underpasses, ThaiWater merge/fallback
    ├── thaiwater.ts       Water level, rain, flow, road-sensor feeds
    └── rid.ts             Dams + coordinate lookup
next.config.ts             Security headers, CSP, /login redirect
```

## 🛠️ Customization Guide

### Rename the product

Edit `lib/brand.ts`. The name, tagline, description and author feed the navbar, footer, hero, 404 page and `<head>` metadata.

### Change colors or fonts

Colors are tokens in the `@theme` block of `app/globals.css`. Fonts are loaded in `app/layout.tsx` and wired through `--font-prompt` / `--font-jetbrains`.

### Show another dam

Add its RID `id` to `DAM_META` in `lib/sources/rid.ts` with coordinates, province, area and group (`main` or `east`). To make it one of the "4 main dams", also update `MAIN_DAM_IDS` in `app/page.tsx`.

### Change the default area

Edit `DEFAULT_PROVINCES` in `components/AreaFilters.tsx` and the initial `province` state in `app/page.tsx`.

### Change refresh cadence

- Server cache TTL: the second argument of `sourceRoute(...)` in `app/api/<source>/route.ts`
- Browser polling: `REFRESH_MS` in `lib/useWaterData.ts`

Keep the server TTL ≤ the browser interval, or the browser will just receive the same cached data.

### Add a new data source

1. Write an adapter in `lib/sources/` that returns rows of an existing kind, or add a new kind to `lib/types.ts` (plus `STALE_MS` in `lib/status.ts` and color/label rules in `lib/display.ts`).
2. Create `app/api/<key>/route.ts`:
   ```ts
   import { sourceRoute } from "@/lib/sourceRoute";
   import { fetchMySource } from "@/lib/sources/mysource";

   export const dynamic = "force-dynamic";
   export const GET = sourceRoute("<key>", 5 * 60_000, fetchMySource);
   ```
3. Add `<key>` to `SourceKey`, `SOURCE_KEYS` and `REFRESH_MS` in `lib/useWaterData.ts`.
4. Read `groups.<key>?.rows` in `app/page.tsx` and render it.
5. If the source is on a new domain that the **browser** loads (images, tiles), add it to the CSP in `next.config.ts`. Server-side fetches need no CSP change.

## 🔒 Security

Floodline has no login, no database and no user input that reaches the server, which keeps the attack surface small. What's in place:

- **No SSRF surface:** API routes take no parameters and call fixed upstream URLs only
- **Output encoding:** all upstream text is rendered as React text (escaped); upstream links are used only when they start with `https://`
- **Security headers** on every response (`next.config.ts`):
  - `Content-Security-Policy`: `default-src 'self'`; images from self, `data:` and `tile.openstreetmap.org`; fonts self-hosted; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri` / `form-action` self
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy`: camera, microphone, geolocation and payment disabled
  - `Strict-Transport-Security` (2 years) in production
  - `X-Powered-By` removed
- **No information leaks:** API errors return a generic Thai message; details stay in server logs
- **Upstream abuse protection:** cache, in-flight dedup, failure backoff and serialized BMA requests ([details](#-caching-timeouts--upstream-protection))
- **Dependencies:** `npm audit` reported 0 vulnerabilities at the time of writing

Known trade-off: the CSP allows `'unsafe-inline'` for scripts (Next.js hydration) and styles (Leaflet positioning). Moving to nonce-based CSP via `proxy.ts` would tighten this at the cost of disabling static rendering of the page.

## ☁️ Deployment

Floodline runs anywhere Next.js runs. Checklist before going public:

1. **Function timeout ≥ 60 s.** A cold `/api/roads` takes ~30–50 s. On Vercel, add `export const maxDuration = 60;` to `app/api/roads/route.ts` and `app/api/bangkok/route.ts` (Hobby plans may cap this lower; check your plan).
2. **Edge rate limiting.** The in-memory cache is per instance and can't count requests per IP across instances. Add a rate-limit rule in Vercel Firewall or Cloudflare for `/api/*`.
3. **Map tiles.** `tile.openstreetmap.org` has a [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) that doesn't allow heavy traffic. For real traffic, switch the `TileLayer` URL in `components/WaterMap.tsx` to a provider (MapTiler, Stadia, Carto…) and add its domain to `img-src` in `next.config.ts`.
4. **Region.** A server region close to Thailand (e.g. Singapore) makes upstream fetches faster.
5. **HTTPS.** HSTS is sent in production, so serve the site only over HTTPS.

### Vercel

```bash
npm i -g vercel
vercel        # preview
vercel --prod # production
```

Serverless instances start cold, so the first visitor after a quiet period waits for the upstream fetches. The `s-maxage` headers let Vercel's CDN serve most other requests.

### Self-hosted (VPS / Docker)

```bash
npm ci
npm run build
PORT=3000 npm start
```

A single long-running process is the best fit for this app: the in-memory cache stays warm and is shared by every visitor. Put it behind a reverse proxy (Caddy, Nginx) or Cloudflare for TLS and rate limiting.

## 🧯 Troubleshooting

| Symptom | Likely cause | What to do |
| --- | --- | --- |
| Flooded-road list says "กำลังอ่านเซ็นเซอร์…" for a long time | Cold start: BMA's flood page is slow and queued behind the water page | Wait ~50 s. If it never arrives, check server logs for `[api/roads]` |
| Road list has no underpasses and no "ขังตั้งแต่" times | BMA failed; the ThaiWater fallback is showing | Usually temporary; next refresh retries after 60 s |
| Server log shows `HTTP 403` from `weather.bangkok.go.th` | BMA's WAF blocked a burst of requests | Retried once automatically. If it persists, BMA may be blocking your server's IP; lower traffic or wait |
| Header counter shows fewer than 6 sources | One or more upstreams failing | The affected data shows as stale; check `/api/<key>` directly |
| Map tiles don't load | Blocked network, or a changed tile URL not in the CSP | Check the browser console for CSP errors; update `img-src` in `next.config.ts` |
| Everything grey ("ข้อมูลเก่า") | Your computer's clock is wrong, or the upstream stopped updating | Check system time; compare with the source site |
| A dam is missing | It isn't in `DAM_META`, or RID didn't report it today | See [Show another dam](#show-another-dam) |
| `/api/bangkok` suddenly fails with "not found" | BMA changed its page structure (`waterSummaryList` renamed) | Inspect the page source and update the marker in `lib/sources/bma.ts` |
| `Another next dev server is already running` | A dev server is already running for this folder | Use the running one, or stop it first |

## 🚧 Known Limitations

- **Scraping:** BMA data is read from page HTML. If BMA changes its page, `/api/bangkok` and `/api/roads` will fail until the adapter is updated (roads falls back to ThaiWater).
- **No Chao Phraya dam discharge:** ThaiWater's public flow feed covers only Bangkok canals, so there's no C.13 (Chao Phraya Dam) figure.
- **Dam coordinates are hand-maintained** in `lib/sources/rid.ts`.
- **Coverage:** sensors measure only where they're installed; roads without sensors can still flood.
- **Stepped sensors:** "20+" readings don't tell you how far above 20 cm the water is.
- **Per-instance cache:** on serverless platforms, each instance fetches and caches independently.
- **No forecasts:** everything shown is measured or reported data, never a prediction.

## 👤 Author

Designed and built by **Pasu Nimsuwan**
[pasu.app](https://pasu.app) · Bangkok, Thailand
