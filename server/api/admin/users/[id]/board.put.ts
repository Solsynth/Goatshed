import { requireAdmin } from "~~/server/utils/admin";
import { getTargetUserBoardAccess, replaceUserBoard } from "~~/server/utils/boardAdmin";

/**
 * Replace board layout via the user's self-board API.
 * Custom-app payloads on items are ignored/preserved by Passport — use
 * the private app-secret payload endpoint for custom-app data.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Missing user ID" });

  const body = await readBody(event);
  if (!Array.isArray(body)) {
    throw createError({ statusCode: 400, statusMessage: "Body must be a board item array" });
  }

  const token = await getTargetUserBoardAccess(id);
  const config = useRuntimeConfig(event);

  try {
    return await replaceUserBoard(config.public.apiBaseUrl, token, body);
  } catch (e: any) {
    if (e.statusCode) throw e;
    console.error("[board.put] Error:", e);
    throw createError({ statusCode: 500, message: e.message || "Failed to update board" });
  }
});
