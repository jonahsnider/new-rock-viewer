import assert from 'node:assert';
import ky from 'ky';
import pLimit from 'p-limit';
import { assetsCache, getCacheKey } from './cache.ts';

const downloadLimit = pLimit(6);

export async function getAssetPath(url: string): Promise<string> {
	const cacheKey = getCacheKey(url);

	if (!(await assetsCache.has(cacheKey))) {
		const asset = await downloadLimit(async () => ky.get(url).bytes());

		await assetsCache.set(cacheKey, asset);
	}

	const path = await assetsCache.getPath(cacheKey);
	assert(path, new TypeError(`Asset not found in cache: ${url}`));
	return path;
}
