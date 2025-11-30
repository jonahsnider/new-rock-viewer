import type { z } from 'zod/mini';
import { context } from './browser.ts';
import { getCacheKey, productPagesCache } from './cache.ts';
import { ProductDetails } from './schemas/product-details.ts';

export async function getProductDetails(productUrl: string): Promise<z.infer<typeof ProductDetails>> {
	const url = new URL(productUrl);

	const cacheKey = getCacheKey(url);

	// Cache the raw JSON string to avoid bentocache serialization issues with arrays
	const rawResponse = await productPagesCache.getOrSet({
		key: cacheKey,
		ttl: '1w',
		hardTimeout: '30s',
		factory: async () => {
			await using page = await context.newPage();
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
