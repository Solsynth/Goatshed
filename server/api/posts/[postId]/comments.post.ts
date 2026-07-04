import type { SolarPost } from "~/types/comment";
import { snakeToCamel } from "~/utils/case";
import { getSolarToken } from "~~/server/utils/solarToken";

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, "postId");
  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const session = event.context.session;
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required" });
  }

  const token = await getSolarToken(session.user.id);
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Solar account not connected" });
  }

  const body = await readBody(event);
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: "Content is required" });
  }
  if (content.length > 5000) {
    throw createError({ statusCode: 400, statusMessage: "Content too long (max 5000 chars)" });
  }

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;

  const payload: Record<string, unknown> = {
    content,
    replied_post_id: postId,
    visibility: "public",
  };

  const response = await fetch(`${baseUrl}/sphere/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const raw = await response.json();
  const post = snakeToCamel<SolarPost>(raw);

  const pub = post.publisher || post.account;

  return {
    id: post.id,
    postId: postId,
    authorId: post.publisher?.id || post.account?.id || session.user.id,
    parentId: post.repliedPost?.id || postId,
    content: post.content || content,
    createdAt: post.createdAt || post.publishedAt,
    updatedAt: post.editedAt || post.updatedAt || post.createdAt,
    author: pub
      ? {
          id: pub.id || "",
          name: pub.name || "",
          nick: pub.nick ?? null,
          avatar: pub.picture?.id
            ? `${baseUrl}/drive/files/${encodeURIComponent(pub.picture.id)}`
            : null,
        }
      : null,
  };
});
