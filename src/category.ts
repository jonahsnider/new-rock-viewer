import slugify from '@sindresorhus/slugify';
import normalizeUrl from 'normalize-url';
import type { Page } from 'playwright';
import { CategoryProductListingPage } from './api/schemas/category.ts';
import type { Page as PaginationPage } from './api/schemas/pagination.ts';
import type { Product } from './api/schemas/product.ts';
import { apiCache } from './cache.ts';

const DEFAULT_SEARCH_PARAMS = {
	id_currency: '2',
	SubmitCurrency: '1',
} as const;

async function fetchCategoryPageRaw(page: Page, categoryUrl: string): Promise<CategoryProductListingPage | undefined> {
	const url = new URL(categoryUrl);

	for (const [key, value] of Object.entries(DEFAULT_SEARCH_PARAMS)) {
		url.searchParams.set(key, value);
	}

	// Use slugify to create a clean, filesystem-safe cache key from the full URL
	const cacheKey = slugify(normalizeUrl(url.toString()), { preserveCharacters: ['/'] });

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

export async function getProductsForCategory(page: Page, categoryUrl: string): Promise<Product[]> {
	const firstPageRaw = await fetchCategoryPageRaw(page, categoryUrl);
	return firstPageRaw?.products ?? [];
}

/**
 * @returns A list of URLs for the product pages in the category.
 */
export async function getProductPagesForCategory(
	page: Page,
	categoryUrl: string,
): Promise<{ totalItems: number; pages: PaginationPage[] }> {
	const firstPageRaw = await fetchCategoryPageRaw(page, categoryUrl);
	if (firstPageRaw === undefined) {
		return {
			totalItems: 0,
			pages: [],
		};
	}

	const response = CategoryProductListingPage.parse(firstPageRaw);
	const pages = Array.isArray(response.pagination.pages)
		? response.pagination.pages
		: Object.values(response.pagination.pages);

	return {
		totalItems: response.pagination.total_items,
		pages: pages.filter((page) => page.type === 'page'),
	};
}
