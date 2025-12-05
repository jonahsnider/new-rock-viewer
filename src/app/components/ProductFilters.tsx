import { useQuery } from '@sanity/sdk-react';
import { Card, Checkbox, Flex, Heading, Spinner, Stack, Text } from '@sanity/ui';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { allCategoriesQuery, allFeatureNamesQuery, featureValuesQuery, sortValues } from '../queries.js';

interface ProductFiltersProps {
	onFilterChange: (filters: Map<string, string[]>) => void;
}

// Component for fetching and displaying categories
function CategoriesFilter({
	selectedCategories,
	onValueChange,
}: {
	selectedCategories: string[];
	onValueChange: (featureName: string, value: string, checked: boolean) => void;
}) {
	const { data: categories } = useQuery<string[]>({
		query: allCategoriesQuery,
	});

	// Sort categories alphabetically
	const sortedCategories = useMemo(() => {
		return categories ? sortValues(categories) : [];
	}, [categories]);

	if (!sortedCategories || sortedCategories.length === 0) {
		return null;
	}

	return (
		<Card padding={3} radius={2} tone="default" style={{ marginBottom: '1rem', breakInside: 'avoid' }}>
			<Stack space={3}>
				<Heading size={1}>Categories</Heading>
				<Stack space={2}>
					{sortedCategories.map((category) => (
						<Flex key={category} align="center" gap={2}>
							<Checkbox
								checked={selectedCategories.includes(category)}
								onChange={(event) => onValueChange('__categories', category, event.currentTarget.checked)}
							/>
							<Text size={1} style={{ textTransform: 'none' }}>
								{category}
							</Text>
						</Flex>
					))}
				</Stack>
			</Stack>
		</Card>
	);
}

// Separate component for fetching feature names
function FeatureNamesList({
	filters,
	onValueChange,
}: {
	filters: Map<string, string[]>;
	onValueChange: (featureName: string, value: string, checked: boolean) => void;
}) {
	const { data: featureNames } = useQuery<string[]>({
		query: allFeatureNamesQuery,
	});

	// Sort feature names alphabetically with numeric awareness
	const sortedFeatureNames = useMemo(() => {
		return featureNames ? sortValues(featureNames) : [];
	}, [featureNames]);

	if (!sortedFeatureNames || sortedFeatureNames.length === 0) {
		return <Text>No filters available</Text>;
	}

	return (
		<>
			{sortedFeatureNames.map((featureName) => (
				<Suspense
					key={featureName}
					fallback={
						<Card padding={3} radius={2} tone="default" style={{ marginBottom: '1rem', breakInside: 'avoid' }}>
							<Stack space={2}>
								<Heading size={1}>{featureName}</Heading>
								<Spinner size={1} />
							</Stack>
						</Card>
					}
				>
					<FeatureFilter
						featureName={featureName}
						selectedValues={filters.get(featureName) || []}
						onValueChange={onValueChange}
					/>
				</Suspense>
			))}
		</>
	);
}

export function ProductFilters({ onFilterChange }: ProductFiltersProps) {
	const [filters, setFilters] = useState<Map<string, string[]>>(new Map());

	// Update parent when filters change
	useEffect(() => {
		onFilterChange(filters);
	}, [filters, onFilterChange]);

	const handleCheckboxChange = (featureName: string, value: string, checked: boolean) => {
		setFilters((prevFilters) => {
			const newFilters = new Map(prevFilters);
			const currentValues = newFilters.get(featureName) || [];

			if (checked) {
				// Add value if not already present
				if (!currentValues.includes(value)) {
					newFilters.set(featureName, [...currentValues, value]);
				}
			} else {
				// Remove value
				const updatedValues = currentValues.filter((v) => v !== value);
				if (updatedValues.length === 0) {
					newFilters.delete(featureName);
				} else {
					newFilters.set(featureName, updatedValues);
				}
			}

			return newFilters;
		});
	};

	return (
		<Card padding={4} radius={2} shadow={1}>
			<Stack space={4}>
				<Heading size={2}>Filters</Heading>
				<div
					style={{
						columnCount: 'auto',
						columnWidth: '220px',
						columnGap: '1rem',
					}}
				>
					{/* Made to Order Filter */}
					<Card padding={3} radius={2} tone="default" style={{ marginBottom: '1rem', breakInside: 'avoid' }}>
						<Stack space={3}>
							<Heading size={1}>Made to Order</Heading>
							<Stack space={2}>
								<Flex align="center" gap={2}>
									<Checkbox
										checked={filters.get('__madeToOrder')?.includes('true') || false}
										onChange={(event) => handleCheckboxChange('__madeToOrder', 'true', event.currentTarget.checked)}
									/>
									<Text size={1} style={{ textTransform: 'none' }}>
										Yes
									</Text>
								</Flex>
								<Flex align="center" gap={2}>
									<Checkbox
										checked={filters.get('__madeToOrder')?.includes('false') || false}
										onChange={(event) => handleCheckboxChange('__madeToOrder', 'false', event.currentTarget.checked)}
									/>
									<Text size={1} style={{ textTransform: 'none' }}>
										No
									</Text>
								</Flex>
							</Stack>
						</Stack>
					</Card>
					{/* Categories Filter */}
					<CategoriesFilter
						selectedCategories={filters.get('__categories') || []}
						onValueChange={handleCheckboxChange}
					/>
					<FeatureNamesList filters={filters} onValueChange={handleCheckboxChange} />
				</div>
			</Stack>
		</Card>
	);
}

interface FeatureFilterProps {
	featureName: string;
	selectedValues: string[];
	onValueChange: (featureName: string, value: string, checked: boolean) => void;
}

// Each feature filter fetches its own data
function FeatureFilter({ featureName, selectedValues, onValueChange }: FeatureFilterProps) {
	const { data: values } = useQuery({
		query: featureValuesQuery,
		params: { featureName },
	});

	// Sort values with numeric awareness
	const sortedValues = useMemo(() => {
		return values ? sortValues(values) : [];
	}, [values]);

	if (!sortedValues || sortedValues.length === 0) {
		return null;
	}

	return (
		<Card padding={3} radius={2} tone="default" style={{ marginBottom: '1rem', breakInside: 'avoid' }}>
			<Stack space={3}>
				<Heading size={1}>{featureName}</Heading>
				<Stack space={2}>
					{sortedValues.map((value) => (
						<Flex key={value} align="center" gap={2}>
							<Checkbox
								checked={selectedValues.includes(value)}
								onChange={(event) => onValueChange(featureName, value, event.currentTarget.checked)}
							/>
							<Text size={1} style={{ textTransform: 'none' }}>
								{value}
							</Text>
						</Flex>
					))}
				</Stack>
			</Stack>
		</Card>
	);
}
