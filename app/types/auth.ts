export interface SessionUser {
  id: string;
  name: string;
  nick: string | null;
  username: string | null;
}

export interface SessionCookie {
  sessionId: string;
  expiresAt: number;
}

export interface SessionData {
  user: SessionUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface CachedUserData {
  data: SessionUser;
  cachedAt: number;
}

export interface AccountProfile {
  id: string;
  name: string;
  nick: string | null;
  profile?: {
    picture?: { id: string; url?: string } | null;
    background?: { id: string; url?: string } | null;
    bio?: string | null;
    location?: string | null;
    timeZone?: string | null;
    email?: string | null;
    verification?: { title: string | null } | null;
  } | null;
  language?: string;
  region?: string;
}
