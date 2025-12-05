import { SanityApp, type SanityConfig, usePaginatedDocuments } from '@sanity/sdk-react';
import { Card, Container, Flex, Grid, Spinner, Stack, Text, ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { Suspense, useCallback, useState } from 'react';
import { ProductCard } from './components/ProductCard.js';
import { ProductFilters } from './components/ProductFilters.js';
import { buildFilterString } from './queries.js';

const theme = buildTheme();

const PRODUCTS_PER_PAGE = 24;

function ProductsList({ filter }: { filter: string }) {
	// Use usePaginatedDocuments for proper pagination with document handles
	const { data, currentPage, totalPages, nextPage, previousPage, hasNextPage, hasPreviousPage } = usePaginatedDocuments(
		{
			documentType: 'product',
			filter: filter || undefined,
			pageSize: PRODUCTS_PER_PAGE,
			orderings: [{ field: 'name', direction: 'asc' }],
		},
	);

	if (!data || data.length === 0) {
		return (
			<Card padding={5}>
				<Flex justify="center" align="center">
					<Text muted>No products found matching the selected filters.</Text>
				</Flex>
			</Card>
		);
	}

	return (
		<Stack space={5}>
			{/* Products Count */}
			<Card padding={3}>
				<Text size={1} muted>
					Showing page {currentPage} of {totalPages}
				</Text>
			</Card>

			{/* Products Grid */}
			<Grid columns={[1, 2, 3, 4]} gap={4}>
				{data.map((handle) => (
					<Suspense
						key={handle.documentId}
						fallback={
							<Card radius={2} shadow={1} padding={4} style={{ aspectRatio: '1' }}>
								<Flex align="center" justify="center" style={{ height: '100%' }}>
									<Spinner />
								</Flex>
							</Card>
						}
					>
						<ProductCard {...handle} />
					</Suspense>
				))}
			</Grid>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<Card padding={4}>
					<Flex align="center" justify="center" gap={3}>
						<button
							type="button"
							disabled={!hasPreviousPage}
							onClick={previousPage}
							style={{
								padding: '8px 16px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								backgroundColor: hasPreviousPage ? '#fff' : '#f5f5f5',
								cursor: hasPreviousPage ? 'pointer' : 'not-allowed',
								opacity: hasPreviousPage ? 1 : 0.5,
							}}
						>
							Previous
						</button>
						<Text size={2}>
							Page {currentPage} of {totalPages}
						</Text>
						<button
							type="button"
							disabled={!hasNextPage}
							onClick={nextPage}
							style={{
								padding: '8px 16px',
								border: '1px solid #ccc',
								borderRadius: '4px',
								backgroundColor: hasNextPage ? '#fff' : '#f5f5f5',
								cursor: hasNextPage ? 'pointer' : 'not-allowed',
								opacity: hasNextPage ? 1 : 0.5,
							}}
						>
							Next
						</button>
					</Flex>
				</Card>
			)}
		</Stack>
	);
}

function ProductBrowser() {
	const [filters, setFilters] = useState<Map<string, string[]>>(new Map());

	// Build filter string from current filters
	const filterString = buildFilterString(filters);

	// Handle filter changes
	const handleFilterChange = useCallback((newFilters: Map<string, string[]>) => {
		setFilters(newFilters);
	}, []);

	return (
		<Container width={5} style={{ padding: '24px' }}>
			<Stack space={5}>
				{/* Filters Section */}
				<Suspense
					fallback={
						<Card padding={4}>
							<Flex justify="center" align="center" padding={4}>
								<Spinner />
							</Flex>
						</Card>
					}
				>
					<ProductFilters onFilterChange={handleFilterChange} />
				</Suspense>

				{/* Products List with Pagination */}
				<Suspense
					fallback={
						<Card padding={5}>
							<Flex justify="center" align="center">
								<Spinner size={3} />
							</Flex>
						</Card>
					}
				>
					<ProductsList filter={filterString} />
				</Suspense>
			</Stack>
		</Container>
	);
}

export default function App() {
	const config: SanityConfig[] = [
		{
			projectId: '5zgry73m',
			dataset: 'production',
		},
	];

	return (
		<ThemeProvider theme={theme}>
			<SanityApp config={config} fallback={<div>Loading...</div>}>
				<ProductBrowser />
			</SanityApp>
		</ThemeProvider>
	);
}
