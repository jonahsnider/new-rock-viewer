import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { BentoCache, bentostore } from 'bentocache';
import { fileDriver } from 'bentocache/drivers/file';
import type { CacheProvider } from 'bentocache/types';
import normalizeUrl from 'normalize-url';
import { BinaryCache } from '../binary-cache.ts';

export const CACHE_DIR = path.join(import.meta.dirname, '..', '..', 'cache');

export const topLevelCache = new BentoCache({
	default: 'file',
	stores: {
		// biome-ignore lint/correctness/useHookAtTopLevel: This isn't a React hook
		file: bentostore().useL2Layer(
			fileDriver({
				directory: CACHE_DIR,
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

/**
 * Binary cache for storing downloaded asset files
 */
export const assetsCache = new BinaryCache(path.join(CACHE_DIR, 'assets'));

export function getCacheKey(url: URL | string): string {
	return slugify(normalizeUrl(url.toString(), { defaultProtocol: 'https', stripProtocol: true }), {
		preserveCharacters: ['/'],
	});
}
