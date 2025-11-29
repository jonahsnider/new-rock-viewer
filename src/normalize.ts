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

/**
 * A Sanity document suitable for import. The _sanityAsset property
 * is used to specify asset URLs that will be downloaded and uploaded during import.
 */
export interface SanityImportDocument {
	_id: string;
	_type: string;
	[key: string]: unknown;
}

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
