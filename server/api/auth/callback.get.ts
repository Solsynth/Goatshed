import type { SessionData } from "../../../app/types/auth";
import {
  clearOAuthPkceCookie,
  clearOAuthRedirectCookie,
  clearOAuthStateCookie,
  readOAuthPkceCookie,
  readOAuthRedirectCookie,
  readOAuthStateCookie,
  createSession,
} from "../../utils/session";
import { oauthLog, redact } from "../../utils/oauth-log";

interface TokenResponse {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  expiresIn?: number;
  expires_in?: number;
}

interface UserInfo {
  sub?: string;
  id: string;
  name?: string;
  nick?: string | null;
  nickname?: string | null;
  preferred_username?: string;
  email?: string;
}

interface AccountProfile {
  name?: string;
}

async function exchangeCodeForToken(
  event: Parameters<typeof useRuntimeConfig>[0],
  tokenUrl: string,
  payload: URLSearchParams,
  clientId: string,
  clientSecret: string,
): Promise<Response> {
  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");

  const attempts: RequestInit[] = [
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: payload.toString(),
    },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    },
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(payload.entries())),
    },
  ];

  let lastResponse: Response | null = null;
  for (const [index, options] of attempts.entries()) {
    const label =
      index === 0 ? "client_secret_basic" : index === 1 ? "client_secret_post" : "json_fallback";
    oauthLog(event, "token exchange attempt", {
      method: label,
      tokenUrl,
      contentType: (options.headers as Record<string, string>)?.["Content-Type"],
      payload: {
        grant_type: payload.get("grant_type"),
        client_id: payload.get("client_id"),
        redirect_uri: payload.get("redirect_uri"),
        code: redact(payload.get("code")),
        code_verifier: redact(payload.get("code_verifier")),
      },
    });

    const response = await fetch(tokenUrl, options);
    oauthLog(event, "token exchange result", {
      method: label,
      status: response.status,
      ok: response.ok,
    });
    if (response.ok) return response;
    lastResponse = response;
    if (response.status !== 415) return response;
  }

  if (lastResponse) return lastResponse;
  throw createError({ statusCode: 500, statusMessage: "OAuth token exchange failed" });
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);

  const code = typeof query.code === "string" ? query.code : "";
  const state = typeof query.state === "string" ? query.state : "";
  const expectedState = readOAuthStateCookie(event);
  const pkceVerifier = readOAuthPkceCookie(event);

  oauthLog(event, "callback received", {
    code: redact(code),
    state: redact(state),
    expectedState: redact(expectedState),
    hasPkceVerifier: Boolean(pkceVerifier),
    callbackUrl: getRequestURL(event).toString(),
  });

  clearOAuthStateCookie(event);
  clearOAuthPkceCookie(event);

  if (!code || !state || !expectedState || state !== expectedState || !pkceVerifier) {
    oauthLog(event, "callback validation failed", {
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasExpectedState: Boolean(expectedState),
      stateMatch: state === expectedState,
      hasPkceVerifier: Boolean(pkceVerifier),
    });
    throw createError({ statusCode: 400, statusMessage: "Invalid OAuth callback state" });
  }

  const callbackUrl =
    config.public.oauthRedirectUrl || `${getRequestURL(event).origin}/api/auth/callback`;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.public.oauthClientId,
    client_secret: config.oauthClientSecret,
    code,
    redirect_uri: callbackUrl,
    code_verifier: pkceVerifier,
  });

  const tokenResponse = await exchangeCodeForToken(
    event,
    config.public.oauthTokenUrl,
    body,
    config.public.oauthClientId,
    config.oauthClientSecret,
  );

  if (!tokenResponse.ok) {
    const detail = await tokenResponse.text();
    oauthLog(event, "token exchange failed", {
      status: tokenResponse.status,
      detail,
    });
    throw createError({
      statusCode: tokenResponse.status,
      message: detail || "Failed to exchange OAuth code",
    });
  }

  const tokenData = (await tokenResponse.json()) as TokenResponse;
  const accessToken = tokenData.token || tokenData.access_token;
  oauthLog(event, "token exchange success", {
    hasAccessToken: Boolean(accessToken),
    expiresIn: tokenData.expiresIn ?? tokenData.expires_in ?? null,
  });

  if (!accessToken) {
    throw createError({ statusCode: 500, statusMessage: "Missing access token in OAuth response" });
  }

  const userInfoResponse = await fetch(config.public.oauthUserInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!userInfoResponse.ok) {
    const detail = await userInfoResponse.text();
    oauthLog(event, "userinfo failed", {
      status: userInfoResponse.status,
      detail,
    });
    throw createError({ statusCode: userInfoResponse.status, message: detail || "Failed to load profile" });
  }
  const user = (await userInfoResponse.json()) as UserInfo;
  const userId = user.id || user.sub;
  if (!userId) {
    throw createError({ statusCode: 500, statusMessage: "User info response missing user identifier" });
  }
  const userNick = user.nick ?? user.nickname ?? null;
  const displayName = userNick || user.name || user.preferred_username || user.email || userId;

  let accountUsername: string | null = user.preferred_username ?? null;
  try {
    const accountResponse = await fetch(`${config.public.apiBaseUrl}/passport/accounts/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (accountResponse.ok) {
      const account = (await accountResponse.json()) as AccountProfile;
      if (account.name) {
        accountUsername = account.name;
      }
    }
  } catch {
    oauthLog(event, "account profile fetch skipped");
  }

  const expiresIn = tokenData.expiresIn ?? tokenData.expires_in ?? 60 * 60 * 24 * 7;
  const refreshToken = tokenData.refresh_token || "";
  
  const session: SessionData = {
    user: {
      id: userId,
      name: displayName,
      nick: userNick,
      username: accountUsername,
    },
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  await createSession(event, session);

  const redirectPath = readOAuthRedirectCookie(event) || "/me";
  clearOAuthRedirectCookie(event);
  oauthLog(event, "login success", {
    userId: redact(userId),
    redirectPath,
    hasRefreshToken: Boolean(refreshToken),
  });
  return sendRedirect(event, redirectPath);
});
