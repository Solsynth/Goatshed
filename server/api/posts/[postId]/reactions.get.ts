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

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
  const headers: Record<string, string> = {};
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${baseUrl}/sphere/posts/${postId}/reactions`,
    { headers },
  );

  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const raw = await response.json();
  const solarReactions = snakeToCamel<SolarReaction[]>(raw);

  let userReactions: string[] = [];
  if (token) {
    const mineResponse = await fetch(
      `${baseUrl}/sphere/posts/${postId}/reactions/mine`,
      { headers },
    );
    if (mineResponse.ok) {
      const mineRaw = await mineResponse.json();
      const mineData = snakeToCamel<{ symbol: string }[]>(mineRaw);
      userReactions = mineData.map((r) => r.symbol);
    }
  }

  const reactions = solarReactions.map((r) => ({
    symbol: r.symbol,
    count: r.count,
    reacted: userReactions.includes(r.symbol),
  }));

  const total = reactions.reduce((sum, r) => sum + r.count, 0);

  return { reactions, total };
});
