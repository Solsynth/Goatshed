import { eq, and, sql } from "drizzle-orm";
import { orders, sessionParticipant, mahjongParticipant } from "~~/server/db/index";

export async function getUserTicketBalance(database: any, userId: string) {
  const [total] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.productType, "gaming"),
        eq(orders.status, "已支付"),
      ),
    );

  const [gamingUsed] = await database
    .select({ count: sql<number>`coalesce(sum(${sessionParticipant.ticketsUsed}), 0)::int` })
    .from(sessionParticipant)
    .where(eq(sessionParticipant.userId, userId));

  const [mahjongUsed] = await database
    .select({ count: sql<number>`coalesce(sum(${mahjongParticipant.ticketsUsed}), 0)::int` })
    .from(mahjongParticipant)
    .where(eq(mahjongParticipant.userId, userId));

  const totalTickets = total?.count || 0;
  const usedTickets = (gamingUsed?.count || 0) + (mahjongUsed?.count || 0);

  return {
    total: totalTickets,
    used: usedTickets,
    available: totalTickets - usedTickets,
  };
}
