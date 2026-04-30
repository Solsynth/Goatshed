import { readSession } from "../../utils/session";
import { listCloneConversations, getCloneConversation } from "../../utils/clone-history";
import { getCloneImpressionState } from "../../utils/clone-impression";
import { getCloneMoodState } from "../../utils/clone-mood";

export default defineEventHandler(async (event) => {
  const session = await readSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(event);
  const threadId = typeof query.threadId === "string" ? query.threadId.trim() : "";

  if (!threadId) {
    const conversations = await listCloneConversations(session.user.id);
    return { conversations };
  }

  const conversation = await getCloneConversation(session.user.id, threadId);
  if (!conversation) {
    throw createError({ statusCode: 404, statusMessage: "Conversation not found" });
  }

  const impression = await getCloneImpressionState(session.user.id);
  const moodState = await getCloneMoodState();
  return {
    threadId: conversation.threadId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages,
    favorability: impression.favorability,
    latestImpression: impression.impressions[0] ?? null,
    mood: moodState.mood,
  };
});
