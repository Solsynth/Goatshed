import type { Publisher } from "~/types/publisher";
import { snFetch } from "~~/server/utils/sn-api";

interface CachedPublishers {
  data: Record<string, Publisher>;
  cachedAt: number;
}

const CACHE_KEY = "publishers:all";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const PUBLISHER_NAMES = ["littlesheep", "littlesheep0v0", "littlesheepuwu"];

export default defineEventHandler(async (event) => {
  const storage = useStorage("data");
  const cached = await storage.getItem<CachedPublishers>(CACHE_KEY);

  if (cached && typeof cached === "object" && Date.now() - cached.cachedAt <= CACHE_TTL) {
    return cached.data;
  }

  const entries = await Promise.all(
    PUBLISHER_NAMES.map(async (name) => {
      try {
        const publisher = await snFetch<Publisher>(
          event,
          `/sphere/publishers/${encodeURIComponent(name)}`,
        );
        return [name, publisher] as const;
      } catch {
        return [name, null] as const;
      }
    }),
  );

  const data = Object.fromEntries(entries) as Record<string, Publisher | null>;

  await storage.setItem(CACHE_KEY, {
    data,
    cachedAt: Date.now(),
  });

  return data;
});
