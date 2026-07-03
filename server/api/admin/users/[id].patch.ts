import { requireAdmin } from "~~/server/utils/admin";
import { eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { user } from "~~/server/db/index";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing ID" });

  const body = await readBody(event);

  const [updated] = await db
    .update(user)
    .set({
      name: body.name,
      email: body.email,
      isAdmin: body.isAdmin,
    })
    .where(eq(user.id, id))
    .returning();

  if (!updated) throw createError({ statusCode: 404, statusMessage: "User not found" });

  return updated;
});
