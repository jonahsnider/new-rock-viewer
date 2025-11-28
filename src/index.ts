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

let expectedProductCount = 0;
const allProducts = new Map<string, Product>();

// Use browser context to make the fetch request with full auth and avoid bot detection
await using disposableBrowserPage = await AsyncDisposablePage.create(context);
const { page: browserPage } = disposableBrowserPage;

// Navigate to the domain first to establish context and trigger auth cookies
await browserPage.goto('https://www.newrock.com/en/', { waitUntil: 'domcontentloaded' });

for (const categoryUrl of categoryUrls) {
	extractionLog.message(
		`Loading pages for ${categoryUrl} - products ${allProducts.size.toLocaleString()}/${expectedProductCount.toLocaleString()}`,
	);
	const { pages, totalItems } = await getProductPagesForCategory(browserPage, categoryUrl);

	expectedProductCount += totalItems;
	const productCountBefore = allProducts.size;

	for (const page of pages) {
		extractionLog.message(
			`Extracting listings for ${categoryUrl} - page ${page.page}, products ${allProducts.size.toLocaleString()}/${expectedProductCount.toLocaleString()}`,
		);
		try {
			const products = await getProductsForCategory(browserPage, page.url);
			for (const product of products) {
				allProducts.set(product.id_product, product);
			}
		} catch (error) {
			extractionLog.error(`An error occurred while extracting products for ${categoryUrl} - page ${page.page}`);
			throw error;
		}
	}

	// Products can belong to multiple categories, if we just added totalItems we'd be counting products multiple times
	expectedProductCount -= totalItems;
	expectedProductCount += allProducts.size - productCountBefore;
}

extractionLog.stop(`Finished extracting ${allProducts.size.toLocaleString()} product listings`);

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
