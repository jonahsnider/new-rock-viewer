import { progress, taskLog } from '@clack/prompts';
import pLimit from 'p-limit';
import { authenticate, browser, context } from './browser.ts';
import { getProductsForCategory } from './category.ts';
import { getProductDetails } from './product.ts';
import type { Product } from './schemas/api/product.ts';
import type { ProductDetails } from './schemas/product-details.ts';
import { getCategoryUrls } from './sitemap.ts';

export async function extractProducts(log: boolean): Promise<Map<string, ProductDetails>> {
	await authenticate(context);

	const categoryUrls = await getCategoryUrls();

	const allProductListings = await extractProductListings(log, categoryUrls);

	const allProductDetails = await extractProductDetails(allProductListings);

	await context.close();
	await browser.close();

	return allProductDetails;
}

const newRockRequestLimiter = pLimit(3);

async function extractProductListings(log: boolean, categoryUrls: Set<string>) {
	const allProductListings = new Map<string, Product>();

	// Use browser context to make the fetch request with full auth and avoid bot detection
	await using browserPage = await context.newPage();

	const productListingsLog = log
		? taskLog({ title: `Extracting product listings from ${categoryUrls.size} categories` })
		: undefined;

	for (const categoryUrl of categoryUrls) {
		const productCountBefore = allProductListings.size;
		const groupLogger = productListingsLog?.group(`Extracting listings for ${categoryUrl}`);

		let pageUrl: string | undefined = categoryUrl;
		while (pageUrl) {
			const usedPageUrl: string = pageUrl;
			const categoryPage = await newRockRequestLimiter(async () => getProductsForCategory(browserPage, usedPageUrl));
			groupLogger?.message(`Page ${categoryPage.currentPageNumber}, products ${allProductListings.size}`);
			for (const product of categoryPage.products) {
				allProductListings.set(product.id_product, product);
			}

			pageUrl = categoryPage.nextPageUrl;
		}

		groupLogger?.success(`Extracted ${allProductListings.size - productCountBefore} new products from ${categoryUrl}`);
	}

	productListingsLog?.success(`Extracted ${allProductListings.size.toLocaleString()} product listings`);
	return allProductListings;
}

async function extractProductDetails(allProductListings: Map<string, Product>): Promise<Map<string, ProductDetails>> {
	const allProductDetails = new Map<string, ProductDetails>();

	const productDetailsLog = progress({ max: allProductListings.size });
	productDetailsLog?.start(`Extracting product details for ${allProductListings.size} products`);

	await Promise.all(
		allProductListings.values().map(async (product) => {
			const productDetails = await newRockRequestLimiter(() => getProductDetails(product.url.toString()));
			productDetailsLog?.advance(
				undefined,
				`Extracted product details for ${product.name} - ${allProductDetails.size.toLocaleString()}/${allProductListings.size.toLocaleString()}`,
			);
			allProductDetails.set(product.id_product, productDetails);
		}),
	);

	productDetailsLog?.stop(`Extracted product details for ${allProductDetails.size} products`);

	return allProductDetails;
}
