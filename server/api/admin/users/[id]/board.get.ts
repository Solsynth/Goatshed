import { requireAdmin } from "~~/server/utils/admin";
import { getUserSolarToken } from "~~/server/utils/solarAccount";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const token = await getUserSolarToken(id);
  if (!token) {
    throw createError({ statusCode: 404, statusMessage: "No linked Solian account or token expired" });
  }

  const config = useRuntimeConfig(event);
  const url = `${config.public.apiBaseUrl}/passport/accounts/me/board`;
  const response = await fetch(url, {
    headers: { "authorization": `Bearer ${token}` },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[board.get] Downstream error:", { url, status: response.status, body: text });
    throw createError({ statusCode: response.status, message: text || `Passport API returned ${response.status}` });
  }

  return await response.json();
});
