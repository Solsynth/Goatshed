import { requireAdmin } from "~~/server/utils/admin";
import { desc, eq, sql, and } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders, user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const status = query.status as string | undefined;
  const productType = query.productType as string | undefined;
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const filters = [];
  if (status) filters.push(eq(orders.status, status));
  if (productType) filters.push(eq(orders.productType, productType));
  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const data = await db
    .select({
      id: orders.id,
      orderId: orders.orderId,
      productType: orders.productType,
      amount: orders.amount,
      currency: orders.currency,
      quantity: orders.quantity,
      status: orders.status,
      deliveryStatus: orders.deliveryStatus,
      remarks: orders.remarks,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
      userId: orders.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(orders)
    .innerJoin(user, eq(orders.userId, user.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(whereClause);

  return {
    orders: data,
    total: countResult?.count || 0,
    page,
    limit,
  };
});


