import { requireAdmin } from "~~/server/utils/admin";
import { db } from "~~/server/utils/db";
import { mahjongSession } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const body = await readBody(event);
  const name = body.name?.trim();
  if (!name) throw createError({ statusCode: 400, statusMessage: "Name is required" });

  const playerCount = [3, 4].includes(Number(body.playerCount)) ? Number(body.playerCount) : 4;
  const initialPoints = Math.max(1000, Math.min(100000, Number(body.initialPoints) || (playerCount === 3 ? 35000 : 25000)));
  const ticketValue = Math.max(1, Math.min(10000, Number(body.ticketValue) || 100));
  const multiplier = Math.max(1, Math.min(100, Number(body.multiplier) || 1));
  const description = typeof body.description === "string" ? body.description.slice(0, 500) : undefined;

  const [created] = await db
    .insert(mahjongSession)
    .values({
      name,
      description,
      playerCount,
      initialPoints,
      ticketValue,
      multiplier,
      createdBy: event.context.session.user.id,
    })
    .returning();

  return created;
});
