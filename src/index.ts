import { intro, outro, progress, spinner } from '@clack/prompts';
import { createClient } from '@sanity/client';
import { sanityImport } from '@sanity/import';
import sanityConfig from '../sanity.config.ts';
import { env } from './env.ts';
import { topLevelCache } from './extract/cache.ts';
import { extractProducts } from './extract/extract.ts';
import type { ProductDetails as RawProductDetails } from './extract/schemas/product-details.ts';
import {
	normalizeProductDetails,
	type ProductDetailsImportDocument,
	productToSanityDocument,
	useLocalAssets,
} from './normalize.ts';

async function doExtract(): Promise<Map<string, RawProductDetails>> {
	// Extract products from the website
	const extractionSpinner = spinner();
	extractionSpinner.start('Extracting products from New Rock website');
	const allProducts = await extractProducts(false);
	extractionSpinner.stop(`Extracted ${allProducts.size} products`);
	return allProducts;
}

async function doTransform(allProducts: Map<string, RawProductDetails>) {
	// Normalize and convert to Sanity documents
	const conversionSpinner = spinner();
	conversionSpinner.start('Converting products to Sanity documents');
	const sanityDocuments = allProducts.values().map(normalizeProductDetails).map(productToSanityDocument).toArray();
	conversionSpinner.stop(`Converted ${sanityDocuments.length} products to Sanity documents`);

	// Download assets and replace URLs of the import documents
	const assetProgress = progress({
		max: sanityDocuments.reduce((total, document) => total + [document.coverImage, ...document.images].length, 0),
	});

	assetProgress.start('Downloading assets for all products');
	const sanityDocumentsWithLocalAssets = await Promise.all(
		sanityDocuments.map(async (document) => {
			const result = await useLocalAssets(document);
			assetProgress.advance(undefined, `Downloaded assets for ${document.name}`);
			return result;
		}),
	);
	assetProgress.stop('Downloaded assets for all products');

	return sanityDocumentsWithLocalAssets;
}

async function doImport(documents: ProductDetailsImportDocument[]) {
	// Create Sanity client
	const client = createClient({
		projectId: sanityConfig.projectId,
		dataset: sanityConfig.dataset,
		token: env.SANITY_AUTH_TOKEN,
		useCdn: false,
		apiVersion: '2025-11-29',
	});

	// Import to Sanity
	const importSpinner = spinner();
	importSpinner.start('Importing products to Sanity');

	const result = await sanityImport(documents, {
		client,
		// Use createOrReplace to allow re-importing and updating existing products
		operation: 'createOrReplace',
		// Allow failing assets to not block the entire import
		allowFailingAssets: true,
		// Replace assets to ensure latest versions are used
		replaceAssets: false,
		onProgress: (progress) => {
			if (progress.step && progress.current !== undefined && progress.total !== undefined) {
				importSpinner.message(
					`${progress.step}: ${progress.current.toLocaleString()}/${progress.total.toLocaleString()} (${Math.round((progress.current / progress.total) * 100)}%)`,
				);
			} else if (progress.step) {
				importSpinner.message(progress.step);
			}
		},
	});

	importSpinner.stop(`Imported ${result.numDocs} documents`);

	// Display any warnings
	if (result.warnings.length > 0) {
		console.warn('\nWarnings during import:');
		for (const warning of result.warnings) {
			console.warn(`- ${warning.message}`);
		}
	}
}

intro('New Rock Product Import');

const allProducts = await doExtract();
const sanityDocumentsWithLocalAssets = await doTransform(allProducts);
await doImport(sanityDocumentsWithLocalAssets);

await topLevelCache.disconnectAll();

outro('Import complete!');
