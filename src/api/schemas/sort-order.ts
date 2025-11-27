import * as z from 'zod/mini';

export const SortOrder = z.object({
	entity: z.string(),
	field: z.string(),
	direction: z.enum(['asc', 'desc']),
	label: z.string(),
	urlParameter: z.string(),
	current: z.boolean(),
	url: z.url(),
});
