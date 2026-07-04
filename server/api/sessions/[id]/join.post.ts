import { eq, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { gamingSession, sessionParticipant } from "~~/server/db/index";
import { getUserTicketBalance } from "~~/server/utils/tickets";

export default defineEventHandler(async (event) => {
  const authSession = event.context.session;
  if (!authSession) throw createError({ statusCode: 401 });

  const sessionId = getRouterParam(event, "id");
  if (!sessionId) throw createError({ statusCode: 400, statusMessage: "Missing session ID" });

  const [gs] = await db
    .select()
    .from(gamingSession)
    .where(eq(gamingSession.id, sessionId))
    .limit(1);

  if (!gs) throw createError({ statusCode: 404, statusMessage: "Session not found" });

  const [existing] = await db
    .select()
    .from(sessionParticipant)
    .where(
      and(
        eq(sessionParticipant.sessionId, sessionId),
        eq(sessionParticipant.userId, authSession.user.id),
      ),
    )
    .limit(1);

  if (existing) throw createError({ statusCode: 409, statusMessage: "Already joined" });

  const balance = await getUserTicketBalance(db, authSession.user.id);

  if (balance.available < gs.ticketCost) {
    throw createError({
      statusCode: 400,
      statusMessage: `票不够，需要 ${gs.ticketCost} 张，你只有 ${balance.available} 张`,
    });
  }

  await db
    .insert(sessionParticipant)
    .values({
      sessionId,
      userId: authSession.user.id,
      ticketsUsed: gs.ticketCost,
    });

  return { success: true, ticketsUsed: gs.ticketCost };
});
