import type { Post } from "../../../app/types/post";
import { floatingFetch } from "../../utils/floating-api";
import { readSession } from "../../utils/session";

const LOCKED_PUBLISHERS = new Set(["littlesheepuwu"]);

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing post id" });
  }

  const session = await readSession(event);
  const token = session?.accessToken;

  const post = await floatingFetch<Post>(
    event,
    `/sphere/posts/${encodeURIComponent(id)}`,
    { token },
  );

  if (post?.publisher?.name && LOCKED_PUBLISHERS.has(post.publisher.name) && !session) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: this post requires authentication",
    });
  }

  return post;
});
