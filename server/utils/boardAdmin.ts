import type { H3Event } from "h3";
import { getUserSolarToken, getSolarAccountId } from "./solarAccount";

export interface BoardItem {
  id: string;
  order: number;
  kind: string;
  widget_key?: string | null;
  custom_app_id?: string | null;
  custom_app_widget_key?: string | null;
  is_enabled?: boolean;
  payload?: Record<string, unknown> | null;
}

/** Target user's Solian token for Passport self-board APIs. */
export async function getTargetUserBoardAccess(targetUserId: string) {
  const token = await getUserSolarToken(targetUserId);
  if (!token) {
    throw createError({
      statusCode: 404,
      statusMessage: "No linked Solian account or token expired",
    });
  }
  return token;
}

export function selfBoardUrl(apiBaseUrl: string): string {
  return `${apiBaseUrl}/passport/accounts/me/board`;
}

/** Goatshed app secret for Develop private board payload API. */
export function getAppBoardSecret(): { appId: string; secret: string } {
  const appId = process.env.DONATION_API_KEY_CLIENT_ID;
  const secret = process.env.DONATION_API_KEY_SECRET;
  if (!appId || !secret) {
    throw createError({
      statusCode: 500,
      statusMessage: "DONATION_API_KEY_CLIENT_ID/SECRET not configured",
    });
  }
  return { appId, secret };
}

export function privateBoardPayloadUrl(apiBaseUrl: string, appId: string): string {
  return `${apiBaseUrl}/develop/private/apps/${encodeURIComponent(appId)}/board/payload`;
}

export async function fetchUserBoard(
  apiBaseUrl: string,
  userToken: string,
): Promise<BoardItem[]> {
  const url = selfBoardUrl(apiBaseUrl);
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${userToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || "Failed to fetch board",
    });
  }
  return (await response.json()) as BoardItem[];
}

export async function replaceUserBoard(
  apiBaseUrl: string,
  userToken: string,
  board: BoardItem[],
): Promise<BoardItem[]> {
  const url = selfBoardUrl(apiBaseUrl);
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify(board),
  });
  if (!response.ok) {
    const text = await response.text();
    throw createError({
      statusCode: response.status,
      message: text || "Failed to update board",
    });
  }
  return (await response.json()) as BoardItem[];
}

export async function getTargetSolarAccountId(targetUserId: string): Promise<string> {
  const solarAccountId = await getSolarAccountId(targetUserId);
  if (!solarAccountId) {
    throw createError({
      statusCode: 404,
      statusMessage: "Target user has no linked Solian account",
    });
  }
  return solarAccountId;
}

/** Unused but kept for callers that pass event through requireAdmin first. */
export function assertSession(event: H3Event) {
  const session = event.context.session as { user?: { id?: string } } | undefined;
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return session.user.id;
}
