import { snFetch } from "~~/server/utils/sn-api";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Missing file id" });
  }

  return snFetch(event, `/drive/files/${encodeURIComponent(id)}`);
});
