import assert from 'node:assert';
import { pathToFileURL } from 'node:url';
import * as z from 'zod/mini';
import { getAssetPath } from './extract/assets.ts';
import type { ProductMeta } from './extract/extract.ts';
import type { ProductDetails as RawProductDetails } from './extract/schemas/product-details.ts';

export type ProductDetails = {
	slug: string;
	cover: string;
	images: string[];
	description: string;
	name: string;
	features: {
		name: string;
		value: string;
	}[];
	madeToOrder: boolean;
	url: string;
	categories: string[];
};

export function normalizeProductDetails(productDetails: {
	details: RawProductDetails;
	meta: ProductMeta;
}): ProductDetails {
	return {
		slug: productDetails.details.link_rewrite,
		description: productDetails.details.description,
		name: productDetails.details.name,
		url: productDetails.details.link,
		cover: productDetails.details.cover.large.url,
		images: productDetails.details.images.map((image) => image.large.url),
		features: productDetails.details.features.map((feature) => ({
			name: feature.name ?? '',
			value: feature.value ?? '',
		})),
		madeToOrder: productDetails.details.available_later !== '',
		categories: productDetails.meta.categories,
	};
}
export type ProductDetailsImportDocument = ReturnType<typeof productToSanityDocument>;

const SanityAssetReference = z.string().check(z.startsWith('image@')).brand('sanityAssetReference');
type SanityAssetReference = z.infer<typeof SanityAssetReference>;
const ImageUrlToSanityAssetReference = z.codec(z.url(), SanityAssetReference, {
	encode: (assetReference) => assetReference.replace('image@', ''),
	decode: (url) => `image@${url}`,
});

/**
 * Converts a normalized ProductDetails into a Sanity document ready for import.
 * Uses the _sanityAsset syntax for proper asset handling during import.
 */
export function productToSanityDocument(product: ProductDetails) {
	return {
		_id: product.slug,
		_type: 'product',

		slug: {
			_type: 'slug' as const,
			current: product.slug,
		},
		name: product.name,
		description: product.description,
		url: product.url,
		coverImage: {
			_type: 'image' as const,
			_sanityAsset: z.decode(ImageUrlToSanityAssetReference, product.cover),
		},
		images: product.images.map((imageUrl) => ({
			_type: 'image' as const,
			_sanityAsset: z.decode(ImageUrlToSanityAssetReference, imageUrl),
		})),
		features: product.features.map((feature) => ({
			_type: 'object' as const,
			name: feature.name,
			value: feature.value,
		})),
		madeToOrder: product.madeToOrder,
		categories: product.categories,
	};
}

export async function useLocalAssets(document: ProductDetailsImportDocument): Promise<ProductDetailsImportDocument> {
	const [coverImageLocal, imagesLocal] = await Promise.all([
		useLocalAsset(document.coverImage),
		Promise.all(document.images.map(useLocalAsset)),
	]);

	const validImagePaths = imagesLocal.filter((path) => path !== undefined);
	const validCoverPath = coverImageLocal ?? validImagePaths[0];

	assert(validCoverPath, new TypeError(`No cover path found for ${document.name} (${document.slug})`));

	return {
		...document,
		coverImage: validCoverPath,
		images: validImagePaths,
	};
}

type SanityImageReference = {
	_type: 'image';
	_sanityAsset: SanityAssetReference;
};

async function useLocalAsset(imageReference: SanityImageReference): Promise<SanityImageReference | undefined> {
	const imageUrl = z.encode(ImageUrlToSanityAssetReference, imageReference._sanityAsset);
	const path = await getAssetPath(imageUrl);
	if (!path) {
		return undefined;
	}

	return {
		...imageReference,
		_sanityAsset: z.decode(ImageUrlToSanityAssetReference, pathToFileURL(path).toString()),
	};
}
