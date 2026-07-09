import { requireAdmin } from "~~/server/utils/admin";
import { fetchUserBoard, getTargetUserBoardAccess } from "~~/server/utils/boardAdmin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const token = await getTargetUserBoardAccess(id);
  const config = useRuntimeConfig(event);

  try {
    return await fetchUserBoard(config.public.apiBaseUrl, token);
  } catch (e: any) {
    if (e.statusCode) throw e;
    console.error("[board.get] Error:", e);
    throw createError({ statusCode: 500, message: e.message || "Failed to fetch board" });
  }
});
