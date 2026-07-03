import { requireAdmin } from "~~/server/utils/admin";
import { eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { orders } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ID" });

  const body = await readBody(event);

  const [updated] = await db
    .update(orders)
    .set({ status: body.status })
    .where(eq(orders.id, id))
    .returning();

  if (!updated) throw createError({ statusCode: 404, statusMessage: "Order not found" });

  return updated;
});
