import { requireAdmin } from "~~/server/utils/admin";
import {
  fetchUserBoard,
  getTargetUserBoardAccess,
  replaceUserBoard,
} from "~~/server/utils/boardAdmin";

/**
 * Remove a board item by rewriting the user's full board (self-board PUT).
 * Private app APIs cannot change board layout — only payloads.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });
  }

  const token = await getTargetUserBoardAccess(id);
  const config = useRuntimeConfig(event);
  const board = await fetchUserBoard(config.public.apiBaseUrl, token);

  const updated = board.filter((item) => item.id !== itemId);
  if (updated.length === board.length) {
    throw createError({ statusCode: 404, statusMessage: "Board item not found" });
  }

  updated.forEach((item, i) => {
    item.order = i;
  });

  await replaceUserBoard(config.public.apiBaseUrl, token, updated);
  return { success: true };
});
