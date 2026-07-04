import { getSolarToken } from "~~/server/utils/solarToken";

export default defineEventHandler(async (event) => {
  const commentId = getRouterParam(event, "commentId");
  if (!commentId) {
    throw createError({ statusCode: 400, statusMessage: "Missing comment id" });
  }

  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const token = await getSolarToken(session.user.id);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Solar account not connected" });
  }

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;

  const response = await fetch(`${baseUrl}/sphere/posts/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  return { success: true };
});
