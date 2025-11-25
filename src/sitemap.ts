import { load } from 'cheerio';
import { browser } from './browser.ts';
import { browserCache } from './cache.ts';
import { env } from './env.ts';

const SITEMAP_URL = 'https://www.newrock.com/en/sitemap';
const WAIT_UNTIL = 'domcontentloaded';

export async function getSitemap(): Promise<string> {
	return browserCache[WAIT_UNTIL].getOrSet({
		key: SITEMAP_URL,
		ttl: '1w',
		factory: async () => {
			const page = await browser.newPage({
				extraHTTPHeaders: {
					Cookie: env.NEW_ROCK_COOKIE,
				},
			});

			await page.goto(SITEMAP_URL, { waitUntil: WAIT_UNTIL });
			const content = await page.content();

			return content;
		},
	});
}

export function getCategories(sitemapHtml: string): Set<string> {
	const $ = load(sitemapHtml);

	const urls = $('.col.block-links')
		.has('h2.block-title span:contains("Categories")')
		.find('a')
		.map((_, el) => $(el).attr('href'));

	return new Set(urls);
}
