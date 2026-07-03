import { requireAdmin } from "~~/server/utils/admin";
import { eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ID" });

  await db.delete(user).where(eq(user.id, id));

  return { success: true };
});
