import type { Post } from "../../app/types/post";
import { isPublisherName } from "../../app/constants/publishers";
import { floatingFetchWithTotal } from "../utils/floating-api";
import { readSession } from "../utils/session";

const LOCKED_PUBLISHERS = new Set(["littlesheepuwu"]);

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const take = Math.min(Number(query.take) || 12, 30);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const pubParam = typeof query.pub === "string" ? query.pub : "littlesheep";
  const pub = isPublisherName(pubParam) ? pubParam : "littlesheep";
  const requestedType = Number(query.type);
  const type = requestedType === 0 ? 0 : 1;

  const session = await readSession(event);
  const token = session?.accessToken;

  if (LOCKED_PUBLISHERS.has(pub) && !session) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized: this publisher requires authentication",
    });
  }

  const params = new URLSearchParams({
    take: String(take),
    offset: String(offset),
    pub,
    replies: "false",
    type: String(type),
    orderDesc: "true",
  });

  const result = await floatingFetchWithTotal<Post[]>(
    event,
    `/sphere/posts?${params.toString()}`,
    { token },
  );

  return {
    posts: result.data,
    total: result.total,
  };
});
