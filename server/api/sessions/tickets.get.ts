import { eq } from "drizzle-orm";
import { db } from "~~/server/utils/db";
import { getUserTicketBalance } from "~~/server/utils/tickets";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) throw createError({ statusCode: 401 });

  return getUserTicketBalance(db, session.user.id);
});
