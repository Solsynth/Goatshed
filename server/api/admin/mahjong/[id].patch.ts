import { eq } from "drizzle-orm";
import { requireAdmin } from "~~/server/utils/admin";
import { db } from "~~/server/utils/db";
import { mahjongSession } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw createError({ statusCode: 400, statusMessage: "Missing session ID" });

  const body = await readBody(event);
  const updates: Record<string, any> = {};

  if (body.name !== undefined) updates.name = body.name?.trim() || undefined;
  if (body.description !== undefined) updates.description = typeof body.description === "string" ? body.description.slice(0, 500) : body.description;
  if (body.playerCount !== undefined) {
    updates.playerCount = [3, 4].includes(Number(body.playerCount)) ? Number(body.playerCount) : undefined;
  }
  if (body.initialPoints !== undefined) {
    updates.initialPoints = Math.max(1000, Math.min(100000, Number(body.initialPoints)));
  }
  if (body.ticketValue !== undefined) {
    updates.ticketValue = Math.max(1, Math.min(10000, Number(body.ticketValue)));
  }
  if (body.multiplier !== undefined) {
    updates.multiplier = Math.max(1, Math.min(100, Number(body.multiplier)));
  }
  if (body.status !== undefined) {
    updates.status = ["upcoming", "ongoing", "ended"].includes(body.status) ? body.status : undefined;
  }

  const [updated] = await db
    .update(mahjongSession)
    .set(updates)
    .where(eq(mahjongSession.id, sessionId))
    .returning();

  if (!updated) throw createError({ statusCode: 404, statusMessage: "Session not found" });

  return updated;
});
