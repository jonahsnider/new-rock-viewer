import { BasketIcon, ControlsIcon, HashIcon, ImageIcon, LinkIcon, TextIcon, WrenchIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const product = defineType({
	name: 'product',
	title: 'Product',
	type: 'document',
	icon: BasketIcon,
	fields: [
		defineField({
			name: 'slug',
			title: 'Slug',
			icon: HashIcon,
			type: 'slug',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'name',
			title: 'Name',
			icon: BasketIcon,
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'description',
			title: 'Description',
			icon: TextIcon,
			type: 'text',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'url',
			title: 'URL',
			icon: LinkIcon,
			type: 'url',
			validation: (rule) => rule.required(),
		}),

		defineField({
			name: 'coverImage',
			title: 'Cover image',
			icon: ImageIcon,
			type: 'image',
			validation: (rule) => rule.required().assetRequired(),
		}),
		defineField({
			name: 'images',
			title: 'Images',
			icon: ImageIcon,
			type: 'array',
			of: [{ type: 'image', validation: (rule) => rule.required().assetRequired() }],
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'features',
			title: 'Features',
			icon: ControlsIcon,
			type: 'array',
			of: [
				{
					type: 'object',
					fields: [
						{ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() },
						{ name: 'value', title: 'Value', type: 'string', validation: (rule) => rule.required() },
					],
				},
			],
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'madeToOrder',
			title: 'Made to order',
			icon: WrenchIcon,
			type: 'boolean',
			validation: (rule) => rule.required(),
		}),
	],
});
