import { defineQuery } from 'groq';

/**
 * Query to fetch all unique feature names from products
 */
export const allFeatureNamesQuery = defineQuery(`array::unique(*[_type == 'product'].features[].name)`);

/**
 * Query to fetch all unique categories from products
 */
export const allCategoriesQuery = defineQuery(`array::unique(*[_type == 'product'].categories[defined(@)])`);

/**
 * Query to fetch all unique values for a specific feature name
 */
export const featureValuesQuery = defineQuery(
	`array::unique(*[_type == 'product'].features[name == $featureName].value)`,
);

/**
 * Sort values with numeric awareness
 * Numbers are sorted numerically, strings alphabetically
 */
export function sortValues(values: string[]): string[] {
	// Filter out null/undefined values before sorting
	return values
		.filter((v) => v != null)
		.toSorted((a, b) => {
			// Both are strings - sort alphabetically (case-insensitive)
			return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
		});
}

/**
 * Build a GROQ filter string based on selected filters
 * @param filters Map of feature name to array of selected values
 * @returns GROQ filter string
 */
export function buildFilterString(filters: Map<string, string[]>): string {
	if (filters.size === 0) {
		return '';
	}

	const filterConditions: string[] = [];

	// For each feature that has selected values
	for (const [featureName, values] of filters.entries()) {
		if (values.length === 0) continue;

		// Special handling for "Made to Order" filter
		if (featureName === '__madeToOrder') {
			// If "true" is selected, filter for made to order products
			if (values.includes('true')) {
				filterConditions.push('madeToOrder == true');
			}
			// If "false" is selected, filter for NOT made to order products
			if (values.includes('false')) {
				filterConditions.push('madeToOrder == false');
			}
			continue;
		}

		// Special handling for "Categories" filter
		if (featureName === '__categories') {
			// Check if product's categories array contains any of the selected categories
			const categoryConditions = values.map((value) => `"${value.replace(/"/g, '\\"')}" in categories`).join(' || ');
			filterConditions.push(`(${categoryConditions})`);
			continue;
		}

		// Build OR condition for multiple values of the same feature
		// e.g., "Colour" in ["Red", "Blue"] means product has feature with name="Colour" and (value="Red" OR value="Blue")
		const valueConditions = values.map((value) => `value == "${value.replace(/"/g, '\\"')}"`).join(' || ');

		// Check if any feature with this name matches any of the selected values
		const featureCondition = `count(features[name == "${featureName.replace(/"/g, '\\"')}" && (${valueConditions})]) > 0`;
		filterConditions.push(featureCondition);
	}

	// AND logic across different features
	return filterConditions.join(' && ');
}
