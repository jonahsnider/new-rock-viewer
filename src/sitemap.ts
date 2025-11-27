import { load } from 'cheerio';
import { context } from './browser.ts';
import { browserCache } from './cache.ts';

const SITEMAP_URL = 'https://www.newrock.com/en/sitemap';
const WAIT_UNTIL = 'domcontentloaded';

export async function getCategoryUrls(): Promise<Set<string>> {
	const sitemapHtml = await browserCache[WAIT_UNTIL].getOrSet({
		key: SITEMAP_URL,
		ttl: '1w',
		factory: async () => {
			const page = await context.newPage();

			await page.goto(SITEMAP_URL, { waitUntil: WAIT_UNTIL });
			return page.content();
		},
	});
	const $ = load(sitemapHtml);

	const urls = $('.col.block-links')
		.has('h2.block-title span:contains("Categories")')
		.find('a')
		.map((_, el) => $(el).attr('href'));

	return new Set(urls);
}
