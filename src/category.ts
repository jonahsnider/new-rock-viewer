import slugify from '@sindresorhus/slugify';
import type { Page } from 'playwright';
import { CategoryProductListingPage } from './api/schemas/category.ts';
import type { Product } from './api/schemas/product.ts';
import { apiCache } from './cache.ts';

const DEFAULT_SEARCH_PARAMS = {
	id_currency: '2',
	SubmitCurrency: '1',
} as const;
const X_REQUEST_ID_HEADER = 'x-request-id';

async function fetchCategoryPageRaw(page: Page, categoryUrl: string): Promise<CategoryProductListingPage> {
	const url = new URL(categoryUrl);

	for (const [key, value] of Object.entries(DEFAULT_SEARCH_PARAMS)) {
		url.searchParams.set(key, value);
	}

	// Use slugify to create a clean, filesystem-safe cache key from the full URL
	const cacheKey = slugify(url.toString());

	// Cache the raw JSON string to avoid bentocache serialization issues with arrays
	const rawResponse = await apiCache.getOrSet({
		key: cacheKey,
		ttl: '24h',
		hardTimeout: '15s',
		factory: async () => {
			const json = await page.evaluate(
				async (params) => {
					const response = await fetch(params.url, {
						method: 'GET',
						headers: {
							Accept: 'application/json',
							'X-Requested-With': 'XMLHttpRequest',
						},
						credentials: 'include',
					});

					if (response.ok) {
						return await response.json();
					}

					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				},
				{ url: url.toString() },
			);

			return json;
		},
	});

	return CategoryProductListingPage.parse(rawResponse);
}

export async function getProductsForCategory(page: Page, categoryUrl: string): Promise<Product[]> {
	const firstPageRaw = await fetchCategoryPageRaw(page, categoryUrl);
	return firstPageRaw.products;
}

/**
 * @returns A list of URLs for the product pages in the category.
 */
export async function getProductPagesForCategory(page: Page, categoryUrl: string): Promise<string[]> {
	const firstPageRaw = await fetchCategoryPageRaw(page, categoryUrl);
	const response = CategoryProductListingPage.parse(firstPageRaw);
	const pages = Array.isArray(response.pagination.pages)
		? response.pagination.pages
		: Object.values(response.pagination.pages);
	return pages.filter((page) => page.type === 'page').map((page) => page.url);
}
