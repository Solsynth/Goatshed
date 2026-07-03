import type { Post } from "~/types/post";
import { snFetch } from "~~/server/utils/sn-api";

const LOCKED_PUBLISHERS = new Set(["littlesheepuwu"]);

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing publisher name" });
  }

  if (LOCKED_PUBLISHERS.has(name)) {
    const session = event.context.session;
    if (!session) {
      throw createError({
        statusCode: 401,
        message: "Unauthorized: this publisher requires authentication",
      });
    }
  }

  return snFetch<Post[]>(
    event,
    `/sphere/posts?pub=${encodeURIComponent(name)}&pinned=true&type=1&take=5`,
  );
});
