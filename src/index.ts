import { taskLog } from '@clack/prompts';
import type { Page } from './api/schemas/pagination.ts';
import type { Product } from './api/schemas/product.ts';
import { AsyncDisposablePage, authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductPagesForCategory, getProductsForCategory } from './category.ts';
import { getCategoryUrls } from './sitemap.ts';

await authenticate(context);

const categoryUrls = await getCategoryUrls();

const allProducts = new Map<string, Product>();

// Use browser context to make the fetch request with full auth and avoid bot detection
await using disposableBrowserPage = await AsyncDisposablePage.create(context);
const { page: browserPage } = disposableBrowserPage;

// Navigate to the domain first to establish context and trigger auth cookies
await browserPage.goto('https://www.newrock.com/en/', { waitUntil: 'domcontentloaded' });

const categoryPagesLog = taskLog({ title: `Fetching page information for ${categoryUrls.size} categories` });
const categoryPagesMap = new Map<string, { pages: Page[]; totalItems: number }>();
let expectedProductCount = 0;

let categoryProgress = 0;
for (const categoryUrl of categoryUrls) {
	categoryPagesLog.message(
		`Loading pages for ${categoryUrl} - category ${categoryProgress.toLocaleString()}/${categoryUrls.size.toLocaleString()}`,
	);
	const { pages, totalItems } = await getProductPagesForCategory(browserPage, categoryUrl);
	categoryPagesMap.set(categoryUrl, { pages, totalItems });
	expectedProductCount += totalItems;
	categoryProgress++;
}

categoryPagesLog.success(`Loaded page information for ${categoryUrls.size} categories`);

const productListingsLog = taskLog({ title: `Extracting product listings from ${categoryPagesMap.size} categories` });

for (const [categoryUrl, { pages, totalItems }] of categoryPagesMap) {
	const productCountBefore = allProducts.size;
	const groupLogger = productListingsLog.group(`Extracting listings for ${categoryUrl}`);

	for (const page of pages) {
		groupLogger.message(
			`Page ${page.page}, products ${allProducts.size.toLocaleString()}/${expectedProductCount.toLocaleString()}`,
		);

		try {
			const products = await getProductsForCategory(browserPage, page.url);
			for (const product of products) {
				allProducts.set(product.id_product, product);
			}
		} catch (error) {
			groupLogger.error(`An error occurred while extracting products for ${categoryUrl} - page ${page.page}`);
			throw error;
		}
	}

	// Products can belong to multiple categories, if we just added totalItems we'd be counting products multiple times
	expectedProductCount -= totalItems;
	expectedProductCount += allProducts.size - productCountBefore;
	groupLogger.success(
		`Extracted ${allProducts.size - productCountBefore} new products from ${categoryUrl} (checked ${totalItems})`,
	);
}

productListingsLog.success(`Extracted ${allProducts.size.toLocaleString()} product listings`);

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
