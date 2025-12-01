import assert from 'node:assert';
import { log } from '@clack/prompts';
import ky from 'ky';
import pLimit from 'p-limit';
import { assetsCache, getCacheKey } from './cache.ts';

const SKIPPED_ASSETS: ReadonlySet<string> = new Set(['newrock-com-108594-thickbox-default-m-mili083cct-c32-jpg']);

const downloadLimit = pLimit(6);

export async function getAssetPath(url: string): Promise<string | undefined> {
	const cacheKey = getCacheKey(url);

	if (SKIPPED_ASSETS.has(cacheKey)) {
		log.warn(`Skipping asset with cache key ${cacheKey}`);
		return undefined;
	}

	if (!(await assetsCache.has(cacheKey))) {
		const asset = await downloadLimit(async () => ky.get(url).bytes());

		await assetsCache.set(cacheKey, asset);
	}

	const path = await assetsCache.getPath(cacheKey);
	assert(path, new TypeError(`Asset not found in cache: ${url}`));
	return path;
}
