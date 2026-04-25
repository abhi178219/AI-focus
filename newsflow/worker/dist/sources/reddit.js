const SUBREDDITS = [
    { subreddit: 'MachineLearning', category: 'ai_llm', source: 'r/MachineLearning' },
    { subreddit: 'LocalLLaMA', category: 'ai_llm', source: 'r/LocalLLaMA' },
    { subreddit: 'technology', category: 'dev_tools', source: 'r/technology' },
    { subreddit: 'IndiaInvestments', category: 'india_business', source: 'r/IndiaInvestments' },
];
export async function fetchReddit() {
    const results = [];
    await Promise.allSettled(SUBREDDITS.map(async ({ subreddit, category, source }) => {
        try {
            const res = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=15`, { headers: { 'User-Agent': 'NewsFlow/1.0 (news aggregator)' } });
            if (!res.ok)
                return;
            const data = await res.json();
            for (const post of data?.data?.children ?? []) {
                const p = post.data;
                if (!p?.url || !p?.title || p.is_self)
                    continue;
                results.push({
                    url: p.url,
                    title: p.title,
                    source,
                    category,
                    excerpt: p.selftext ? p.selftext.slice(0, 200) : null,
                    published_at: p.created_utc
                        ? new Date(p.created_utc * 1000).toISOString()
                        : null,
                });
            }
        }
        catch (err) {
            console.warn(`Reddit fetch failed for r/${subreddit}:`, err.message);
        }
    }));
    return results;
}
