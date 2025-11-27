import { CategoryProductListingPage } from './api/schemas/category.ts';
import type { Product } from './api/schemas/product.ts';
import { AsyncDisposablePage, context } from './browser.ts';
import { apiCache } from './cache.ts';

const DEFAULT_SEARCH_PARAMS = {
	id_currency: '2',
	SubmitCurrency: '1',
} as const;

const TRALIING_SLASH_REGEXP = /\/+$/;

async function fetchCategoryPageRaw(categoryUrl: string): Promise<CategoryProductListingPage> {
	// Normalize the cache key by removing trailing slashes to avoid filesystem issues
	const cacheKey = categoryUrl.replace(TRALIING_SLASH_REGEXP, '');

	const rawResponse = await apiCache.getOrSet({
		key: cacheKey,
		ttl: '24h',
		factory: async () => {
			const url = new URL(categoryUrl);

			for (const [key, value] of Object.entries(DEFAULT_SEARCH_PARAMS)) {
				url.searchParams.set(key, value);
			}

			// Use browser context to make the fetch request with full auth and avoid bot detection
			await using disposablePage = await AsyncDisposablePage.create(context);
			const { page } = disposablePage;

			// Navigate to the domain first to establish context and trigger auth cookies
			await page.goto('https://www.newrock.com/en/', { waitUntil: 'domcontentloaded' });

			const response = await page.evaluate(async (url) => {
				const response = await fetch(url, {
					method: 'GET',
					headers: {
						Accept: 'application/json, text/plain, */*',
						'X-Requested-With': 'XMLHttpRequest',
					},
					credentials: 'include',
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				return response.json();
			}, url.toString());

			return response;
		},
	});

	return CategoryProductListingPage.parse(rawResponse);
}

export async function getProductsForCategory(categoryUrl: string): Promise<Product[]> {
	const firstPageRaw = await fetchCategoryPageRaw(categoryUrl);
	return firstPageRaw.products;
}

/**
 * @returns A list of URLs for the product pages in the category.
 */
export async function getProductPagesForCategory(categoryUrl: string): Promise<string[]> {
	const firstPageRaw = await fetchCategoryPageRaw(categoryUrl);
	const response = CategoryProductListingPage.parse(firstPageRaw);
	return response.pagination.pages.filter((page) => page.type === 'page').map((page) => page.url);
}
