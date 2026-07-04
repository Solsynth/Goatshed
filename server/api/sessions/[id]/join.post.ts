import { eq, and, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { gamingSession, sessionParticipant, orders } from "~~/server/db/index";

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

  const [ticketCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.userId, authSession.user.id),
        eq(orders.productType, "gaming"),
        eq(orders.status, "已支付"),
      ),
    );

  const totalTickets = ticketCount?.count || 0;

  const [usedTickets] = await db
    .select({ count: sql<number>`coalesce(sum(${sessionParticipant.ticketsUsed}), 0)::int` })
    .from(sessionParticipant)
    .where(eq(sessionParticipant.userId, authSession.user.id));

  const availableTickets = totalTickets - (usedTickets?.count || 0);

  if (availableTickets < gs.ticketCost) {
    throw createError({
      statusCode: 400,
      statusMessage: `票不够，需要 ${gs.ticketCost} 张，你只有 ${availableTickets} 张`,
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
