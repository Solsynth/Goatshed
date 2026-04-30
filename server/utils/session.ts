import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { H3Event } from "h3";
import { getCookie, setCookie, deleteCookie } from "h3";
import type { SessionCookie, SessionData, CachedUserData, AccountProfile } from "../../app/types/auth";

const SESSION_COOKIE = "goatshed_session";
const STATE_COOKIE = "goatshed_oauth_state";
const REDIRECT_COOKIE = "goatshed_oauth_redirect";
const PKCE_COOKIE = "goatshed_oauth_pkce";

const STORAGE_SESSION_PREFIX = "session:";
const STORAGE_USER_PREFIX = "user:";
const USER_CACHE_TTL = 60 * 60 * 1000; // 1 hour

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function getSecret(event: H3Event): string {
  const config = useRuntimeConfig(event);
  return config.authSessionSecret;
}

function generateSessionId(): string {
  return randomBytes(32).toString("base64url");
}

function createSessionCookieToken(event: H3Event, cookie: SessionCookie): string {
  const secret = getSecret(event);
  const payload = toBase64Url(JSON.stringify(cookie));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
}

function parseSessionCookieToken(event: H3Event, token: string): SessionCookie | null {
  const secret = getSecret(event);
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload, secret);
  const expectedBytes = Buffer.from(expected);
  const signatureBytes = Buffer.from(signature);

  if (expectedBytes.length !== signatureBytes.length) return null;
  if (!timingSafeEqual(expectedBytes, signatureBytes)) return null;

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as SessionCookie;
    if (!parsed?.sessionId || parsed.expiresAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function storeSessionData(sessionId: string, data: SessionData): Promise<void> {
  const storage = useStorage("data");
  await storage.setItem(`${STORAGE_SESSION_PREFIX}${sessionId}`, data);
}

async function readSessionData(sessionId: string): Promise<SessionData | null> {
  const storage = useStorage("data");
  const data = await storage.getItem<SessionData>(`${STORAGE_SESSION_PREFIX}${sessionId}`);
  if (!data || data.expiresAt < Date.now()) {
    await storage.removeItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
    return null;
  }
  return data;
}

async function deleteSessionData(sessionId: string): Promise<void> {
  const storage = useStorage("data");
  await storage.removeItem(`${STORAGE_SESSION_PREFIX}${sessionId}`);
}

async function getCachedUser(userId: string): Promise<SessionUser | null> {
  const storage = useStorage("data");
  const cached = await storage.getItem<CachedUserData>(`${STORAGE_USER_PREFIX}${userId}`);
  if (!cached || Date.now() - cached.cachedAt > USER_CACHE_TTL) {
    return null;
  }
  return cached.data;
}

async function setCachedUser(userId: string, data: SessionUser): Promise<void> {
  const storage = useStorage("data");
  await storage.setItem(`${STORAGE_USER_PREFIX}${userId}`, {
    data,
    cachedAt: Date.now(),
  });
}

async function fetchAccountFromApi(event: H3Event, accessToken: string): Promise<AccountProfile | null> {
  const config = useRuntimeConfig(event);
  try {
    const response = await fetch(`${config.public.apiBaseUrl}/passport/accounts/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function createSession(event: H3Event, data: SessionData): Promise<string> {
  const sessionId = generateSessionId();
  await storeSessionData(sessionId, data);

  const cookie: SessionCookie = {
    sessionId,
    expiresAt: data.expiresAt,
  };

  const maxAge = Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000));
  setCookie(event, SESSION_COOKIE, createSessionCookieToken(event, cookie), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return sessionId;
}

export async function readSession(event: H3Event): Promise<SessionData | null> {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token) return null;

  const cookie = parseSessionCookieToken(event, token);
  if (!cookie) return null;

  return await readSessionData(cookie.sessionId);
}

export async function readSessionWithUser(event: H3Event): Promise<SessionData | null> {
  const session = await readSession(event);
  if (!session) return null;

  const cachedUser = await getCachedUser(session.user.id);
  if (cachedUser) {
    return { ...session, user: cachedUser };
  }

  const account = await fetchAccountFromApi(event, session.accessToken);
  if (account) {
    const updatedUser = {
      id: account.id,
      name: account.name,
      nick: account.profile?.nick ?? account.nick,
      username: account.name,
    };
    await setCachedUser(session.user.id, updatedUser);
    return { ...session, user: updatedUser };
  }

  return session;
}

export async function destroySession(event: H3Event): Promise<void> {
  const token = getCookie(event, SESSION_COOKIE);
  if (token) {
    const cookie = parseSessionCookieToken(event, token);
    if (cookie) {
      await deleteSessionData(cookie.sessionId);
    }
  }
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export function clearSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, { path: "/" });
}

export function createOAuthState(): string {
  return randomBytes(18).toString("base64url");
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

export function setOAuthStateCookie(event: H3Event, state: string) {
  setCookie(event, STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export function readOAuthStateCookie(event: H3Event): string | null {
  return getCookie(event, STATE_COOKIE) ?? null;
}

export function clearOAuthStateCookie(event: H3Event) {
  deleteCookie(event, STATE_COOKIE, { path: "/" });
}

export function setOAuthRedirectCookie(event: H3Event, path: string) {
  setCookie(event, REDIRECT_COOKIE, path, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export function readOAuthRedirectCookie(event: H3Event): string | null {
  return getCookie(event, REDIRECT_COOKIE) ?? null;
}

export function clearOAuthRedirectCookie(event: H3Event) {
  deleteCookie(event, REDIRECT_COOKIE, { path: "/" });
}

export function setOAuthPkceCookie(event: H3Event, verifier: string) {
  setCookie(event, PKCE_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export function readOAuthPkceCookie(event: H3Event): string | null {
  return getCookie(event, PKCE_COOKIE) ?? null;
}

export function clearOAuthPkceCookie(event: H3Event) {
  deleteCookie(event, PKCE_COOKIE, { path: "/" });
}
