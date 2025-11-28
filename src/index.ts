import { spinner } from '@clack/prompts';
import type { Product } from './api/schemas/product.ts';
import { AsyncDisposablePage, authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductPagesForCategory, getProductsForCategory } from './category.ts';
import { getCategoryUrls } from './sitemap.ts';

await authenticate(context);

const categoryUrls = await getCategoryUrls();

const extractionLog = spinner();
extractionLog.start(`Extracting product listings for ${categoryUrls.size} categories`);

const _products: Product[] = [];

// Use browser context to make the fetch request with full auth and avoid bot detection
await using disposablePage = await AsyncDisposablePage.create(context);
const { page } = disposablePage;

// Navigate to the domain first to establish context and trigger auth cookies
await page.goto('https://www.newrock.com/en/', { waitUntil: 'domcontentloaded' });

for (const categoryUrl of categoryUrls) {
	extractionLog.message(`Loading pages for ${categoryUrl}`);
	const pageUrls = await getProductPagesForCategory(page, categoryUrl);
	for (const pageUrl of pageUrls) {
		extractionLog.message(`Extracting listings for ${categoryUrl} - page ${pageUrl}`);
		try {
			const products = await getProductsForCategory(page, pageUrl);
			_products.push(...products);
		} catch (error) {
			extractionLog.error(`An error occurred while extracting products for ${categoryUrl} - page ${pageUrl}`);
			throw error;
		}
	}
}

extractionLog.stop('Finished extracting product listings');

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
