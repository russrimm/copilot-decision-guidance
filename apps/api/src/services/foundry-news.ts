export type FoundryNewsItem = {
  title: string;
  link: string;
  pubDate: string;
  isoDate: string;
  summary: string;
};

export type FoundryNewsResponse = {
  sourceUrl: string;
  fetchedAt: string;
  totalItems: number;
  items: FoundryNewsItem[];
};

const DEFAULT_SOURCE_URLS = [
  'https://devblogs.microsoft.com/foundry/feed/',
  'https://devblogs.microsoft.com/foundry/feed',
  'https://devblogs.microsoft.com/category/foundry/feed/',
];

let cached:
  | {
      fetchedAtMs: number;
      payload: FoundryNewsResponse;
    }
  | undefined;

function decodeHtmlEntities(input: string): string {
  const namedEntities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };

  return input.replace(/&(#(?:x[\da-fA-F]+|\d+)|[a-zA-Z]+);/g, (fullMatch, entityBody) => {
    if (entityBody.startsWith('#x') || entityBody.startsWith('#X')) {
      const codePoint = Number.parseInt(entityBody.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fullMatch;
    }

    if (entityBody.startsWith('#')) {
      const codePoint = Number.parseInt(entityBody.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fullMatch;
    }

    return namedEntities[entityBody] ?? fullMatch;
  });
}

function stripHtml(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagContent(xml: string, tag: string): string {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
  return match?.[1]?.trim() ?? '';
}

async function fetchTextWithTimeout(url: string, timeoutMs: number): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Foundry feed request failed: ${res.status} ${res.statusText}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

function getCandidateSourceUrls(): string[] {
  const configuredSource = process.env.FOUNDRY_NEWS_FEED_URL?.trim();

  if (!configuredSource) {
    return DEFAULT_SOURCE_URLS;
  }

  if (configuredSource.includes(',')) {
    return configuredSource
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [configuredSource, ...DEFAULT_SOURCE_URLS.filter((url) => url !== configuredSource)];
}

async function fetchFoundryFeedXml(timeoutMs: number): Promise<{ sourceUrl: string; xml: string }> {
  const candidates = getCandidateSourceUrls();
  const failures: string[] = [];

  for (const candidateUrl of candidates) {
    try {
      const xml = await fetchTextWithTimeout(candidateUrl, timeoutMs);
      return { sourceUrl: candidateUrl, xml };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      failures.push(`${candidateUrl} -> ${reason}`);
    }
  }

  throw new Error(`All Foundry feed sources failed: ${failures.join(' | ')}`);
}

export async function getFoundryNews(options?: {
  cacheTtlMs?: number;
  maxItems?: number;
}): Promise<FoundryNewsResponse> {
  const cacheTtlMs = options?.cacheTtlMs ?? 30 * 60 * 1000;
  const maxItems = options?.maxItems ?? 15;

  if (cached && Date.now() - cached.fetchedAtMs < cacheTtlMs) {
    return cached.payload;
  }

  const { sourceUrl, xml } = await fetchFoundryFeedXml(15000);
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  const items: FoundryNewsItem[] = itemMatches
    .map((match) => {
      const itemXml = match[1] ?? '';
      const title = stripHtml(getTagContent(itemXml, 'title'));
      const link = stripHtml(getTagContent(itemXml, 'link'));
      const pubDateRaw = stripHtml(getTagContent(itemXml, 'pubDate'));
      const description = getTagContent(itemXml, 'description');
      const content = getTagContent(itemXml, 'content:encoded');
      const summarySource = content || description;
      const summary = stripHtml(summarySource).slice(0, 260);

      const parsedDate = pubDateRaw ? new Date(pubDateRaw) : new Date();
      const isoDate = Number.isNaN(parsedDate.getTime())
        ? new Date().toISOString()
        : parsedDate.toISOString();

      return {
        title: title || 'Untitled article',
        link,
        pubDate: pubDateRaw || 'Unknown date',
        isoDate,
        summary,
      };
    })
    .filter((item) => item.link)
    .sort((a, b) => b.isoDate.localeCompare(a.isoDate))
    .slice(0, maxItems);

  const payload: FoundryNewsResponse = {
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    totalItems: items.length,
    items,
  };

  cached = { fetchedAtMs: Date.now(), payload };
  return payload;
}
