import { requireAdmin } from "~~/server/utils/admin";
import { getSolarAccountId, getAdminToken } from "~~/server/utils/solarAccount";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });

  const body = await readBody(event);

  // Get the user's DysonNetwork account ID for the Develop API
  const solarAccountId = await getSolarAccountId(id);
  if (!solarAccountId) {
    throw createError({ statusCode: 404, statusMessage: "No linked Solian account" });
  }

  const token = await getAdminToken();
  if (!token) {
    throw createError({ statusCode: 500, statusMessage: "Develop API key unavailable" });
  }

  const config = useRuntimeConfig(event);
  const clientId = process.env.DONATION_API_KEY_CLIENT_ID;

  // Use the Develop API to push widget payload
  const url = `${config.public.apiBaseUrl}/develop/private/apps/${clientId}/board/payload`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      account_id: solarAccountId,
      board_item_id: itemId,
      payload: body.payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[payload.post] Downstream error:", { url, status: response.status, body: text });
    throw createError({ statusCode: response.status, message: text || `Develop API returned ${response.status}` });
  }

  return await response.json();
});
