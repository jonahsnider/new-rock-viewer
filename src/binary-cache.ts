import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import slugify from '@sindresorhus/slugify';
import { pathExists } from 'path-exists';

export class BinaryCache {
	#getPath(key: string): string {
		return path.join(this.#directory, slugify(key));
	}

	readonly #directory: string;

	constructor(directory: string) {
		this.#directory = directory;
	}

	async get(key: string): Promise<Uint8Array | undefined> {
		const path = this.#getPath(key);
		try {
			const contents = await readFile(path);
			return new Uint8Array(contents);
		} catch (error) {
			if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
				return undefined;
			}
			throw error;
		}
	}

	async set(key: string, value: Uint8Array): Promise<void> {
		const path = this.#getPath(key);
		await writeFile(path, value);
	}

	async getOrSet(key: string, factory: () => Promise<Uint8Array>): Promise<Uint8Array> {
		const existing = await this.get(key);
		if (existing) {
			return existing;
		}
		const value = await factory();
		await this.set(key, value);
		return value;
	}

	async has(key: string): Promise<boolean> {
		return pathExists(this.#getPath(key));
	}
}
