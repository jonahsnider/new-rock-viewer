import * as z from 'zod/mini';
import { Image } from '../shared.ts';

export const Product = z.object({
	add_to_cart_url: z.nullable(z.url()),
	url: z.url(),
	canonical_url: z.url(),
	labels: z.object({
		tax_short: z.string(),
		tax_long: z.string(),
	}),
	main_variants: z.tuple([]),
	id_product: z.string(),
	price: z.string(),
	reference: z.string(),
	active: z.string(),
	description_short: z.string(),
	link_rewrite: z.string(),
	name: z.string(),
	category_name: z.string(),
	link: z.url(),
	rate: z.number(),
	tax_name: z.string(),
	unit_price: z.string(),
	cover: Image,
	has_discount: z.boolean(),
	discount_type: z.nullable(z.string()),
	discount_percentage: z.nullable(z.string()),
	discount_percentage_absolute: z.nullable(z.string()),
	discount_amount: z.nullable(z.string()),
	price_amount: z.number(),
	regular_price_amount: z.number(),
	regular_price: z.string(),
	discount_to_display: z.nullable(z.string()),
});
export type Product = z.infer<typeof Product>;
