import { snFetch } from "~~/server/utils/sn-api";
import { snakeToCamel } from "~~/server/utils/snakeToCamel";

export default defineEventHandler(async (event) => {
  const products = await snFetch<any[]>(
    event,
    "/develop/apps/goatshed/products",
  );

  return (products || []).map((p) => {
    const item = snakeToCamel<any>(p);
    if (item.picture && !item.picture.url) {
      item.pictureUrl = `https://api.solian.app/drive/files/${encodeURIComponent(item.picture.id)}`;
    }
    return item;
  });
});
