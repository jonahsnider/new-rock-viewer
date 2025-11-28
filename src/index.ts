import process from 'node:process';
import { progress } from '@clack/prompts';
import PQueue from 'p-queue';
import type { Product } from './api/schemas/product.ts';
import { authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductPagesForCategory, getProductsForCategory } from './category.ts';
import { getCategoryUrls } from './sitemap.ts';

const queue = new PQueue({ concurrency: 3 });

await authenticate(context);

const categoryUrls = await getCategoryUrls();

const extractionLog = progress({ max: categoryUrls.size });
extractionLog.start(`Extracting product listings for ${categoryUrls.size} categories`);

const _products: Product[] = [];

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

queue
	.on('active', () => {
		extractionLog.setMax(queue.size);
		extractionLog.advance(1, `Extracting product listings - ${queue.pending} running, ${queue.size} waiting`);
	})
	.on('error', (error) => {
		console.error(error);
		extractionLog.error('An error occurred while extracting product listings');
		process.exit(1);
	});

await queue.onIdle();

extractionLog.stop('Finished extracting product listings');

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
