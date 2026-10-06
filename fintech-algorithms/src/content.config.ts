import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
export {
  sourceSchema,
  stepSchema,
  exerciseSchema,
  algorithmSchema,
  measureSchema,
} from './engine/schemas';
import { exerciseSchema, algorithmSchema, measureSchema } from './engine/schemas';
export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  algorithms: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './content/algorithms' }),
    schema: algorithmSchema,
  }),
  measures: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './content/measures' }),
    schema: measureSchema,
  }),
  exercises: defineCollection({
    loader: glob({ pattern: '*.yaml', base: './content/exercises' }),
    schema: exerciseSchema,
  }),
};
