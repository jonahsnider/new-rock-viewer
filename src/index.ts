import { progress, taskLog } from '@clack/prompts';
import PQueue from 'p-queue';
import type { Product } from './api/schemas/product.ts';
import { authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductPagesForCategory, getProductsForCategory } from './category.ts';
import { getCategoryUrls } from './sitemap.ts';

const queue = new PQueue({ concurrency: 1 });

await authenticate(context);

const categoryUrls = await getCategoryUrls();

const scrapingLog = progress({ max: categoryUrls.size });
scrapingLog.start('Extracting product listings')

const products: Product[] = [];

queue.addAll(
	categoryUrls
		.values()
		.map((categoryUrl) => async () => {
			const pageUrls = await getProductPagesForCategory(categoryUrl);
			for (const pageUrl of pageUrls) {
				const products = await getProductsForCategory(pageUrl);

				products.push(...products);
			}
		})
		.toArray(),
);

queue.on('active', () => {
	scrapingLog.setMax(queue.size);
	scrapingLog.advance(1);
});

await queue.onIdle();

scrapingLog.stop('Finished extracting product listings');

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
