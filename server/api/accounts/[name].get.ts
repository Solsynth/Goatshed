import { eq, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { account } from "~~/server/db/index";
import { getSolarToken } from "~~/server/utils/solarProfile";
import { snFetch } from "~~/server/utils/sn-api";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing account name" });
  }

  const token = await getSolarTokenFromSession(event);

  return snFetch<Record<string, any>>(
    event,
    `/passport/accounts/${encodeURIComponent(name)}`,
    { token: token ?? undefined },
  );
});

async function getSolarTokenFromSession(event: any): Promise<string | null> {
  const { auth } = await import("~~/server/utils/auth");
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) return null;
  return await getSolarToken(session.user.id);
}
