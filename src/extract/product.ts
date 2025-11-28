import type { z } from 'zod/mini';
import { AsyncDisposablePage, context } from './browser.ts';
import { getCacheKey, productPagesCache } from './cache.ts';
import { ProductDetails } from './schemas/product-details.ts';

export async function getProductDetails(productUrl: string): Promise<z.infer<typeof ProductDetails>> {
	const url = new URL(productUrl);

	const cacheKey = getCacheKey(url);

	// Cache the raw JSON string to avoid bentocache serialization issues with arrays
	const rawResponse = await productPagesCache.getOrSet({
		key: cacheKey,
		ttl: '24h',
		hardTimeout: '15s',
		factory: async () => {
			await using disposablePage = await AsyncDisposablePage.create(context);
			const { page } = disposablePage;
			await page.goto(url.toString(), { waitUntil: 'commit' });

			// Select the element with ID 'product-details' and read its data-product attribute
			const element = page.locator('#product-details');
			const dataProduct = await element.getAttribute('data-product');

			if (!dataProduct) {
				throw new TypeError(`Element #product-details found but missing data-product attribute at ${url.toString()}`);
			}

			return JSON.parse(dataProduct);
		},
	});

	return ProductDetails.parse(rawResponse);
}
