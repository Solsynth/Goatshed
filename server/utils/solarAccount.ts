import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { account } from "~~/server/db/index";

let cachedToken: string | null = null;
let cachedTokenExpiry = 0;

/**
 * Get an admin API token via client_credentials grant.
 * Falls back to using the API secret directly as a Bearer token.
 * Used for Develop API calls (custom app authentication).
 */
export async function getAdminToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && cachedTokenExpiry > now + 60_000) {
    return cachedToken;
  }

  const clientId = process.env.DONATION_API_KEY_CLIENT_ID;
  const clientSecret = process.env.DONATION_API_KEY_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[getAdminToken] DONATION_API_KEY_CLIENT_ID/SECRET not configured");
    return null;
  }

  const config = useRuntimeConfig();

  // Try client_credentials grant
  try {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(`${config.public.apiBaseUrl}/padlock/auth/open/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (response.ok) {
      const data = await response.json();
      const token = data.access_token || data.accessToken;
      const expiresIn = data.expires_in || data.expiresIn;

      if (token) {
        cachedToken = token;
        cachedTokenExpiry = expiresIn
          ? now + expiresIn * 1000
          : now + 3600_000;
        return token;
      }
    }

    console.warn("[getAdminToken] client_credentials grant failed, falling back to direct API key");
  } catch (e) {
    console.warn("[getAdminToken] client_credentials error:", e);
  }

  // Fall back: use the API secret directly as a Bearer token
  cachedToken = clientSecret;
  cachedTokenExpiry = now + 3600_000;
  return clientSecret;
}

/**
 * Get the user's own solar OAuth token (for Passport API calls).
 * Refreshes if expired.
 */
export async function getUserSolarToken(userId: string): Promise<string | null> {
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
    return await refreshUserSolarToken(userId, record.refreshToken);
  }

  return record.accessToken;
}

async function refreshUserSolarToken(
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const config = useRuntimeConfig();

  try {
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    if (process.env.SOLIAN_CLIENT_ID) body.set("client_id", process.env.SOLIAN_CLIENT_ID);
    if (process.env.SOLIAN_CLIENT_SECRET) body.set("client_secret", process.env.SOLIAN_CLIENT_SECRET);

    const response = await fetch(
      `${config.public.apiBaseUrl}/padlock/auth/open/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      },
    );

    if (!response.ok) {
      console.error("[refreshUserSolarToken] Failed:", response.status);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token || data.accessToken;
    const newRefreshToken = data.refresh_token || data.refreshToken;
    const expiresIn = data.expires_in || data.expiresIn;

    if (!newAccessToken) return null;

    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

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
    console.error("[refreshUserSolarToken] Error:", e);
    return null;
  }
}

/**
 * Get the DysonNetwork account name for a local user.
 */
export async function getSolarAccountName(userId: string): Promise<string | null> {
  const [record] = await db
    .select({ solarProfile: account.solarProfile })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);

  return (record?.solarProfile as Record<string, any> | null)?.name ?? null;
}

/**
 * Get the DysonNetwork account ID (GUID) for a local user.
 */
export async function getSolarAccountId(userId: string): Promise<string | null> {
  const [record] = await db
    .select({ solarProfile: account.solarProfile })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);

  return (record?.solarProfile as Record<string, any> | null)?.id ?? null;
}
