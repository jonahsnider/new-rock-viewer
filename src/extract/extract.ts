import { progress, taskLog } from '@clack/prompts';
import { AsyncDisposablePage, authenticate, browser, context } from './browser.ts';
import { topLevelCache } from './cache.ts';
import { getProductsForCategory } from './category.ts';
import { getProductDetails } from './product.ts';
import type { Product } from './schemas/api/product.ts';
import type { ProductDetails } from './schemas/product-details.ts';
import { getCategoryUrls } from './sitemap.ts';

export async function extractProducts(log: boolean): Promise<Map<string, ProductDetails>> {
	await authenticate(context);

	const categoryUrls = await getCategoryUrls();

	const allProductListings = new Map<string, Product>();

	// Use browser context to make the fetch request with full auth and avoid bot detection
	await using disposableBrowserPage = await AsyncDisposablePage.create(context);
	const { page: browserPage } = disposableBrowserPage;

	const productListingsLog = log
		? taskLog({ title: `Extracting product listings from ${categoryUrls.size} categories` })
		: undefined;

	for (const categoryUrl of categoryUrls) {
		const productCountBefore = allProductListings.size;
		const groupLogger = productListingsLog?.group(`Extracting listings for ${categoryUrl}`);

		let pageUrl: string | undefined = categoryUrl;
		while (pageUrl) {
			const categoryPage = await getProductsForCategory(browserPage, pageUrl);
			groupLogger?.message(`Page ${categoryPage.currentPageNumber}, products ${allProductListings.size}`);
			for (const product of categoryPage.products) {
				allProductListings.set(product.id_product, product);
			}

			pageUrl = categoryPage.nextPageUrl;
		}

		groupLogger?.success(`Extracted ${allProductListings.size - productCountBefore} new products from ${categoryUrl}`);
	}

	productListingsLog?.success(`Extracted ${allProductListings.size.toLocaleString()} product listings`);

	const allProductDetails = new Map<string, ProductDetails>();

	const productDetailsLog = progress({ max: allProductListings.size });
	productDetailsLog?.start(`Extracting product details for ${allProductListings.size} products`);
	for (const product of allProductListings.values()) {
		const productDetails = await getProductDetails(product.url.toString());
		productDetailsLog?.advance(
			undefined,
			`Extracted product details for ${product.name} - ${allProductDetails.size.toLocaleString()}/${allProductListings.size.toLocaleString()}`,
		);
		allProductDetails.set(product.id_product, productDetails);
	}

	productDetailsLog?.stop(`Extracted product details for ${allProductDetails.size} products`);

	await context.close();
	await browser.close();
	await topLevelCache.disconnectAll();

	return allProductDetails;
}
