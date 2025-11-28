import { taskLog } from '@clack/prompts';
import type { Product } from './api/schemas/product.ts';
import { AsyncDisposablePage, authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductsForCategory } from './category.ts';
import { getCategoryUrls } from './sitemap.ts';

await authenticate(context);

const categoryUrls = await getCategoryUrls();

const allProducts = new Map<string, Product>();

// Use browser context to make the fetch request with full auth and avoid bot detection
await using disposableBrowserPage = await AsyncDisposablePage.create(context);
const { page: browserPage } = disposableBrowserPage;

// Navigate to the domain first to establish context and trigger auth cookies
await browserPage.goto('https://www.newrock.com/en/', { waitUntil: 'domcontentloaded' });

const productListingsLog = taskLog({ title: `Extracting product listings from ${categoryUrls.size} categories` });

for (const categoryUrl of categoryUrls) {
	const productCountBefore = allProducts.size;
	const groupLogger = productListingsLog.group(`Extracting listings for ${categoryUrl}`);

	let pageUrl: string | undefined = categoryUrl;
	while (pageUrl) {
		const categoryPage = await getProductsForCategory(browserPage, pageUrl);
		groupLogger.message(`Page ${categoryPage.currentPageNumber}, products ${allProducts.size}`);
		for (const product of categoryPage.products) {
			allProducts.set(product.id_product, product);
		}

		pageUrl = categoryPage.nextPageUrl;
	}

	groupLogger.success(`Extracted ${allProducts.size - productCountBefore} new products from ${categoryUrl}`);
}

productListingsLog.success(`Extracted ${allProducts.size.toLocaleString()} product listings`);

await context.close();
await browser.close();
await topLevelCache.disconnectAll();
