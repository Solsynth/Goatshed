import { requireAdmin } from "~~/server/utils/admin";
import { eq, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { account } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "Missing user id" });
  }

  const [record] = await db
    .select({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
      refreshTokenExpiresAt: account.refreshTokenExpiresAt,
    })
    .from(account)
    .where(and(eq(account.userId, id), eq(account.providerId, "solian")))
    .limit(1);

  if (!record?.accessToken) {
    return {
      hasToken: false,
      needsRefresh: true,
      accessToken: null,
      expiresAt: null,
      refreshTokenExpiresAt: null,
    };
  }

  const now = Date.now();
  const expiresMs = record.accessTokenExpiresAt
    ? new Date(record.accessTokenExpiresAt).getTime() - now
    : null;

  return {
    hasToken: true,
    needsRefresh: expiresMs !== null && expiresMs < 60_000,
    accessToken: record.accessToken,
    expiresAt: record.accessTokenExpiresAt,
    refreshTokenExpiresAt: record.refreshTokenExpiresAt,
  };
});
