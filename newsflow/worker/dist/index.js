import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fetchRssFeeds } from './sources/rss.js';
import { fetchHackerNews } from './sources/hackernews.js';
import { fetchReddit } from './sources/reddit.js';
import { fetchGithubReleases } from './sources/github.js';
import { fetchGNews } from './sources/gnews.js';
import { crawlIndiaSources } from './sources/crawler.js';
import { generateInsight } from './ai-insight.js';
const POLL_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
        throw new Error('Missing Supabase env vars');
    return createClient(url, key);
}
async function ingestArticles(articles) {
    const supabase = getSupabase();
    let inserted = 0;
    let aiTagged = 0;
    for (const article of articles) {
        // Generate AI insight (skipped gracefully if no API key)
        const ai_insight = await generateInsight(article.title, article.excerpt);
        if (ai_insight)
            aiTagged++;
        const { error } = await supabase
            .from('articles')
            .insert({
            url: article.url,
            title: article.title,
            source: article.source,
            category: article.category,
            excerpt: article.excerpt,
            ai_insight,
            published_at: article.published_at,
        })
            .select('id')
            .maybeSingle();
        // ON CONFLICT on url — Supabase returns a constraint error we swallow
        if (!error || error.code === '23505') {
            if (!error)
                inserted++;
        }
        else {
            console.warn('Insert error:', error.message);
        }
    }
    return { total: articles.length, inserted, aiTagged };
}
async function runPoll() {
    console.log(`[${new Date().toISOString()}] Starting poll…`);
    const [rss, hn, reddit, github, gnews, crawled] = await Promise.allSettled([
        fetchRssFeeds(),
        fetchHackerNews(),
        fetchReddit(),
        fetchGithubReleases(),
        fetchGNews(),
        crawlIndiaSources(),
    ]);
    const all = [
        ...(rss.status === 'fulfilled' ? rss.value : []),
        ...(hn.status === 'fulfilled' ? hn.value : []),
        ...(reddit.status === 'fulfilled' ? reddit.value : []),
        ...(github.status === 'fulfilled' ? github.value : []),
        ...(gnews.status === 'fulfilled' ? gnews.value : []),
        ...(crawled.status === 'fulfilled' ? crawled.value : []),
    ];
    // Deduplicate by URL before hitting DB
    const seen = new Set();
    const deduped = all.filter((a) => {
        if (seen.has(a.url))
            return false;
        seen.add(a.url);
        return true;
    });
    console.log(`Fetched ${all.length} articles, ${deduped.length} unique`);
    const stats = await ingestArticles(deduped);
    console.log(`Inserted: ${stats.inserted}, AI tagged: ${stats.aiTagged}`);
}
async function main() {
    console.log('NewsFlow worker starting…');
    await runPoll();
    setInterval(runPoll, POLL_INTERVAL_MS);
}
main().catch((err) => {
    console.error('Worker crashed:', err);
    process.exit(1);
});
