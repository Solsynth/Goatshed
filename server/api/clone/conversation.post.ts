import { readSession } from "../../utils/session";
import { createCloneConversation } from "../../utils/clone-history";
import { getCloneImpressionState } from "../../utils/clone-impression";
import { getCloneMoodState } from "../../utils/clone-mood";

export default defineEventHandler(async (event) => {
  const session = await readSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const conversation = await createCloneConversation(session.user.id);
  const impression = await getCloneImpressionState(session.user.id);
  const moodState = await getCloneMoodState();

  return {
    threadId: conversation.threadId,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    favorability: impression.favorability,
    latestImpression: impression.impressions[0] ?? null,
    mood: moodState.mood,
  };
});
