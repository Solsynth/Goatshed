import { z } from "zod";
import { readSession } from "../../utils/session";
import { getCloneConversation, deleteCloneConversation } from "../../utils/clone-history";

const requestSchema = z.object({
  threadId: z.string().trim().min(1),
});

export default defineEventHandler(async (event) => {
  const session = await readSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const payload = requestSchema.safeParse(await readBody(event));
  if (!payload.success) {
    throw createError({ statusCode: 400, statusMessage: "Invalid request payload" });
  }

  const threadId = payload.data.threadId;
  const conversation = await getCloneConversation(session.user.id, threadId);
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: "Conversation not found" });
  }

  await deleteCloneConversation(session.user.id, threadId);
  return { ok: true, threadId };
});
