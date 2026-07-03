import { auth } from "~~/server/utils/auth";
import { db } from "~~/server/utils/db";
import { user as userTable } from "~~/server/db/index";
import { eq } from "drizzle-orm";

const ADMIN_REFRESH_INTERVAL = 60 * 60 * 1000;

export default defineNitroPlugin(async (nitroApp) => {
  nitroApp.hooks.hook("request", async (event) => {
    const cookieHeader = getRequestHeader(event, "cookie") || "";
    if (!cookieHeader) {
      event.context.session = null;
      return;
    }

    try {
      const session = await auth.api.getSession({
        headers: new Headers({ cookie: cookieHeader }),
      });
      event.context.session = session;
      if (session) {
        await maybeAssignAdmin(session.user.id, session.user.email);
      }
    } catch {
      event.context.session = null;
    }
  });
});

const lastRefresh = new Map<string, number>();

async function maybeAssignAdmin(userId: string, email: string) {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (adminEmails.length === 0) return;
  if (!adminEmails.includes(email)) return;

  const now = Date.now();
  const last = lastRefresh.get(userId) ?? 0;
  if (now - last < ADMIN_REFRESH_INTERVAL) return;

  lastRefresh.set(userId, now);
  await db.update(userTable).set({ isAdmin: true }).where(eq(userTable.id, userId));
}
