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
			const requestId: string = crypto.randomUUID();

			// Set up response listener before making the request - note no await
			// Use a predicate to match the exact URL and ensure it's a GET request
			const responsePromise = page.waitForResponse(
				(response) => {
					const requestHeaders = response.request().headers();

					return (
						Object.hasOwn(requestHeaders, X_REQUEST_ID_HEADER) && requestHeaders[X_REQUEST_ID_HEADER] === requestId
					);
				},
				{ timeout: 5000 },
			);

			// Trigger the request using fetch() with custom headers in the page context
			// We ignore the return value here and instead capture the response using waitForResponse()
			await page.evaluate(
				async (params) => {
					await fetch(params.url, {
						method: 'GET',
						headers: {
							Accept: 'application/json',
							'X-Requested-With': 'XMLHttpRequest',
							[params.headerName]: params.headerValue,
						},
						credentials: 'include',
					});
				},
				{ url: url.toString(), headerName: X_REQUEST_ID_HEADER, headerValue: requestId },
			);

			// Wait for and capture the response from the network monitor
			const response = await responsePromise;

			if (!response.ok()) {
				throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
			}

			const json = await response.json();
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
