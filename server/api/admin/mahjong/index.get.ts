import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "~~/server/utils/admin";
import { db } from "~~/server/utils/db";
import { mahjongSession, mahjongParticipant } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const sessions = await db
    .select({
      id: mahjongSession.id,
      name: mahjongSession.name,
      description: mahjongSession.description,
      playerCount: mahjongSession.playerCount,
      initialPoints: mahjongSession.initialPoints,
      ticketValue: mahjongSession.ticketValue,
      multiplier: mahjongSession.multiplier,
      status: mahjongSession.status,
      createdBy: mahjongSession.createdBy,
      createdAt: mahjongSession.createdAt,
      participantCount: sql<number>`count(${mahjongParticipant.id})::int`,
    })
    .from(mahjongSession)
    .leftJoin(mahjongParticipant, eq(mahjongSession.id, mahjongParticipant.sessionId))
    .groupBy(mahjongSession.id)
    .orderBy(desc(mahjongSession.createdAt));

  return { sessions };
});
