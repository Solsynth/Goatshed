import { getCachedSolarProfile } from "~~/server/utils/solarProfile";

export default defineEventHandler(async (event) => {
  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Not authenticated" });
  }
  const profile = await getCachedSolarProfile(session.user.id, true);
  return profile;
});
