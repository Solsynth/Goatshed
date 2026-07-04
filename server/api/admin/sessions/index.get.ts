import { requireAdmin } from "~~/server/utils/admin";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { gamingSession, sessionParticipant, user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

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
    .orderBy(desc(gamingSession.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gamingSession);

  return {
    sessions,
    total: countResult?.count || 0,
    page,
    limit,
  };
});
