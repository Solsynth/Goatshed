import { readSession } from "../../utils/session";
import { getCloneImpressionState } from "../../utils/clone-impression";
import { getCloneMoodState } from "../../utils/clone-mood";

export default defineEventHandler(async (event) => {
  const session = await readSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const impression = await getCloneImpressionState(session.user.id);
  const moodState = await getCloneMoodState();

  return {
    favorability: impression.favorability,
    latestImpression: impression.impressions[0] ?? null,
    mood: moodState.mood,
  };
});
