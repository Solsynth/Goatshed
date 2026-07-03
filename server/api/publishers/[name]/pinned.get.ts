import type { Post } from "../../../../app/types/post";
import { floatingFetch } from "../../../utils/floating-api";

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

  return floatingFetch<Post[]>(
    event,
    `/sphere/posts?pub=${encodeURIComponent(name)}&pinned=true&type=1&take=5`,
  );
});
