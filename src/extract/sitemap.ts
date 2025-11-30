import { taskLog } from '@clack/prompts';
import { load } from 'cheerio';
import { context } from './browser.ts';
import { browserCache } from './cache.ts';

const SITEMAP_URL = 'https://www.newrock.com/en/sitemap';
const WAIT_UNTIL = 'domcontentloaded';

export async function getCategoryUrls(): Promise<Set<string>> {
	const log = taskLog({ title: 'Loading product categories' });
	const sitemapHtml = await browserCache[WAIT_UNTIL].getOrSet({
		key: SITEMAP_URL,
		ttl: '1w',
		factory: async () => {
			log.message('Opening new page');
			await using page = await context.newPage();

			log.message('Loading sitemap page');
			await page.goto(SITEMAP_URL, { waitUntil: WAIT_UNTIL });
			return await page.content();
		},
	});
	log.message('Parsing sitemap HTML');
	const $ = load(sitemapHtml);

	log.message('Extracting category URLs');
	const urls = $('.col.block-links')
		.has('h2.block-title span:contains("Categories")')
		.find('a')
		.map((_, el) => $(el).attr('href'));

	const result = new Set(urls);
	log.success(`Found ${result.size} category URLs`);
	return result;
}
