import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const gamesCollection = defineCollection({
  loader: file("content/games.yaml"),
  schema: z.object({
    title: z.string(),
    price: z.number(),
    description: z.string(),
    cover: z.string(),
    thumbnail: z.string().optional(), // Smaller thumbnail image for previews/checkout
    files: z.array(
      z.object({
        name: z.string(),
        filename: z.string(),
        size_gb: z.number(),
        description: z.string().optional(),
      })
    ),
    release_date: z.string(),
    featured: z.boolean().default(false),
    screenshots: z.array(z.string()).optional(),
    small_screenshots: z.array(z.string()).optional(),
    system_requirements: z
      .array(
        z.object({
          platform: z.string(), // Custom platform name (e.g., "Windows", "macOS", "Linux", "Steam Deck", etc.)
          requirements: z.string(), // Requirements text
        })
      )
      .optional(),
  }),
});

// Optional per-game markdown descriptions
// Create files like: src/content/game-descriptions/walk-through-the-forest.md
const gameDescriptionsCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "content/game-descriptions" }),
  schema: z.object({
    title: z.string().optional(), // Optional override for game title
  }),
});

export const collections = {
  games: gamesCollection,
  "game-descriptions": gameDescriptionsCollection,
};
