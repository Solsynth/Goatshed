import { requireAdmin } from "~~/server/utils/admin";
import {
  fetchUserBoard,
  getAppBoardSecret,
  getTargetSolarAccountId,
  getTargetUserBoardAccess,
  privateBoardPayloadUrl,
  replaceUserBoard,
  type BoardItem,
} from "~~/server/utils/boardAdmin";

/**
 * Push widget payload.
 *
 * - custom_app (Goatshed app): Develop private API with app secret
 *   POST /develop/private/apps/{app_id}/board/payload
 * - prebuilt: user self-board PUT (client-owned payload)
 *
 * Private API cannot update other apps' widgets or prebuilt items.
 * See docs/CUSTOM_APP_BOARD_PRIVATE_API.md and docs/ACCOUNT_BOARD.md.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const id = getRouterParam(event, "id");
  const itemId = getRouterParam(event, "itemId");
  if (!id || !itemId) {
    throw createError({ statusCode: 400, statusMessage: "Missing user ID or item ID" });
  }

  const body = await readBody(event);
  if (!body || typeof body.payload !== "object" || body.payload === null) {
    throw createError({ statusCode: 400, statusMessage: "Body must include a payload object" });
  }

  const token = await getTargetUserBoardAccess(id);
  const config = useRuntimeConfig(event);
  const board = await fetchUserBoard(config.public.apiBaseUrl, token);
  const item = board.find((x) => x.id === itemId);
  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Board item not found" });
  }

  const payload = body.payload as Record<string, unknown>;

  // Prebuilt widgets: user client owns payload → self-board replace
  if (item.kind === "prebuilt" || !item.kind) {
    const updated: BoardItem[] = board.map((x) =>
      x.id === itemId ? { ...x, payload } : x,
    );
    const result = await replaceUserBoard(config.public.apiBaseUrl, token, updated);
    return result.find((x) => x.id === itemId) ?? { success: true };
  }

  // Custom-app widgets: only the owning app secret may set payload
  if (item.kind !== "custom_app") {
    throw createError({
      statusCode: 400,
      statusMessage: `Unsupported board item kind: ${item.kind}`,
    });
  }

  const widgetKey =
    body.widget_key
    || item.custom_app_widget_key
    || item.widget_key;
  if (!widgetKey) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing widget_key for custom-app board item",
    });
  }

  const solarAccountId = await getTargetSolarAccountId(id);
  const { appId, secret } = getAppBoardSecret();
  const url = privateBoardPayloadUrl(config.public.apiBaseUrl, appId);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
      "x-app-secret": secret,
    },
    body: JSON.stringify({
      account_id: solarAccountId,
      widget_key: widgetKey,
      board_item_id: itemId,
      payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[payload.post] Private board API error:", {
      url,
      status: response.status,
      body: text,
    });
    throw createError({
      statusCode: response.status,
      message: text || `Develop private board payload API returned ${response.status}`,
    });
  }

  if (response.status === 204) return { success: true };
  return await response.json();
});
