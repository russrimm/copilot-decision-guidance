const SOURCE_URL = 'https://devblogs.microsoft.com/foundry/feed/';
let cached;
function decodeHtmlEntities(input) {
    return input
        .replaceAll('&amp;', '&')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replaceAll('&#8217;', "'")
        .replaceAll('&#8220;', '"')
        .replaceAll('&#8221;', '"')
        .replaceAll('&#8211;', '-')
        .replaceAll('&#8212;', '-');
}
function stripHtml(input) {
    return decodeHtmlEntities(input)
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function getTagContent(xml, tag) {
    const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
    return match?.[1]?.trim() ?? '';
}
async function fetchTextWithTimeout(url, timeoutMs) {
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
    }
    finally {
        clearTimeout(timeoutId);
    }
}
export async function getFoundryNews(options) {
    const cacheTtlMs = options?.cacheTtlMs ?? 30 * 60 * 1000;
    const maxItems = options?.maxItems ?? 15;
    if (cached && Date.now() - cached.fetchedAtMs < cacheTtlMs) {
        return cached.payload;
    }
    const xml = await fetchTextWithTimeout(SOURCE_URL, 15000);
    const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    const items = itemMatches
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
    const payload = {
        sourceUrl: SOURCE_URL,
        fetchedAt: new Date().toISOString(),
        totalItems: items.length,
        items,
    };
    cached = { fetchedAtMs: Date.now(), payload };
    return payload;
}
