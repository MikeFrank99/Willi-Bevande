import { z, defineCollection } from 'astro:content';

const beersCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    brand: z.string(),
    style: z.string(),
    format: z.array(z.string()),
    abv: z.number(),
    country: z.string(),
    image: z.string(),
    description: z.string()
  }),
});

export const collections = {
  beers: beersCollection,
};
