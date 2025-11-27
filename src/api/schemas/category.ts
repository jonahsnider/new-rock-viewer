import * as z from 'zod/mini';
import { Pagination } from './pagination.ts';
import { Product } from './product.ts';
import { SortOrder } from './sort-order.ts';

export const CategoryProductListingPage = z.object({
	rendered_products_top: z.string(),
	rendered_products: z.string(),
	rendered_products_bottom: z.string(),
	result: z.object(),
	label: z.string(),
	products: z.array(Product),
	sort_orders: z.array(SortOrder),
	sort_selected: z.boolean(),
	pagination: Pagination,
});
export type CategoryProductListingPage = z.infer<typeof CategoryProductListingPage>;
