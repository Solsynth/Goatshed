import { readSession } from "../../utils/session";
import { clearCloneConversations } from "../../utils/clone-history";

export default defineEventHandler(async (event) => {
  const session = await readSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const threadIds = await clearCloneConversations(session.user.id);

  return {
    ok: true,
    clearedCount: threadIds.length,
  };
});
