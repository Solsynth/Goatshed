import { desc, eq, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { gamingSession, sessionParticipant } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  const sessions = await db
    .select({
      id: gamingSession.id,
      name: gamingSession.name,
      description: gamingSession.description,
      ticketCost: gamingSession.ticketCost,
      status: gamingSession.status,
      createdAt: gamingSession.createdAt,
      participantCount: sql<number>`count(${sessionParticipant.id})::int`,
    })
    .from(gamingSession)
    .leftJoin(sessionParticipant, eq(gamingSession.id, sessionParticipant.sessionId))
    .groupBy(gamingSession.id)
    .orderBy(desc(gamingSession.createdAt));

  return sessions;
});
