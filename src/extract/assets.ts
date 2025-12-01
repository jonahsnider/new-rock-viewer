import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import ky from 'ky';
import pLimit from 'p-limit';
import { assetsCache, CACHE_DIR, getCacheKey } from './cache.ts';

const ASSETS_CACHE_DIR = path.join(CACHE_DIR, 'assets');

const downloadLimit = pLimit(6);

await mkdir(ASSETS_CACHE_DIR, { recursive: true });

export async function getAssetPath(url: string): Promise<string> {
	const cacheKey = getCacheKey(url);

	if (!(await assetsCache.has(cacheKey))) {
		const asset = await downloadLimit(async () => ky.get(url).bytes());

		await assetsCache.set(cacheKey, asset);
	}

	return path.join(ASSETS_CACHE_DIR, cacheKey);
}
