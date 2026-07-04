import { desc, eq, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { mahjongSession, mahjongParticipant } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

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
      createdAt: mahjongSession.createdAt,
      participantCount: sql<number>`count(${mahjongParticipant.id})::int`,
    })
    .from(mahjongSession)
    .leftJoin(mahjongParticipant, eq(mahjongSession.id, mahjongParticipant.sessionId))
    .groupBy(mahjongSession.id)
    .orderBy(desc(mahjongSession.createdAt));

  return sessions;
});
