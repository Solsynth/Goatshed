import type { SolarPost, CommentAuthor } from "~/types/comment";
import { snakeToCamel } from "~/utils/case";
import { getSolarToken } from "~~/server/utils/solarToken";

function extractAuthor(post: SolarPost, baseUrl: string): CommentAuthor | null {
  const pub = post.publisher || post.account;
  if (!pub) return null;

  return {
    id: pub.id || "",
    name: pub.name || "",
    nick: pub.nick ?? null,
    avatar: pub.picture?.id ? `${baseUrl}/drive/files/${encodeURIComponent(pub.picture.id)}` : null,
  };
}

export default defineEventHandler(async (event) => {
  const postId = getRouterParam(event, "postId");
  if (!postId) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const query = getQuery(event);
  const take = Math.min(Number(query.take) || 20, 50);
  const offset = Math.max(Number(query.offset) || 0, 0);

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;

  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
  });

  const config = useRuntimeConfig();
  const baseUrl = config.public.apiBaseUrl;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["authorization"] = `Bearer ${token}`;
  }

  const url = `${baseUrl}/sphere/posts/${postId}/replies?${params.toString()}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || `Request failed: ${response.status}`,
    });
  }

  const total = Number.parseInt(response.headers.get("x-total") || "0", 10);
  const raw = await response.json();
  const posts = snakeToCamel<SolarPost[]>(raw);

  const comments = posts.map((post) => ({
    id: post.id,
    postId: postId,
    authorId: post.publisher?.id || post.account?.id || "",
    parentId: post.repliedPost?.id || null,
    content: post.content || "",
    createdAt: post.createdAt || post.publishedAt,
    updatedAt: post.editedAt || post.updatedAt || post.createdAt,
    author: extractAuthor(post, baseUrl),
  }));

  return { comments, total };
});
