import { eq } from "drizzle-orm";
import { requireAdmin } from "~~/server/utils/admin";
import { db } from "~~/server/utils/db";
import { mahjongSession } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw createError({ statusCode: 400, statusMessage: "Missing session ID" });

  const [deleted] = await db
    .delete(mahjongSession)
    .where(eq(mahjongSession.id, sessionId))
    .returning();

  if (!deleted) throw createError({ statusCode: 404, statusMessage: "Session not found" });

  return { success: true };
});
