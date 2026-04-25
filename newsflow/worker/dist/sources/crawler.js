import { PlaywrightCrawler } from 'crawlee';
const TARGETS = [
    {
        name: 'Entrackr',
        url: 'https://entrackr.com/',
        category: 'india_business',
        articleSelector: 'article, .post, .entry',
        titleSelector: 'h2, h3, .post-title, .entry-title',
        linkSelector: 'a',
        excerptSelector: '.excerpt, .summary, p',
    },
    {
        name: 'NDTV Tech',
        url: 'https://www.ndtv.com/technology',
        category: 'dev_tools',
        articleSelector: '.news_Itm, .nstory-widget, article',
        titleSelector: 'h2, h3, .newsHdng',
        linkSelector: 'a',
        excerptSelector: '.newsCont, p',
    },
];
async function isAllowedByCrawlers(siteUrl, userAgent = '*') {
    try {
        const robotsUrl = new URL('/robots.txt', siteUrl).href;
        const res = await fetch(robotsUrl, { signal: AbortSignal.timeout(5000) });
        if (!res.ok)
            return true; // If robots.txt missing, assume allowed
        const text = await res.text();
        const lines = text.split('\n').map((l) => l.trim());
        let applicable = false;
        let disallowed = false;
        for (const line of lines) {
            if (line.toLowerCase().startsWith('user-agent:')) {
                const agent = line.split(':')[1].trim();
                applicable = agent === '*' || agent.toLowerCase() === userAgent.toLowerCase();
            }
            if (applicable && line.toLowerCase().startsWith('disallow:')) {
                const path = line.split(':')[1]?.trim();
                if (path === '/' || path === '') {
                    disallowed = path === '/';
                }
            }
        }
        return !disallowed;
    }
    catch {
        return true; // Network error reading robots.txt → assume allowed
    }
}
export async function crawlIndiaSources() {
    const results = [];
    for (const target of TARGETS) {
        const allowed = await isAllowedByCrawlers(target.url);
        if (!allowed) {
            console.warn(`Skipping ${target.name} — robots.txt disallows crawling`);
            continue;
        }
        try {
            const siteResults = [];
            const crawler = new PlaywrightCrawler({
                maxRequestsPerCrawl: 1,
                requestHandlerTimeoutSecs: 30,
                async requestHandler({ page }) {
                    await page.waitForLoadState('domcontentloaded');
                    const articles = await page.evaluate(({ titleSel, linkSel, excerptSel }) => {
                        const items = [];
                        const titleEls = document.querySelectorAll(titleSel);
                        titleEls.forEach((el) => {
                            const titleText = el.textContent?.trim();
                            const link = el.querySelector(linkSel) ??
                                el.closest(linkSel) ??
                                el.closest('article')?.querySelector(linkSel);
                            const href = link?.href;
                            if (!titleText || !href || !href.startsWith('http'))
                                return;
                            const excerptEl = excerptSel
                                ? el.closest('article')?.querySelector(excerptSel) ??
                                    el.parentElement?.querySelector(excerptSel)
                                : null;
                            items.push({
                                title: titleText,
                                url: href,
                                excerpt: excerptEl?.textContent?.trim().slice(0, 200) ?? null,
                            });
                        });
                        return items.slice(0, 15);
                    }, { titleSel: target.titleSelector, linkSel: target.linkSelector, excerptSel: target.excerptSelector });
                    for (const a of articles) {
                        siteResults.push({
                            url: a.url,
                            title: a.title,
                            source: target.name,
                            category: target.category,
                            excerpt: a.excerpt,
                            published_at: null,
                        });
                    }
                },
            });
            await crawler.run([target.url]);
            results.push(...siteResults);
        }
        catch (err) {
            console.warn(`Crawl failed for ${target.name}:`, err.message);
        }
    }
    return results;
}
