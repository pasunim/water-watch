const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

async function fetchOnce(url: string, timeoutMs: number): Promise<Response> {
  return fetch(url, { headers: BROWSER_HEADERS, cache: "no-store", signal: AbortSignal.timeout(timeoutMs) });
}

async function fetchWithRetry(url: string, timeoutMs: number): Promise<string> {
  let res = await fetchOnce(url, timeoutMs);
  if (res.status === 403) {
    await new Promise((r) => setTimeout(r, 3000));
    res = await fetchOnce(url, timeoutMs);
  }
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.text();
}

// weather.bangkok.go.th answers concurrent requests with 403, so requests to it run one at a time.
let queue: Promise<unknown> = Promise.resolve();

export function fetchBmaHtml(url: string, timeoutMs: number): Promise<string> {
  const run = queue.then(() => fetchWithRetry(url, timeoutMs));
  queue = run.catch(() => undefined);
  return run;
}

/** BMA pages embed their data as inline JS array literals (`name = [...]`); pull one out as JSON. */
export function extractEmbeddedArray<T>(html: string, marker: string): T[] {
  const idx = html.indexOf(marker);
  if (idx === -1) throw new Error(`BMA page: "${marker}" not found`);
  let i = html.indexOf("[", idx + marker.length);
  const start = i;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw new Error(`BMA page: "${marker}" array is truncated`);
}

/** BMA timestamps are Bangkok local time without an offset. */
export function bmaTime(ts: string | null | undefined): string | null {
  return ts ? `${ts}+07:00` : null;
}
