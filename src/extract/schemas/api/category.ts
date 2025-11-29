import * as z from 'zod/mini';
import { Html } from '../../../schemas.ts';
import { Pagination } from './pagination.ts';
import { Product } from './product.ts';
import { SortOrder } from './sort-order.ts';

export const CategoryProductListingPage = z.strictObject({
	rendered_products_top: Html,
	rendered_products: Html,
	rendered_products_bottom: Html,
	rendered_products_header: Html,
	rendered_facets: Html,
	rendered_active_filters: Html,
	result: z.object(),
	label: z.string(),
	products: z.array(Product),
	sort_orders: z.array(SortOrder),
	sort_selected: z.boolean(),
	pagination: Pagination,
	js_enabled: z.literal(true),
	current_url: z.url(),
});
export type CategoryProductListingPage = z.infer<typeof CategoryProductListingPage>;
