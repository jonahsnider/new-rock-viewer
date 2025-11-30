import { intro, outro, spinner } from '@clack/prompts';
import { createClient } from '@sanity/client';
import { sanityImport } from '@sanity/import';
import sanityConfig from '../sanity.config.ts';
import { env } from './env.ts';
import { topLevelCache } from './extract/cache.ts';
import { extractProducts } from './extract/extract.ts';
import { normalizeProductDetails, productToSanityDocument } from './normalize.ts';

intro('New Rock Product Import');

// Extract products from the website
const extractionSpinner = spinner();
extractionSpinner.start('Extracting products from New Rock website');
const allProducts = await extractProducts(false);
extractionSpinner.stop(`Extracted ${allProducts.size} products`);

// Normalize and convert to Sanity documents
const conversionSpinner = spinner();
conversionSpinner.start('Converting products to Sanity documents');
const sanityDocuments = allProducts.values().map(normalizeProductDetails).map(productToSanityDocument).toArray();
conversionSpinner.stop(`Converted ${sanityDocuments.length} products to Sanity documents`);

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

const result = await sanityImport(sanityDocuments, {
	client,
	// Use createOrReplace to allow re-importing and updating existing products
	operation: 'createOrReplace',
	// Allow failing assets to not block the entire import
	allowFailingAssets: false,
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
		console.warn(`- ${warning}`);
	}
}

await topLevelCache.disconnectAll();

outro('Import complete!');
