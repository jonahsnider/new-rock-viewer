import * as z from 'zod/mini';

export const ImageSize = z.object({
	url: z.url(),
	width: z.int().check(z.positive()),
	height: z.int().check(z.positive()),
});

export const Image = z.object({
	bySize: z.record(
		z.enum(['small_default', 'cart_default', 'home_default', 'medium_default', 'large_default', 'thickbox_default']),
		ImageSize,
	),
	small: ImageSize,
	medium: ImageSize,
	large: ImageSize,
	legend: z.literal(''),
	id_image: z.string(),
	cover: z.nullable(z.literal('1')),
	position: z.string(),
	associatedVariants: z.array(z.unknown()),
});
