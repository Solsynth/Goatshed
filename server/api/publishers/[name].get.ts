import { snFetch } from "~~/server/utils/sn-api";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name");
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Missing publisher name" });
  }

  return snFetch(event, `/sphere/publishers/${encodeURIComponent(name)}`);
});
