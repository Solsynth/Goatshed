import type { Post } from "../../../../app/types/post";
import { floatingFetch } from "../../../utils/floating-api";
import { readSession } from "../../../utils/session";
import { isPublisherName } from "../../../../app/constants/publishers";

const LOCKED_PUBLISHERS = new Set(["littlesheepuwu"]);

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const query = getQuery(event);
  const pubParam = typeof query.pub === "string" ? query.pub : undefined;
  const typeParam = query.type !== undefined ? Number(query.type) : undefined;

  const session = await readSession(event);
  const token = session?.accessToken;

  const currentPost = await floatingFetch<Post>(
    event,
    `/sphere/posts/${id}`,
    { token },
  );

  if (!currentPost?.publishedAt || !currentPost?.publisher?.name) {
    return null;
  }

  const pub = pubParam && isPublisherName(pubParam) ? pubParam : currentPost.publisher.name;
  const type = typeParam !== undefined ? typeParam : (currentPost.type ?? 1);

  if (LOCKED_PUBLISHERS.has(pub) && !session) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: this post requires authentication",
    });
  }

  const params = new URLSearchParams({
    pub,
    type: String(type),
    take: "1",
    offset: "0",
    orderDesc: "true",
    publishedBefore: currentPost.publishedAt,
  });

  const result = await floatingFetch<Post[]>(event, `/sphere/posts?${params.toString()}`, { token });
  return result[0] || null;
});
