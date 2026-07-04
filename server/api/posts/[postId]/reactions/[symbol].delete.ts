import { snakeToCamel } from "~/utils/case";
import { getSolarToken } from "~~/server/utils/solarToken";

interface SolarReaction {
  symbol: string;
  attitude: number;
  count: number;
}

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, "postId");
  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const symbol = getRouterParam(event, "symbol") || getQuery(event).symbol;
  if (!symbol || typeof symbol !== "string") {
    throw createError({ statusCode: 400, statusMessage: "Missing reaction symbol" });
  }

  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const token = await getSolarToken(session.user.id);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Solar account not connected" });
  }

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;

  const response = await fetch(
    `${baseUrl}/sphere/posts/${postId}/reactions/${symbol}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const listResponse = await fetch(
    `${baseUrl}/sphere/posts/${postId}/reactions`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

    let reactions: { symbol: string; count: number; reacted: boolean }[] = [];
  let total = 0;

  if (listResponse.ok) {
    const raw = await listResponse.json();
    const solarReactions = snakeToCamel<SolarReaction[]>(raw);
    reactions = solarReactions.map((r) => ({
      symbol: r.symbol,
      count: r.count,
      reacted: false,
    }));
    total = reactions.reduce((sum, r) => sum + r.count, 0);
  }

  return { reactions, total };
});
