import * as z from 'zod/mini';

const PageNumber = z.int().check(z.positive());
const Page = z.object({
	type: z.enum(['page', 'next', 'previous']),
	page: PageNumber,
	clickable: z.boolean(),
	current: z.boolean(),
	url: z.url(),
});
export const Pagination = z.object({
	total_items: PageNumber,
	items_shown_from: PageNumber,
	items_shown_to: PageNumber,
	current_page: PageNumber,
	pages_count: PageNumber,
	pages: z.array(Page),
});
