import { snFetch } from "~~/server/utils/sn-api";
import { snakeToCamel } from "~~/server/utils/snakeToCamel";
import { getAdminToken } from "~~/server/utils/solarAccount";

export default defineEventHandler(async (event) => {
  const token = await getAdminToken();
  if (!token) {
    throw createError({ statusCode: 500, statusMessage: "API not configured" });
  }

  const products = await snFetch<any[]>(
    event,
    "/develop/apps/goatshed/products",
    { token },
  );

  return (products || []).map((p) => {
    const item = snakeToCamel<any>(p);
    if (item.picture && !item.picture.url) {
      item.pictureUrl = `https://api.solian.app/drive/files/${encodeURIComponent(item.picture.id)}`;
    }
    return item;
  });
});
