type ReleasePlannerRawResponse = {
  morerecords?: boolean;
  totalrecords?: string;
  results?: Array<Record<string, unknown>>;
};

export type ReleasePlannerMilestoneItem = {
  date: string; // YYYY-MM-DD
  featureName: string;
  releaseWave?: string;
  releasePlanId?: string;
};

export type CopilotStudioReleasePlannerResponse = {
  sourceUrl: string;
  fetchedAt: string;
  product: string;
  totalMatchingItems: number;
  upcomingPublicPreview: ReleasePlannerMilestoneItem[];
  upcomingGA: ReleasePlannerMilestoneItem[];
};

const SOURCE_URL = 'https://aka.ms/ReleasePlans/Planner/API/AllPlans';

let cached:
  | {
      fetchedAtMs: number;
      payload: CopilotStudioReleasePlannerResponse;
    }
  | undefined;

function toStartOfTodayUtc(): number {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

function formatDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseUsDateToUtc(dateStr: string): Date | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  const match = /^([0-1]?\d)\/([0-3]?\d)\/(\d{4})$/.exec(trimmed);
  if (!match) return null;
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!month || month > 12 || !day || day > 31) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function getStringField(item: Record<string, unknown>, key: string): string {
  const value = item[key];
  return typeof value === 'string' ? value : '';
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        // Avoid overly aggressive caching by intermediaries
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Release Planner API request failed: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function getCopilotStudioReleasePlannerData(options?: {
  cacheTtlMs?: number;
  maxItemsPerSection?: number;
}): Promise<CopilotStudioReleasePlannerResponse> {
  const cacheTtlMs = options?.cacheTtlMs ?? 6 * 60 * 60 * 1000; // 6h
  const maxItemsPerSection = options?.maxItemsPerSection ?? 15;

  if (cached && Date.now() - cached.fetchedAtMs < cacheTtlMs) {
    return cached.payload;
  }

  const raw = (await fetchJsonWithTimeout(SOURCE_URL, 20000)) as ReleasePlannerRawResponse;
  const results = Array.isArray(raw?.results) ? raw.results : [];

  const todayUtcMs = toStartOfTodayUtc();

  const matches = results.filter((r) => {
    if (!r || typeof r !== 'object') return false;
    const productName = getStringField(r as Record<string, unknown>, 'Product name');
    return productName.toLowerCase().includes('microsoft copilot studio') || 
           productName.toLowerCase().includes('copilot studio');
  }) as Array<Record<string, unknown>>;


  const upcomingPublicPreview: ReleasePlannerMilestoneItem[] = [];
  const upcomingGA: ReleasePlannerMilestoneItem[] = [];

  for (const item of matches) {
    const featureName = getStringField(item, 'Feature name').trim();
    const releasePlanId = getStringField(item, 'Release Plan ID').trim() || undefined;

    const ppDateStr = getStringField(item, 'Public preview date');
    const gaDateStr = getStringField(item, 'GA date');

    const ppWave = getStringField(item, 'Public Preview Release Wave').trim() || undefined;
    const gaWave = getStringField(item, 'GA Release Wave').trim() || undefined;

    const ppDate = parseUsDateToUtc(ppDateStr);
    if (ppDate && ppDate.getTime() >= todayUtcMs) {
      upcomingPublicPreview.push({
        date: formatDateUtc(ppDate),
        featureName: featureName || '(Unnamed feature)',
        releaseWave: ppWave,
        releasePlanId,
      });
    }

    const gaDate = parseUsDateToUtc(gaDateStr);
    if (gaDate && gaDate.getTime() >= todayUtcMs) {
      upcomingGA.push({
        date: formatDateUtc(gaDate),
        featureName: featureName || '(Unnamed feature)',
        releaseWave: gaWave,
        releasePlanId,
      });
    }
  }

  upcomingPublicPreview.sort((a, b) => a.date.localeCompare(b.date));
  upcomingGA.sort((a, b) => a.date.localeCompare(b.date));

  const payload: CopilotStudioReleasePlannerResponse = {
    sourceUrl: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    product: 'Copilot Studio',
    totalMatchingItems: matches.length,
    upcomingPublicPreview: upcomingPublicPreview.slice(0, maxItemsPerSection),
    upcomingGA: upcomingGA.slice(0, maxItemsPerSection),
  };

  cached = { fetchedAtMs: Date.now(), payload };
  return payload;
}
