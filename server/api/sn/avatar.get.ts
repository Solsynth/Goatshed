import { eq, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { account } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }

  const [record] = await db
    .select({ solarProfile: account.solarProfile })
    .from(account)
    .where(and(eq(account.userId, session.user.id), eq(account.providerId, "solian")))
    .limit(1);

  const name = (record?.solarProfile as Record<string, any> | null)?.name;
  if (!name) {
    return { avatarUrl: null, name: session.user.name };
  }

  const config = useRuntimeConfig();
  return {
    avatarUrl: `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(name)}/picture`,
    name,
  };
});
