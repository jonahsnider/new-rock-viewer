import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';
import { type DocumentHandle, useQuery } from '@sanity/sdk-react';
import { Button, Card, Heading, Stack } from '@sanity/ui';
import useEmblaCarousel from 'embla-carousel-react';
import { defineQuery } from 'groq';
import { useCallback } from 'react';
import type { ProductCardDataQueryResult } from '../../../sanity.types.ts';

const builder = createImageUrlBuilder({
	projectId: '5zgry73m',
	dataset: 'production',
});

function urlFor(source: SanityImageSource) {
	return builder.image(source);
}

const productCardDataQuery = defineQuery(
	`*[_type == "product" && _id == $documentId][0]{ name, url, coverImage, images }`,
);

interface ProductCardProps extends DocumentHandle {}

export function ProductCard(props: ProductCardProps) {
	const { data } = useQuery<ProductCardDataQueryResult>({
		query: productCardDataQuery,
		params: { documentId: props.documentId },
	});

	const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

	const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);

	const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

	if (!data) return null;

	// Combine cover image with other images for the carousel
	const allImages = [data.coverImage, ...data.images];

	return (
		<Card radius={2} shadow={1} padding={0} style={{ overflow: 'hidden' }}>
			<Stack space={0}>
				{/* Image Carousel using Embla */}
				<div style={{ position: 'relative', aspectRatio: '1', backgroundColor: '#f0f0f0' }}>
					<div ref={emblaRef} style={{ overflow: 'hidden', height: '100%' }}>
						<div style={{ display: 'flex', height: '100%' }}>
							{allImages.map((image, index) => {
								const imageUrl = image?.asset ? urlFor(image).width(600).height(600).fit('max').url() : '';

								return (
									<div key={image.asset?._ref || index} style={{ flex: '0 0 100%', minWidth: 0, position: 'relative' }}>
										{imageUrl ? (
											<img
												src={imageUrl}
												alt={`${data.name} ${index + 1}`}
												style={{
													width: '100%',
													height: '100%',
													objectFit: 'cover',
												}}
											/>
										) : null}
									</div>
								);
							})}
						</div>
					</div>

					{/* Navigation Arrows */}
					{allImages.length > 1 && (
						<>
							<Button
								mode="ghost"
								icon={() => <span style={{ fontSize: '24px' }}>‹</span>}
								onClick={scrollPrev}
								aria-label="Previous image"
								style={{
									position: 'absolute',
									left: '8px',
									top: '50%',
									transform: 'translateY(-50%)',
									backgroundColor: 'rgba(255, 255, 255, 0.9)',
								}}
							/>
							<Button
								mode="ghost"
								icon={() => <span style={{ fontSize: '24px' }}>›</span>}
								onClick={scrollNext}
								aria-label="Next image"
								style={{
									position: 'absolute',
									right: '8px',
									top: '50%',
									transform: 'translateY(-50%)',
									backgroundColor: 'rgba(255, 255, 255, 0.9)',
								}}
							/>
						</>
					)}
				</div>

				{/* Product Info */}
				<Card padding={3}>
					<Stack space={2}>
						<Heading size={1}>{data.name}</Heading>
						<a
							href={data.url}
							target="_blank"
							rel="noopener noreferrer"
							style={{
								color: 'inherit',
								textDecoration: 'none',
							}}
						>
							<Button text="View Product" tone="primary" mode="ghost" style={{ width: '100%' }} />
						</a>
					</Stack>
				</Card>
			</Stack>
		</Card>
	);
}
