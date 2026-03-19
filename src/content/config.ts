import { z, defineCollection } from 'astro:content';

const beersCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    brand: z.string(),
    style: z.string(),
    color: z.string(),
    format: z.array(z.string()),
    abv: z.number(),
    country: z.string(),
    availability: z.enum(['disponibile', 'ordinazione', 'stagionale']).default('disponibile'),
    image: z.string(),
    description: z.string()
  }),
});

export const collections = {
  beers: beersCollection,
};
