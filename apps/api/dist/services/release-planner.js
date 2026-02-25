const SOURCE_URL = 'https://releaseplans.microsoft.com/en-US/releaseplanner-json/?productId=e72f17ac-715d-e911-a968-000d3a4e32b5&langCode=en-US';
const RELEASE_PLANS_BASE_URL = 'https://releaseplans.microsoft.com/en-US/';
const LEARN_BASE_URL = 'https://learn.microsoft.com';
let cached;
function toStartOfTodayUtc() {
    const now = new Date();
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}
function formatDateUtc(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function parseUsDateToUtc(dateStr) {
    const trimmed = dateStr.trim();
    if (!trimmed)
        return null;
    const match = /^([0-1]?\d)\/([0-3]?\d)\/(\d{4})$/.exec(trimmed);
    if (!match)
        return null;
    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (!month || month > 12 || !day || day > 31)
        return null;
    return new Date(Date.UTC(year, month - 1, day));
}
function getStringField(item, key) {
    const value = item[key];
    return typeof value === 'string' ? value : '';
}
function getFirstStringField(item, keys) {
    for (const key of keys) {
        const value = getStringField(item, key).trim();
        if (value)
            return value;
    }
    return '';
}
function toAbsoluteLearnUrl(urlOrPath) {
    const value = (urlOrPath || '').trim();
    if (!value)
        return undefined;
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return `${LEARN_BASE_URL}${normalizedPath}`;
}
function toAbsoluteReleasePlansUrl(path) {
    const value = (path || '').trim();
    if (!value)
        return undefined;
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    const normalizedPath = value.startsWith('/') ? value.slice(1) : value;
    return `${RELEASE_PLANS_BASE_URL}${normalizedPath}`;
}
async function fetchJsonWithTimeout(url, timeoutMs) {
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
    }
    finally {
        clearTimeout(timeoutId);
    }
}
export async function getCopilotStudioReleasePlannerData(options) {
    const cacheTtlMs = options?.cacheTtlMs ?? 6 * 60 * 60 * 1000; // 6h
    const maxItemsPerSection = options?.maxItemsPerSection ?? 15;
    if (cached && Date.now() - cached.fetchedAtMs < cacheTtlMs) {
        return cached.payload;
    }
    const raw = (await fetchJsonWithTimeout(SOURCE_URL, 20000));
    const results = Array.isArray(raw?.results) ? raw.results : [];
    const todayUtcMs = toStartOfTodayUtc();
    const isCopilotSignal = (value) => {
        const normalized = value.toLowerCase();
        return (normalized.includes('copilot studio') ||
            normalized.includes('microsoft copilot studio') ||
            normalized.includes('copilot for power apps') ||
            normalized.includes('agent builder') ||
            normalized.includes('agent feed'));
    };
    const matches = results.filter((r) => {
        if (!r || typeof r !== 'object')
            return false;
        const item = r;
        const productName = getFirstStringField(item, ['Product', 'Product name']);
        const productArea = getFirstStringField(item, ['ProductArea', 'Product area']);
        const featureName = getFirstStringField(item, ['FeatureName', 'Feature name']);
        const featureDetails = getFirstStringField(item, ['FeatureDetails', 'Feature details']);
        return (isCopilotSignal(productName) ||
            isCopilotSignal(productArea) ||
            isCopilotSignal(featureName) ||
            isCopilotSignal(featureDetails));
    });
    const effectiveMatches = matches.length > 0 ? matches : results;
    const upcomingPublicPreview = [];
    const upcomingGA = [];
    // 6 months in milliseconds
    const sixMonthsMs = 6 * 30 * 24 * 60 * 60 * 1000;
    const sixMonthsAgoMs = todayUtcMs - sixMonthsMs;
    // 1 year in milliseconds
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const oneYearAgoMs = todayUtcMs - oneYearMs;
    for (const item of effectiveMatches) {
        const featureName = getFirstStringField(item, ['FeatureName', 'Feature name']);
        const releasePlanId = getFirstStringField(item, ['ReleasePlanID', 'Release Plan ID']) || undefined;
        const ppDateStr = getFirstStringField(item, ['PublicPreviewDate', 'Public preview date']);
        const gaDateStr = getFirstStringField(item, ['GADate', 'GA date']);
        const ppWave = getFirstStringField(item, ['ReleaseWaveName', 'Public Preview Release Wave']) || undefined;
        const gaWave = getFirstStringField(item, ['GAReleaseWaveName', 'GA Release Wave']) || undefined;
        const docsUrlRaw = getFirstStringField(item, ['DocsUrl', 'docUrl']);
        const articlePathRaw = getFirstStringField(item, ['ArticlePath']);
        const featureUrl = toAbsoluteLearnUrl(docsUrlRaw) || toAbsoluteReleasePlansUrl(articlePathRaw);
        const ppDate = parseUsDateToUtc(ppDateStr);
        const gaDate = parseUsDateToUtc(gaDateStr);
        // Include in "In Public Preview" if:
        // 1. Has preview date in past/today AND no GA date, OR
        // 2. Has GA date less than 6 months in the past (but not in future)
        // And exclude anything with a date older than 1 year
        const hasPreviewWithoutGA = !!ppDate && ppDate.getTime() <= todayUtcMs && !gaDate;
        const hasRecentGA = gaDate && gaDate.getTime() >= sixMonthsAgoMs && gaDate.getTime() <= todayUtcMs;
        // Use the preview date if available, otherwise use GA date for filtering
        const primaryDate = ppDate || gaDate;
        const isWithin1Year = primaryDate && primaryDate.getTime() >= oneYearAgoMs;
        if ((hasPreviewWithoutGA || hasRecentGA) && isWithin1Year) {
            upcomingPublicPreview.push({
                date: formatDateUtc(ppDate || gaDate),
                featureName: featureName || '(Unnamed feature)',
                featureUrl,
                releaseWave: ppWave || gaWave,
                releasePlanId,
            });
        }
        if (gaDate && gaDate.getTime() >= todayUtcMs) {
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
    const payload = {
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
