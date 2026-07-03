import { eq, desc, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders, user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
  const offset = Math.max(0, Number(query.offset) || 0);

  const sponsors = await db
    .select({
      id: orders.id,
      amount: orders.amount,
      currency: orders.currency,
      quantity: orders.quantity,
      remarks: orders.remarks,
      paidAt: orders.paidAt,
      userName: user.name,
      userImage: user.image,
    })
    .from(orders)
    .innerJoin(user, eq(orders.userId, user.id))
    .where(eq(orders.status, "已支付"))
    .orderBy(desc(orders.amount), desc(orders.paidAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.status, "已支付"));

  const [totalResult] = await db
    .select({ total: sql<string>`coalesce(sum(${orders.amount}), 0)` })
    .from(orders)
    .where(eq(orders.status, "已支付"));

  const config = useRuntimeConfig(event);

  return {
    sponsors: sponsors.map((s) => ({
      id: s.id,
      name: s.userName,
      avatarUrl: s.userImage || `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(s.userName)}/picture`,
      amount: s.amount,
      currency: s.currency,
      quantity: s.quantity,
      remarks: s.remarks,
      paidAt: s.paidAt,
    })),
    total: countResult?.count || 0,
    totalAmount: totalResult?.total || "0",
  };
});
