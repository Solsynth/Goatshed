import { eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { mahjongSession, mahjongParticipant, user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const authSession = event.context.session;
  if (!authSession) throw createError({ statusCode: 401 });

  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw createError({ statusCode: 400, statusMessage: "Missing session ID" });

  const [ms] = await db
    .select()
    .from(mahjongSession)
    .where(eq(mahjongSession.id, sessionId))
    .limit(1);

  if (!ms) throw createError({ statusCode: 404, statusMessage: "Session not found" });

  const participants = await db
    .select({
      id: mahjongParticipant.id,
      userId: mahjongParticipant.userId,
      userName: user.name,
      userNick: user.nick,
      userImage: user.image,
      ticketsUsed: mahjongParticipant.ticketsUsed,
      joinedAt: mahjongParticipant.joinedAt,
    })
    .from(mahjongParticipant)
    .leftJoin(user, eq(mahjongParticipant.userId, user.id))
    .where(eq(mahjongParticipant.sessionId, sessionId))
    .orderBy(mahjongParticipant.joinedAt);

  const totalEntryFee = ms.multiplier * ms.ticketValue * ms.playerCount;
  const perPersonEntryFee = ms.multiplier * ms.ticketValue;

  return {
    ...ms,
    participants,
    participantCount: participants.length,
    perPersonEntryFee,
    totalEntryFee,
    entryFeeTickets: ms.multiplier,
  };
});
