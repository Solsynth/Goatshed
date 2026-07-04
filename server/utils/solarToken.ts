import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { account } from "~~/server/db/index";

export async function getSolarToken(userId: string): Promise<string | null> {
  const [record] = await db
    .select({
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
      accessTokenExpiresAt: account.accessTokenExpiresAt,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);

  if (!record?.accessToken) return null;

  const isExpired = record.accessTokenExpiresAt
    && new Date(record.accessTokenExpiresAt).getTime() < Date.now() + 60_000;

  if (isExpired && record.refreshToken) {
    return await refreshSolarToken(userId, record.refreshToken);
  }

  return record.accessToken;
}

async function refreshSolarToken(
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const config = useRuntimeConfig();

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    if (process.env.SOLIAN_CLIENT_ID) {
      body.set("client_id", process.env.SOLIAN_CLIENT_ID);
    }
    if (process.env.SOLIAN_CLIENT_SECRET) {
      body.set("client_secret", process.env.SOLIAN_CLIENT_SECRET);
    }

    const response = await fetch(
      `${config.public.apiBaseUrl}/padlock/auth/open/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
    );

    if (!response.ok) {
      console.error("[refreshSolarToken] Failed:", response.status);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token || data.accessToken;
    const newRefreshToken = data.refresh_token || data.refreshToken;
    const expiresIn = data.expires_in || data.expiresIn;

    if (!newAccessToken) return null;

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : null;

    await db
      .update(account)
      .set({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken || refreshToken,
        accessTokenExpiresAt: expiresAt,
      })
      .where(and(eq(account.userId, userId), eq(account.providerId, "solian")));

    return newAccessToken;
  } catch (e) {
    console.error("[refreshSolarToken] Error:", e);
    return null;
  }
}
