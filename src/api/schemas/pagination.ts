import * as z from 'zod/mini';

const PageNumber = z.int().check(z.positive());
const Page = z.discriminatedUnion('type', [
	z.object({
		type: z.literal('spacer'),
		page: z.null(),
		clickable: z.literal(false),
		current: z.literal(false),
		url: z.url(),
	}),
	z.object({
		type: z.enum(['next', 'previous']),
		page: PageNumber,
		clickable: z.boolean(),
		current: z.literal(false),
		url: z.url(),
	}),
	z.object({
		type: z.literal('page'),
		page: PageNumber,
		clickable: z.boolean(),
		current: z.boolean(),
		url: z.url(),
	}),
]);
export const Pagination = z.object({
	total_items: PageNumber,
	items_shown_from: PageNumber,
	items_shown_to: PageNumber,
	current_page: PageNumber,
	pages_count: PageNumber,
	pages: z.union([z.array(Page), z.record(z.string(), Page)]),
});
