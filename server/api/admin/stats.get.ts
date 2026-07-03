import { requireAdmin } from "~~/server/utils/admin";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders, user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const [orderStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      paid: sql<number>`count(*) filter (where ${orders.status} = '已支付')::int`,
      unpaid: sql<number>`count(*) filter (where ${orders.status} = '待支付')::int`,
      finished: sql<number>`count(*) filter (where ${orders.status} = '已完成')::int`,
      totalAmount: sql<string>`coalesce(sum(${orders.amount}) filter (where ${orders.status} = '已支付'), 0)`,
    })
    .from(orders);

  const [userStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      admins: sql<number>`count(*) filter (where ${user.isAdmin} = true)::int`,
    })
    .from(user);

  const recentOrders = await db
    .select({
      id: orders.id,
      productType: orders.productType,
      amount: orders.amount,
      currency: orders.currency,
      status: orders.status,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
      userName: user.name,
    })
    .from(orders)
    .innerJoin(user, eq(orders.userId, user.id))
    .orderBy(desc(orders.createdAt))
    .limit(10);

  return {
    orders: orderStats || { total: 0, paid: 0, unpaid: 0, finished: 0, totalAmount: "0" },
    users: userStats || { total: 0, admins: 0 },
    recent: recentOrders,
  };
});
