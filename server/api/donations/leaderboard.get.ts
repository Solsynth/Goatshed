import { desc, eq, sql, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders, user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
  const offset = Math.max(0, Number(query.offset) || 0);
  const productType = query.productType as string | undefined;

  const config = useRuntimeConfig();

  const paidFilter = eq(orders.status, "已支付");
  const typeFilter = productType ? eq(orders.productType, productType) : undefined;
  const whereFilter = typeFilter ? and(paidFilter, typeFilter) : paidFilter;

  const leaderboard = await db
    .select({
      userId: orders.userId,
      userName: user.name,
      userImage: user.image,
      totalAmount: sql<string>`sum(${orders.amount})`,
      currency: sql<string>`max(${orders.currency})`,
      count: sql<number>`count(*)::int`,
      lastPaidAt: sql<string>`max(${orders.paidAt})`,
    })
    .from(orders)
    .innerJoin(user, eq(orders.userId, user.id))
    .where(whereFilter)
    .groupBy(orders.userId, user.name, user.image)
    .orderBy(desc(sql`sum(${orders.amount})`))
    .limit(limit)
    .offset(offset);

  const [statsResult] = await db
    .select({
      total: sql<number>`count(*)::int`,
      totalAmount: sql<string>`coalesce(sum(${orders.amount}), 0)`,
    })
    .from(orders)
    .where(whereFilter);

  return {
    leaderboard: leaderboard.map((entry) => ({
      id: entry.userId,
      name: entry.userName,
      avatarUrl: entry.userImage || `${config.public.apiBaseUrl}/passport/accounts/${encodeURIComponent(entry.userName)}/picture`,
      totalAmount: entry.totalAmount,
      currency: entry.currency,
      count: entry.count,
      lastPaidAt: entry.lastPaidAt,
    })),
    total: statsResult?.total || 0,
    totalAmount: statsResult?.totalAmount || "0",
  };
});
