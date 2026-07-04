import { requireAdmin } from "~~/server/utils/admin";
import { db } from "~~/server/utils/db";
import { gamingSession } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const name = body.name?.trim();
  if (!name) throw createError({ statusCode: 400, statusMessage: "Name is required" });

  const ticketCost = Math.max(1, Math.min(100, Number(body.ticketCost) || 1));
  const description = typeof body.description === "string" ? body.description.slice(0, 500) : undefined;

  const [created] = await db
    .insert(gamingSession)
    .values({
      name,
      description,
      ticketCost,
      createdBy: event.context.session.user.id,
    })
    .returning();

  return created;
});
