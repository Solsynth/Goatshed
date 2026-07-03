import { requireAdmin } from "~~/server/utils/admin";
import { desc, sql } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { user as userTable } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const query = getQuery(event);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const offset = (page - 1) * limit;

  const users = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      isAdmin: userTable.isAdmin,
      image: userTable.image,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(desc(userTable.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userTable);

  return {
    users,
    total: countResult?.count || 0,
    page,
    limit,
  };
});
