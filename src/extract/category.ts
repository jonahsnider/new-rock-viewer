import type { Page } from 'playwright';
import { apiCache, getCacheKey } from './cache.ts';
import { CategoryProductListingPage } from './schemas/api/category.ts';
import type { Product } from './schemas/api/product.ts';

const DEFAULT_SEARCH_PARAMS = {
	id_currency: '2',
	SubmitCurrency: '1',
} as const;

async function fetchCategoryPageRaw(page: Page, categoryUrl: string): Promise<CategoryProductListingPage | undefined> {
	const url = new URL(categoryUrl);

	for (const [key, value] of Object.entries(DEFAULT_SEARCH_PARAMS)) {
		url.searchParams.set(key, value);
	}

	const cacheKey = getCacheKey(url);

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

					if (response.redirected) {
						// Some of the links in the sitemap are broken
						// Instead of 404ing, they redirect you to the home page
						return null;
					}

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

	if (!rawResponse) {
		return undefined;
	}

	return CategoryProductListingPage.parse(rawResponse);
}

export async function getProductsForCategory(
	page: Page,
	categoryUrl: string,
): Promise<{ products: Product[]; nextPageUrl: string | undefined; currentPageNumber: number }> {
	const contents = await fetchCategoryPageRaw(page, categoryUrl);
	if (!contents) {
		return {
			products: [],
			nextPageUrl: undefined,
			currentPageNumber: 1,
		};
	}

	const pages = Array.isArray(contents.pagination.pages)
		? contents.pagination.pages
		: Object.values(contents.pagination.pages);
	const nextPage = pages.find((page) => page.type === 'next' && page.clickable && page.url !== categoryUrl);

	return {
		products: contents.products,
		nextPageUrl: nextPage?.url,
		currentPageNumber: contents.pagination.current_page,
	};
}
