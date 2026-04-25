const HN_API = 'https://hacker-news.firebaseio.com/v0';
const AI_KEYWORDS = ['llm', 'gpt', 'claude', 'gemini', 'openai', 'anthropic', 'mistral',
    'model', 'ai ', ' ai', 'machine learning', 'deep learning', 'neural', 'transformer',
    'diffusion', 'hugging face', 'arxiv', 'benchmark', 'inference', 'fine-tun'];
function isAiRelated(title) {
    const lower = title.toLowerCase();
    return AI_KEYWORDS.some((kw) => lower.includes(kw));
}
export async function fetchHackerNews() {
    try {
        const res = await fetch(`${HN_API}/topstories.json`);
        const ids = await res.json();
        const items = await Promise.allSettled(ids.slice(0, 60).map((id) => fetch(`${HN_API}/item/${id}.json`).then((r) => r.json())));
        const results = [];
        for (const result of items) {
            if (result.status !== 'fulfilled')
                continue;
            const item = result.value;
            if (!item?.url || !item?.title || item.type !== 'story')
                continue;
            if (!isAiRelated(item.title))
                continue;
            results.push({
                url: item.url,
                title: item.title,
                source: 'Hacker News',
                category: 'ai_llm',
                excerpt: null,
                published_at: item.time ? new Date(item.time * 1000).toISOString() : null,
            });
        }
        return results;
    }
    catch (err) {
        console.warn('HN fetch failed:', err.message);
        return [];
    }
}
