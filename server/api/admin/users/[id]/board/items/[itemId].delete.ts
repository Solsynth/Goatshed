import { requireAdmin } from "~~/server/utils/admin";
import { getUserSolarToken } from "~~/server/utils/solarAccount";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });

  const token = await getUserSolarToken(id);
  if (!token) {
    throw createError({ statusCode: 404, statusMessage: "No linked Solian account or token expired" });
  }

  const config = useRuntimeConfig(event);
  const baseUrl = `${config.public.apiBaseUrl}/passport/accounts/me/board`;

  // Get current board
  const getResponse = await fetch(baseUrl, {
    headers: { "authorization": `Bearer ${token}` },
  });
  if (!getResponse.ok) {
    const text = await getResponse.text();
    throw createError({ statusCode: getResponse.status, message: text || "Failed to fetch board" });
  }
  const board = await getResponse.json() as any[];

  // Remove the item
  const updated = board.filter((item: any) => item.id !== itemId);
  if (updated.length === board.length) {
    throw createError({ statusCode: 404, statusMessage: "Board item not found" });
  }

  // Re-number orders
  updated.forEach((item: any, i: number) => { item.order = i; });

  // Put back
  const putResponse = await fetch(baseUrl, {
    method: "PUT",
    headers: { "content-type": "application/json", "authorization": `Bearer ${token}` },
    body: JSON.stringify(updated),
  });

  if (!putResponse.ok) {
    const text = await putResponse.text();
    throw createError({ statusCode: putResponse.status, message: text || "Failed to update board" });
  }

  return { success: true };
});
