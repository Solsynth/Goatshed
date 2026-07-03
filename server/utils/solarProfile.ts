import type { H3Event } from "h3";
import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { account, user } from "~~/server/db/index";
import { auth } from "./auth";

const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

export async function getSolarToken(userId: string): Promise<string | null> {
  const [record] = await db
    .select({ accessToken: account.accessToken })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);
  return record?.accessToken ?? null;
}

export async function getCachedSolarProfile(userId: string, force = false) {
  const [record] = await db
    .select({
      solarProfile: account.solarProfile,
      solarProfileUpdatedAt: account.solarProfileUpdatedAt,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")))
    .limit(1);

  if (
    !force &&
    record?.solarProfile &&
    record.solarProfileUpdatedAt &&
    Date.now() - record.solarProfileUpdatedAt.getTime() < PROFILE_TTL_MS
  ) {
    return record.solarProfile as Record<string, any>;
  }

  const token = await getSolarToken(userId);
  if (!token) return record?.solarProfile as Record<string, any> | null;

  const config = useRuntimeConfig();
  const response = await fetch(`${config.public.apiBaseUrl}/passport/accounts/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return record?.solarProfile as Record<string, any> | null;

  const profile = await response.json();

  await db
    .update(account)
    .set({
      solarProfile: profile,
      solarProfileUpdatedAt: new Date(),
    })
    .where(and(eq(account.userId, userId), eq(account.providerId, "solian")));

  return profile as Record<string, any>;
}

export async function getSessionUserProfile(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) return null;
  return await getCachedSolarProfile(session.user.id);
}
