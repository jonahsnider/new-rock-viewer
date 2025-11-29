import * as z from 'zod/mini';

export const SortOrder = z.strictObject({
	entity: z.string(),
	field: z.string(),
	direction: z.enum(['asc', 'desc']),
	label: z.string(),
	urlParameter: z.string(),
	current: z.boolean(),
	url: z.url(),
});
