import * as z from 'zod/mini';

const Image = z.object({
	url: z.url(),
	width: z.int().check(z.positive()),
	height: z.int().check(z.positive()),
});

export const Product = z.object({
	add_to_cart_url: z.nullable(z.url()),
	url: z.url(),
	canonical_url: z.url(),
	labels: z.object({
		tax_short: z.string(),
		tax_long: z.string(),
	}),
	main_variants: z.array(z.unknown()),
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
	cover: z.object({
		bySize: z.record(
			z.enum(['small_default', 'cart_default', 'home_default', 'medium_default', 'large_default', 'thickbox_default']),
			Image,
		),
		small: Image,
		medium: Image,
		large: Image,
		legend: z.string(),
		id_image: z.string(),
		cover: z.string(),
		position: z.string(),
		associatedVariants: z.array(z.unknown()),
	}),
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
