import { eq, and } from "drizzle-orm";
import { db } from "../../utils/db";
import { account } from "../../db/index";
import { getSolarToken } from "../../utils/solarProfile";
import { floatingFetch } from "../../utils/floating-api";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing account name" });
  }

  const token = await getSolarTokenFromSession(event);

  return floatingFetch<Record<string, any>>(
    event,
    `/passport/accounts/${encodeURIComponent(name)}`,
    { token: token ?? undefined },
  );
});

async function getSolarTokenFromSession(event: any): Promise<string | null> {
  const { auth } = await import("../../utils/auth");
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) return null;
  return await getSolarToken(session.user.id);
}
