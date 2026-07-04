import { requireAdmin } from "~~/server/utils/admin";
import { eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { gamingSession } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ID" });

  const body = await readBody(event);
  const updateData: Record<string, any> = {};
  if (body.status) updateData.status = body.status;
  if (body.name) updateData.name = body.name;
  if (body.ticketCost) updateData.ticketCost = Math.max(1, Number(body.ticketCost) || 1);

  const [updated] = await db
    .update(gamingSession)
    .set(updateData)
    .where(eq(gamingSession.id, id))
    .returning();

  if (!updated) throw createError({ statusCode: 404, statusMessage: "Session not found" });

  return updated;
});
