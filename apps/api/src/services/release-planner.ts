type ReleasePlannerRawResponse = {
  morerecords?: boolean;
  totalrecords?: string;
  results?: Array<Record<string, unknown>>;
};

export type ReleasePlannerMilestoneItem = {
  date: string; // YYYY-MM-DD
  featureName: string;
  featureUrl?: string;
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

// productId 1019ec3d-1dc5-e911-a969-000d3a4f36ce is the Microsoft Copilot Studio product
const SOURCE_URL =
  'https://releaseplans.microsoft.com/en-US/releaseplanner-json/?productId=1019ec3d-1dc5-e911-a969-000d3a4f36ce&langCode=en-US';

const RELEASE_PLANS_BASE_URL = 'https://releaseplans.microsoft.com/en-US/';
const LEARN_BASE_URL = 'https://learn.microsoft.com';

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

function getFirstStringField(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = getStringField(item, key).trim();
    if (value) return value;
  }
  return '';
}

function toAbsoluteLearnUrl(urlOrPath: string): string | undefined {
  const value = (urlOrPath || '').trim();
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${LEARN_BASE_URL}${normalizedPath}`;
}

function toAbsoluteReleasePlansUrl(path: string): string | undefined {
  const value = (path || '').trim();
  if (!value) return undefined;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
  return `${RELEASE_PLANS_BASE_URL}${normalizedPath}`;
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

  // All items from the Copilot Studio product endpoint are relevant — no signal filtering needed.
  const effectiveMatches = results.filter((r) => r && typeof r === 'object') as Array<
    Record<string, unknown>
  >;

  const upcomingPublicPreview: ReleasePlannerMilestoneItem[] = [];
  const upcomingGA: ReleasePlannerMilestoneItem[] = [];

  // 6 months in milliseconds
  const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
  const sixMonthsAgoMs = todayUtcMs - sixMonthsMs;

  // 1 year in milliseconds
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const oneYearAgoMs = todayUtcMs - oneYearMs;

  for (const item of effectiveMatches) {
    const featureName = getFirstStringField(item, ['FeatureName', 'Feature name']);
    const releasePlanId =
      getFirstStringField(item, ['ReleasePlanID', 'Release Plan ID']) || undefined;

    const ppDateStr = getFirstStringField(item, ['PublicPreviewDate', 'Public preview date']);
    const gaDateStr = getFirstStringField(item, ['GADate', 'GA date']);

    const ppWave =
      getFirstStringField(item, ['ReleaseWaveName', 'Public Preview Release Wave']) || undefined;
    const gaWave = getFirstStringField(item, ['GAReleaseWaveName', 'GA Release Wave']) || undefined;

    const docsUrlRaw = getFirstStringField(item, ['DocsUrl', 'docUrl']);
    const articlePathRaw = getFirstStringField(item, ['ArticlePath']);
    const featureUrl = toAbsoluteLearnUrl(docsUrlRaw) || toAbsoluteReleasePlansUrl(articlePathRaw);

    const ppDate = parseUsDateToUtc(ppDateStr);
    const gaDate = parseUsDateToUtc(gaDateStr);

    // Use status fields to correctly determine shipment state — the release planner
    // keeps items as "Planned" even after their scheduled date if they haven't shipped.
    const gaStatus = getFirstStringField(item, ['GAStatus']);
    const gaHasShipped = gaStatus === 'Shipped';

    // Include in "Public Preview" section if:
    // 1. Has a preview date AND GA hasn't shipped yet — this covers all active previews
    //    regardless of how long they've been in preview (no artificial 1-year cutoff
    //    when GA has not yet occurred, including features with no GA date at all)
    // 2. OR, has a recent GA (within past 6 months)
    const gaNotYetShipped = !gaDate || !gaHasShipped || gaDate.getTime() >= todayUtcMs;
    const ppHasDate = !!ppDate;
    const hasRecentGA =
      gaHasShipped &&
      gaDate &&
      gaDate.getTime() >= sixMonthsAgoMs &&
      gaDate.getTime() <= todayUtcMs;

    if ((ppHasDate && gaNotYetShipped) || hasRecentGA) {
      upcomingPublicPreview.push({
        date: formatDateUtc(ppDate || gaDate!),
        featureName: featureName || '(Unnamed feature)',
        featureUrl,
        releaseWave: ppWave || gaWave,
        releasePlanId,
      });
    }

    // Include in "Upcoming GA" if: has a GA date AND either it's in the future OR
    // status is still Planned (i.e. not yet shipped even if scheduled date passed)
    if (gaDate && (gaDate.getTime() >= todayUtcMs || (gaStatus === 'Planned' && !gaHasShipped))) {
      upcomingGA.push({
        date: formatDateUtc(gaDate),
        featureName: featureName || '(Unnamed feature)',
        featureUrl,
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
    totalMatchingItems: effectiveMatches.length,
    upcomingPublicPreview: upcomingPublicPreview.slice(0, maxItemsPerSection),
    upcomingGA: upcomingGA.slice(0, maxItemsPerSection),
  };

  cached = { fetchedAtMs: Date.now(), payload };
  return payload;
}
