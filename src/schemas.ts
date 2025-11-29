import * as z from 'zod/mini';

export const Html = z.string();
export type Html = z.infer<typeof Html>;

export const IntBool = z.codec(z.union([z.literal(0), z.literal(1)]), z.boolean(), {
	decode: (value) => Boolean(value),
	encode: (value) => (value ? 1 : 0),
});

export const StringIntBool = z.codec(z.enum(['0', '1']), z.boolean(), {
	decode: (value) => value === '1',
	encode: (value) => (value ? '1' : '0'),
});

export const StringTrue = z.codec(z.literal('1'), z.literal(true), {
	decode: (): true => true,
	encode: (): '1' => '1',
});

export const StringFalse = z.codec(z.literal('0'), z.literal(false), {
	decode: (): false => false,
	encode: (): '0' => '0',
});
