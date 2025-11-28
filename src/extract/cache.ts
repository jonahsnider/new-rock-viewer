import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { BentoCache, bentostore } from 'bentocache';
import { fileDriver } from 'bentocache/drivers/file';
import type { CacheProvider } from 'bentocache/types';
import normalizeUrl from 'normalize-url';

export const topLevelCache = new BentoCache({
	default: 'file',
	stores: {
		// biome-ignore lint/correctness/useHookAtTopLevel: This isn't a React hook
		file: bentostore().useL2Layer(
			fileDriver({
				directory: path.join(import.meta.dirname, '..', '..', 'cache'),
				pruneInterval: '1h',
			}),
		),
	},
});

const browserCacheRaw = topLevelCache.namespace('browser');

export const browserCache = {
	commit: browserCacheRaw.namespace('commit'),
	domcontentloaded: browserCacheRaw.namespace('domcontentloaded'),
	load: browserCacheRaw.namespace('load'),
	networkidle: browserCacheRaw.namespace('networkidle'),
} satisfies Record<'load' | 'domcontentloaded' | 'networkidle' | 'commit', CacheProvider>;

export const apiCache = topLevelCache.namespace('api');

export const productPagesCache = topLevelCache.namespace('product-pages');

export function getCacheKey(url: URL): string {
	return slugify(normalizeUrl(url.toString()), { preserveCharacters: ['/'] });
}
