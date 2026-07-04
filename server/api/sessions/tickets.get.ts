import { eq, and, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders, sessionParticipant } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.userId, session.user.id),
        eq(orders.productType, "gaming"),
        eq(orders.status, "已支付"),
      ),
    );

  const [used] = await db
    .select({ count: sql<number>`coalesce(sum(${sessionParticipant.ticketsUsed}), 0)::int` })
    .from(sessionParticipant)
    .where(eq(sessionParticipant.userId, session.user.id));

  const totalTickets = total?.count || 0;
  const usedTickets = used?.count || 0;

  return {
    total: totalTickets,
    used: usedTickets,
    available: totalTickets - usedTickets,
  };
});
