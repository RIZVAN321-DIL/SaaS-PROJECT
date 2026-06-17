// frontend/src/lib/auth.ts
'use client';

const ACCESS_TOKEN_KEY = 'crm_access_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';
const USER_KEY = 'crm_user';
const ACCESS_TOKEN_COOKIE = 'access_token';

export interface AuthUser {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export function parseJwt(token: string) {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getMaxAgeFromToken(token: string): number {
  const payload = parseJwt(token);
  if (payload?.exp) {
    const maxAge = payload.exp - Math.floor(Date.now() / 1000);
    return maxAge > 0 ? maxAge : 0;
  }
  return 60 * 60 * 24; // фоллбэк: 1 день, если в токене нет exp
}

function setAuthCookie(token: string) {
  if (typeof document === 'undefined') return;

  const maxAge = getMaxAgeFromToken(token);
  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax${
    isSecure ? '; Secure' : ''
  }`;
}

function clearAuthCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(data: {
  access_token: string;
  refresh_token: string;
}) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);

  // Кука нужна, чтобы middleware (выполняется на сервере/edge,
  // не имеет доступа к localStorage) мог проверить авторизацию.
  setAuthCookie(data.access_token);
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearAuthCookie();
}

export function setUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!getAccessToken();
}

export function saveLogin(tokens: {
  access_token: string;
  refresh_token: string;
}) {
  setTokens(tokens);

  const payload = parseJwt(tokens.access_token);
  if (!payload) return;

  setUser({
    userId: payload.sub,
    email: payload.email,
    organizationId: payload.organizationId,
    role: payload.role,
  });
}
