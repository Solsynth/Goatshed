import type { Post } from "../../../app/types/post";
import { floatingFetch } from "../../utils/floating-api";
import { getSolarToken } from "../../utils/solarProfile";
import { isPublisherName } from "../../../app/constants/publishers";

const LOCKED_PUBLISHERS = new Set(["littlesheepuwu"]);

function isUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const segments = id.split("/");
  const lastSegment = segments.at(-1)!;

  if (lastSegment === "prev" || lastSegment === "next") {
    const postPath = segments.slice(0, -1).join("/");
    const pathSegments = postPath.split("/");
    const pathLastSegment = pathSegments.at(-1)!;
    const postId = isUuid(pathLastSegment) ? pathLastSegment : postPath;
    return await getNavigationPost(event, postId, lastSegment);
  }

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;

  const postId = isUuid(lastSegment) ? lastSegment : id;

  const post = await floatingFetch<Post>(event, `/sphere/posts/${postId}`, {
    token: token ?? undefined,
  });

  if (
    post?.publisher?.name &&
    LOCKED_PUBLISHERS.has(post.publisher.name) &&
    !session
  ) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: this post requires authentication",
    });
  }

  return post;
});

async function getNavigationPost(
  event: any,
  id: string,
  direction: "prev" | "next",
) {
  const query = getQuery(event);
  const pubParam = typeof query.pub === "string" ? query.pub : undefined;
  const typeParam = query.type !== undefined ? Number(query.type) : undefined;

  const session = event.context.session;
  const token = session ? await getSolarToken(session.user.id) : null;

  const currentPost = await floatingFetch<Post>(event, `/sphere/posts/${id}`, {
    token: token ?? undefined,
  });

  if (!currentPost?.publishedAt || !currentPost?.publisher?.name) {
    return null;
  }

  const pub =
    pubParam && isPublisherName(pubParam)
      ? pubParam
      : currentPost.publisher.name;
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
    orderDesc: direction === "prev" ? "true" : "false",
    publishedBefore: direction === "prev" ? currentPost.publishedAt : undefined,
    publishedAfter: direction === "next" ? currentPost.publishedAt : undefined,
  } as any);

  const cleanParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (value && value !== "undefined") {
      cleanParams.set(key, value);
    }
  }

  const result = await floatingFetch<Post[]>(
    event,
    `/sphere/posts?${cleanParams.toString()}`,
    { token: token ?? undefined },
  );
  return result[0] || null;
}
