import {
	BasketIcon,
	DiamondIcon,
	HashIcon,
	ImageIcon,
	LinkIcon,
} from '@sanity/icons';
import { defineField, defineType } from 'sanity';

export const product = defineType({
	name: 'product',
	title: 'Product',
	type: 'document',
	icon: BasketIcon,
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			icon: BasketIcon,
			type: 'string',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'productId',
			title: 'ID',
			icon: HashIcon,
			type: 'slug',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'linkRewrite',
			title: 'Link rewrite',
			icon: HashIcon,
			type: 'slug',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'canonicalUrl',
			title: 'Canonical URL',
			icon: LinkIcon,
			type: 'url',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'price',
			title: 'Price',
			icon: DiamondIcon,
			type: 'number',
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'image',
			title: 'Image',
			icon: ImageIcon,
			type: 'image',
			validation: (rule) => rule.required().assetRequired(),
		}),
	],
});
