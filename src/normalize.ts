import { pathToFileURL } from 'node:url';
import { getAssetPath } from './extract/assets.ts';
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
};

export function normalizeProductDetails(productDetails: RawProductDetails): ProductDetails {
	return {
		name: productDetails.name,
		slug: productDetails.link_rewrite,
		description: productDetails.description,
		url: productDetails.link,

		cover: productDetails.cover.large.url,
		images: productDetails.images.map((image) => image.large.url),
		features: productDetails.features.map((feature) => ({
			name: feature.name ?? '',
			value: feature.value ?? '',
		})),

		madeToOrder: productDetails.available_later !== '',
	};
}

export type ProductDetailsImportDocument = ReturnType<typeof productToSanityDocument>;

/**
 * Converts a normalized ProductDetails into a Sanity document ready for import.
 * Uses the _sanityAsset syntax for proper asset handling during import.
 */
export function productToSanityDocument(product: ProductDetails) {
	return {
		_id: product.slug,
		_type: 'product',

		slug: {
			_type: 'slug',
			current: product.slug,
		},
		name: product.name,
		description: product.description,
		url: product.url,
		coverImage: {
			_type: 'image',
			_sanityAsset: `image@${product.cover}`,
		},
		images: product.images.map((imageUrl) => ({
			_type: 'image',
			_sanityAsset: `image@${imageUrl}`,
		})),
		features: product.features.map((feature) => ({
			_type: 'object',
			name: feature.name,
			value: feature.value,
		})),
		madeToOrder: product.madeToOrder,
	};
}

export async function useLocalAssets(document: ProductDetailsImportDocument): Promise<ProductDetailsImportDocument> {
	const [coverPath, imagePaths] = await Promise.all([
		getAssetPath(document.coverImage._sanityAsset),
		Promise.all(document.images.map((image) => getAssetPath(image._sanityAsset))),
	]);

	return {
		...document,
		coverImage: {
			...document.coverImage,
			_sanityAsset: `image@${pathToFileURL(coverPath)}`,
		},
		images: document.images.map((image, index) => ({
			...image,
			_sanityAsset: `image@${pathToFileURL(imagePaths[index])}`,
		})),
	};
}
