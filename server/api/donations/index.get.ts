import { desc, eq, sql, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(query.limit) || 10));
  const offset = (page - 1) * limit;
  const status = query.status as string | undefined;
  const productType = query.productType as string | undefined;

  const filters = [eq(orders.userId, session.user.id)];
  if (status) filters.push(eq(orders.status, status));
  if (productType) filters.push(eq(orders.productType, productType));
  const userFilter = and(...filters);

  const userOrders = await db
    .select({
      id: orders.id,
      orderId: orders.orderId,
      productType: orders.productType,
      amount: orders.amount,
      currency: orders.currency,
      quantity: orders.quantity,
      status: orders.status,
      remarks: orders.remarks,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(userFilter)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(userFilter);

  return {
    orders: userOrders,
    total: countResult?.count || 0,
    page,
    limit,
  };
});


