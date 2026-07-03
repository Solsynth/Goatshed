import { getIsAdmin } from "~~/server/utils/admin";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) return { isAdmin: false };
  const isAdmin = await getIsAdmin(session.user.id);
  return { isAdmin };
});
