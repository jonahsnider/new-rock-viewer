import * as z from 'zod/mini';

export const Html = z.string();
export type Html = z.infer<typeof Html>;
