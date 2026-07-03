import { snFetch } from "~~/server/utils/sn-api";
import { snakeToCamel } from "~~/server/utils/snakeToCamel";

interface CachedProduct {
  data: Record<string, any>;
  cachedAt: number;
}

const CACHE_TTL = 60 * 60 * 1000;

const PRODUCT_IDENTIFIERS: Record<string, string> = {
  donation: "donation",
  gaming: "gaming",
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const productType = (query.type as string) || "donation";
  const identifier = PRODUCT_IDENTIFIERS[productType] || PRODUCT_IDENTIFIERS.donation;

  const cacheKey = `product:${productType}`;
  const storage = useStorage("data");
  const cached = await storage.getItem<CachedProduct>(cacheKey);

  if (cached && typeof cached === "object" && Date.now() - cached.cachedAt <= CACHE_TTL) {
    return { ...cached.data, productType };
  }

  const rawData = await snFetch<Record<string, any>>(
    event,
    `/develop/apps/goatshed/products/${identifier}`,
  );

  const data = snakeToCamel<any>(rawData);
  if (data.picture && !data.picture.url) {
    data.pictureUrl = `https://api.solian.app/drive/files/${encodeURIComponent(data.picture.id)}`;
  }
  const response = { ...data, productType };

  await storage.setItem(cacheKey, {
    data: response,
    cachedAt: Date.now(),
  });

  return response;
});
