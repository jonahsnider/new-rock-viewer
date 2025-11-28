import PQueue from 'p-queue';
import type { Product } from './api/schemas/product.ts';
import { authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductPagesForCategory, getProductsForCategory } from './category.ts';
import { getCategoryUrls } from './sitemap.ts';

const queue = new PQueue({ concurrency: 1 });

await authenticate(context);

console.log('Fetching sitemap...');
const categoryUrls = await getCategoryUrls();

console.log(`Found ${categoryUrls.size} categories`);

const products: Product[] = [];

for (const categoryUrl of categoryUrls) {
	queue.add(async () => {
		const pageUrls = await getProductPagesForCategory(categoryUrl);
		for (const pageUrl of pageUrls) {
			const products = await getProductsForCategory(pageUrl);

			products.push(...products);
		}
	});
}

console.log('Queued all tasks');

// Wait for all tasks to complete
await queue.onIdle();

console.log(`Scraping completed. Found ${products.length} unique products.`);

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
