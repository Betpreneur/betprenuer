import type { Tier } from "./stake";
import { todayLagosISO } from "./time";

/**
 * Typed REST client for Betpreneur backend.
 * Base URL: https://api.betpreneur.ng/api/
 */

export const API_BASE_URL: string =
  ((import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL as string | undefined) ??
  "https://api.betpreneur.ng/api";

export const ENDPOINTS = {
  signup: "/auth/signup/",
  login: "/auth/login/",
  logout: "/auth/logout/",
  verifyEmail: "/auth/verify-email/",
  resendVerification: "/auth/resend-verification/",
  forgotPassword: "/auth/forgot-password/",
  resetPassword: "/auth/reset-password/",
  changePassword: "/auth/change-password/",
  refresh: "/auth/token/refresh/",
  me: "/auth/me/",
  // Picks
  algoPicks: "/algo/picks/",
  algoPick: (id: string) => `/algo/picks/${id}/`,
  algoBackPick: (id: string) => `/algo/picks/${id}/back/`,
  algoUnbackPick: (id: string) => `/algo/picks/${id}/unback/`,
  algoBackedPicks: "/algo/picks/backed/",
  algoTopPick: "/algo/top-pick/",
  algoTodayPicks: "/algo/picks/",
  // Games backed endpoints
  algoGame: (matchId: string) => `/algo/games/${matchId}/`,
  algoBackGame: (matchId: string) => `/algo/games/${matchId}/backed/`,
  algoUnbackGame: (matchId: string) => `/algo/games/${matchId}/backed/`,
  algoBackedGames: (date?: string) => `/algo/games/backed/${date ? `?date=${date}` : ""}`,
  // All games for the matchday
  algoGames: "/algo/games/",
  // Public
  algoPublicRecord: "/algo/public/record/",
  algoPublicSummary: "/algo/public/summary/",
} as const;

export function apiUrl(path: string): string {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isBackendConfigured(): boolean {
  return !!API_BASE_URL;
}

const TOKEN_KEY = "terminal.token";
const REFRESH_KEY = "terminal.refresh";
const USER_KEY = "terminal.user";
const BACKED_KEY = "terminal.backed";

export const session = {
  hasToken(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(access: string, refresh?: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  // Back-compat alias
  setToken(t: string) {
    this.setTokens(t);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// ============== Types =================================================

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  whatsapp: string;
  bankroll: number;
  created_at: string;
  is_email_verified?: boolean;
}

interface BackendUser {
  id: number;
  username: string;
  email: string;
  is_email_verified?: boolean;
  whatsapp_country_code?: string;
  whatsapp_number?: string;
  full_whatsapp?: string;
  date_joined: string;
}

function mapUser(u: BackendUser): User {
  return {
    id: String(u.id),
    name: u.username,
    username: u.username,
    email: u.email,
    whatsapp: u.full_whatsapp ?? `${u.whatsapp_country_code ?? ""}${u.whatsapp_number ?? ""}`,
    bankroll: 0,
    created_at: u.date_joined,
    is_email_verified: u.is_email_verified,
  };
}

function writeUser(u: User) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(u));
}

function readBacked(): Record<string, number> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(BACKED_KEY);
  return raw ? (JSON.parse(raw) as Record<string, number>) : {};
}

function writeBacked(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BACKED_KEY, JSON.stringify(map));
}

export interface AuthResponse {
  success: true;
  token: string;
  refresh_token: string;
  user: User;
}

export interface SignupBody {
  username: string;
  password: string;
  email: string;
  whatsapp?: string;
  bankroll?: number;
}

// ============== HTTP helpers ==========================================

function splitWhatsapp(raw: string): { code: string; number: string } {
  const trimmed = raw.trim().replace(/\s+/g, "");
  const m = trimmed.match(/^(\+\d{1,4})(.*)$/);
  if (m) return { code: m[1].slice(0, 5), number: m[2].replace(/\D/g, "").slice(0, 15) };
  return { code: "+234", number: trimmed.replace(/\D/g, "").slice(0, 15) };
}

function extractError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.error === "string") return obj.error;
  // DRF-style: { field: ["msg"] }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v) && typeof v[0] === "string") return v[0];
    if (typeof v === "string") return v;
  }
  return fallback;
}

async function tryRefresh(): Promise<boolean> {
  const refresh = session.getRefresh();
  if (!refresh) return false;
  try {
    const res = await fetch(apiUrl(ENDPOINTS.refresh), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { access?: string; refresh?: string };
    if (!data.access) return false;
    session.setTokens(data.access, data.refresh ?? refresh);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const token = session.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(apiUrl(path), { ...init, headers });
  if (res.status === 401 && retry && session.getRefresh()) {
    const ok = await tryRefresh();
    if (ok) return request<T>(path, init, false);
  }
  if (!res.ok) {
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      try {
        payload = await res.text();
      } catch {
        /* noop */
      }
    }
    throw new Error(extractError(payload, `Request failed (${res.status})`));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ============== ETag response cache ===================================
// Persists response body + ETag + timestamp per cache key so we can send
// `If-None-Match` and fall back to the last good response on 304 / 503 /
// network failure.

const CACHE_PREFIX = "terminal.cache.";

interface CacheEntry<T> {
  data: T;
  etag: string | null;
  ts: number;
}

/**
 * Clear cached data for a specific key or pattern.
 * Call this after backend updates to force fresh fetches.
 */
function clearCache(keyPattern?: string) {
  if (typeof window === "undefined") return;
  if (!keyPattern) {
    // Clear all cache
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
    console.log("[cache] Cleared all cache entries");
    return;
  }
  // Clear specific key(s) matching pattern
  const fullPattern = CACHE_PREFIX + keyPattern;
  const keys = Object.keys(localStorage).filter(k => k.startsWith(fullPattern));
  keys.forEach(k => localStorage.removeItem(k));
  console.log("[cache] Cleared:", keys);
}

/** Clear game cache for today (call after backend updates) */
export function clearGameCache(matchId?: string) {
  if (matchId) {
    clearCache(`algo:game:${matchId}:${todayLagosISO()}`);
  } else {
    // Clear all game caches
    clearCache("algo:game:");
  }
}

function readCache<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T, etag: string | null) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { data, etag, ts: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* storage full / unavailable — ignore, caching is best-effort */
  }
}

/**
 * GET request with ETag revalidation + offline fallback.
 * - Sends `If-None-Match` when a cached ETag exists.
 * - 304: returns the cached body (no JSON parse).
 * - 200: updates the cache + ETag and returns fresh body.
 * - 503 / network failure / failed fetch: returns the last cached body.
 */
async function requestCached<T>(path: string, cacheKey: string, retry = true): Promise<T> {
  const cached = readCache<T>(cacheKey);
  const token = session.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cached?.etag ? { "If-None-Match": cached.etag } : {}),
  };

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { method: "GET", headers });
  } catch {
    // Network failure / failed to fetch — serve last cached response.
    if (cached) return cached.data;
    throw new Error("Network error and no cached data available");
  }

  if (res.status === 401 && retry && session.getRefresh()) {
    const ok = await tryRefresh();
    if (ok) return requestCached<T>(path, cacheKey, false);
  }

  // Not Modified — reuse cached body, do not read response body.
  if (res.status === 304) {
    if (cached) return cached.data;
    // Cache lost but server says unchanged — refetch without validator.
    return requestCached<T>(path, cacheKey + ".__force", false);
  }

  // Backend unavailable — serve last cached response if present.
  if (res.status === 503) {
    if (cached) return cached.data;
    throw new Error("Service unavailable and no cached data available");
  }

  if (!res.ok) {
    if (cached) return cached.data;
    let payload: unknown = null;
    try {
      payload = await res.json();
    } catch {
      /* noop */
    }
    throw new Error(extractError(payload, `Request failed (${res.status})`));
  }

  if (res.status === 204) return undefined as T;
  const data = (await res.json()) as T;
  const etag = res.headers.get("ETag") ?? res.headers.get("etag");
  writeCache(cacheKey, data, etag);
  return data;
}

// ============== Pick types from new API ================

export interface PublicSummary {
  hit_rate: number;
  roi_flat: number;
  picks_logged: number;
  wins: number;
  losses: number;
  voids: number;
  pending: number;
  window_days: number;
}
export interface TeamStats {
  wins: number;
  games: number;
  streak: number;
  btts_rate: number;
  avg_scored: number;
  over25_rate: number;
  avg_conceded: number;
  clean_sheets: number;
  draws?: number;
  losses?: number;
  form?: string;
  scope?: string;
  last_played?: string;
}

export interface FixtureContext {
  h2h?: {
    o25: number;
    t1w: number;
    t2w: number;
    u25: number;
    u35: number;
    btts: number;
    draws: number;
    games: number;
    avg_goals: number;
  };
  flags?: string[];
  away_standing?: { rank?: number; total?: number; points?: number };
  home_standing?: { rank?: number; total?: number; points?: number };
  away_rest_days?: number;
  home_rest_days?: number;
  league_strength?: number;
}

export interface Pick {
  id: number;
  posted_at?: string;
  match_date: string | null;
  fixture: string;
  home_team: string;
  away_team: string;
  home_logo?: string | null;
  away_logo?: string | null;
  league: string;
  kickoff: string;
  match_id: string;
  tier: Tier;
  market: string;
  pick?: string;
  meaning?: string;
  reasoning?: string;
  model_verdict?: string;
  home_recent_form?: TeamStats | string[];
  away_recent_form?: TeamStats | string[];
  fixture_context?: FixtureContext;
  risk_flags?: string[];
  confidence: number;
  odds: number;
  ev?: number;
  stake?: number | null;
  score?: string;
  result?: string;
  pnl?: number | null;
  status: PickStatusEnum;
  source?: string;
  settled_at?: string | null;
  created_at: string;
  backed_count: number;
  backed_by_me: boolean;
  // Extended/derived fields used by detail + list views
  match: string;
  market_plain: string;
  selection?: string;
  one_line_reason: string;
  kickoff_wat: string;
  user_backed?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form_home?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form_away?: any;
  goals_profile?: string[];
  risk_level?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  insights?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  team_news?: any;
  home_score?: number | null;
  away_score?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  home_standing?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  away_standing?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _teams?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  date?: any;
}
export type PickStatusEnum = "pending" | "win" | "loss" | "void" | "settled";
// Legacy alias removed
// export interface TierEnum extends Tier {}

export interface RecordResponse {
  summary: PublicSummary;
  records?: Pick[];
  picks?: Pick[];
}

export interface FixturePickGroup {
  fixture: string;
  home_team: string;
  away_team: string;
  league: string;
  kickoff: string;
  match_id: string;
  market_count: number;
  markets_70_plus: number;
  markets_65_plus: number;
  corner_profile?: Record<string, unknown>;
  markets: Market[];
  picks: Pick[];
}

// Market from the algo/picks/ endpoint
export interface Market {
  ev: number | null;
  odds: number;
  market: string;
  proven: boolean;
  meaning: string;
  eligible: boolean;
  confidence: number;
  risk_flags: string[];
  odds_source: string;
  raw_confidence: number;
  selected: boolean;
  selected_pick_id: number | null;
  selected_tier: Tier;
}
export interface DailyPicksSummary {
  fixture_count: number;
  market_count: number;
  selected_pick_count: number;
  picks_70_plus: number;
  picks_65_plus: number;
  markets_70_plus: number;
  markets_65_plus: number;
}
export interface TodayPicksResponse {
  date: string;
  published: boolean;
  run_id: number | null;
  posted_at: string | null;
  summary: DailyPicksSummary;
  fixtures: FixturePickGroup[];
}
export interface TopPickResponse {
  date: string;
  published: boolean;
  pick: Pick | null;
}

// Algo Games response - all covered games for a matchday
export interface AlgoGamesResponse {
  date: string;
  published: boolean;
  run_id: number | null;
  posted_at: string | null;
  summary: string | null;
  games: GameInfo[];
}

// Competition info from API
export interface CompetitionInfo {
  name: string;
  logo: string | null;
  country: string | null;
  country_flag: string | null;
}

// Single game info from games list
export interface GameInfo {
  id: string;
  match_id: string;
  league: string;
  kickoff: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  official_pick: Pick | null;
  top_market: TopMarketInfo | null;
  league_logo: string | null;
  competition_logo: string | null;
  competition: string | null;
  country_flag: string | null;
  competition_info: CompetitionInfo | null;
}

// Top market info from games endpoint
export interface TopMarketInfo {
  ev: number | null;
  odds: number;
  market: string;
  proven: boolean;
  meaning: string;
  confidence: number;
  risk_flags: string[];
}

// Market info within game detail
export interface MarketInfo {
  ev: number | null;
  odds: number;
  market: string;
  proven: boolean;
  meaning: string;
  label: string;
}

// Game detail response - full context for one game
export interface GameDetailResponse {
  date: string;
  published: boolean;
  run_id: number;
  posted_at: string;
  game: GameFullContext;
}

// Full game context from details endpoint
export interface GameFullContext {
  id: string;
  league: string;
  kickoff: string;
  match: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  markets: MarketInfo[];
  picks: Pick[];
  insights: string | null;
  home_form: RecentFormStats | null;
  away_form: RecentFormStats | null;
  home_news: string | null;
  away_news: string | null;
  prediction: PredictionContext | null;
  league_logo: string | null;
  competition_logo: string | null;
  competition: string | null;
  country_flag: string | null;
  competition_info: CompetitionInfo | null;
}

// Team form stats
export interface RecentFormStats {
  form: string;
  wins: number;
  draws: number;
  losses: number;
  games: number;
  avg_scored: number;
  avg_conceded: number;
  clean_sheets: number;
  btts_rate: number;
  over25_rate: number;
  streak: number;
}

// Prediction context
export interface PredictionContext {
  home_win: number;
  draw: number;
  away_win: number;
  btts: number;
  over_25: number;
}

// New wrapped pick detail response from /algo/picks/{id}/
export interface PickDetailResponse {
  date: string;
  published: boolean;
  run_id: number;
  posted_at: string;
  pick: Pick;
  fixture: string | null;
  market: string | null;
  selection: string | null;
  model_summary: string | null;
  performance: string | null;
}

// Alias for backwards compatibility (the detailed pick format)
export type PickDetail = Pick;

// ============== API ==================================================

export const api = {
  /** POST /auth/signup/ — returns the created user (no tokens). */
  async signup(body: SignupBody): Promise<{ user: User }> {
    const { code, number } = splitWhatsapp(body.whatsapp ?? "");
    const payload = {
      username: body.username,
      email: body.email,
      password: body.password,
      whatsapp_country_code: code,
      whatsapp_number: number,
    };
    const raw = await request<BackendUser>(ENDPOINTS.signup, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { user: mapUser(raw) };
  },

  /** POST /auth/login/ — returns access+refresh tokens and the user. */
  async login(identifier: string, password: string): Promise<AuthResponse> {
    const raw = await request<{ access: string; refresh: string; user: BackendUser }>(
      ENDPOINTS.login,
      {
        method: "POST",
        body: JSON.stringify({ username: identifier, password }),
      },
    );
    const user = mapUser(raw.user);
    session.setTokens(raw.access, raw.refresh);
    writeUser(user);
    return { success: true, token: raw.access, refresh_token: raw.refresh, user };
  },

  /** POST /auth/logout/ — blacklists the refresh token. */
  async logout(): Promise<{ success: true }> {
    const refresh = session.getRefresh();
    try {
      await request(ENDPOINTS.logout, {
        method: "POST",
        body: JSON.stringify(refresh ? { refresh } : {}),
      });
    } catch {
      /* ignore network errors on logout */
    }
    session.clear();
    return { success: true };
  },

  /** GET /auth/me/ */
  async getMe(): Promise<User> {
    const raw = await request<BackendUser>(ENDPOINTS.me);
    const u = mapUser(raw);
    writeUser(u);
    return u;
  },

  /** PATCH /auth/me/ */
  async updateMe(patch: Partial<User>): Promise<User> {
    const body: Record<string, unknown> = {};
    if (patch.name !== undefined) body.username = patch.name;
    if (patch.whatsapp !== undefined) {
      const { code, number } = splitWhatsapp(patch.whatsapp);
      body.whatsapp_country_code = code;
      body.whatsapp_number = number;
    }
    const raw = await request<BackendUser>(ENDPOINTS.me, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    const u = mapUser(raw);
    writeUser(u);
    return u;
  },

  /** POST /api/auth/verify-email/ — body: { email, code } */
  async verifyEmail(email: string, code: string): Promise<{ success: true }> {
    await request(ENDPOINTS.verifyEmail, {
      method: "POST",
      body: JSON.stringify({ email, code }),
    });
    return { success: true };
  },

  /** POST /auth/resend-verification/ — body: { email } */
  async resendVerification(email: string): Promise<{ success: true }> {
    await request(ENDPOINTS.resendVerification, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { success: true };
  },

  /** POST /auth/forgot-password/ — body: { email } */
  async forgotPassword(email: string): Promise<{ success: true }> {
    await request(ENDPOINTS.forgotPassword, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { success: true };
  },

  /** POST /auth/reset-password/ — body: { token, user_id, new_password, confirm_password } */
  async resetPassword(
    token: string,
    password: string,
    user_id?: string,
  ): Promise<{ success: true }> {
    await request(ENDPOINTS.resetPassword, {
      method: "POST",
      body: JSON.stringify({
        token,
        user_id: user_id ?? "",
        new_password: password,
        confirm_password: password,
      }),
    });
    return { success: true };
  },

  /** POST /auth/change-password/ */
  async changePassword(old_password: string, new_password: string): Promise<{ success: true }> {
    await request(ENDPOINTS.changePassword, {
      method: "POST",
      body: JSON.stringify({
        old_password,
        new_password,
        confirm_password: new_password,
      }),
    });
    return { success: true };
  },

  // ============== Picks API (real endpoints) ====

  /** GET /algo/public/record/ — Public audited pick record */
  async getRecord(days = 90): Promise<RecordResponse> {
    const url = days !== 90 ? `${ENDPOINTS.algoPublicRecord}?days=${days}` : ENDPOINTS.algoPublicRecord;
    return requestCached<RecordResponse>(url, `algo:public-record:${days}`);
  },

  /** GET /algo/public/summary/ — Public summary for landing page */
  async getPublicSummary(): Promise<PublicSummary> {
    return requestCached<PublicSummary>(ENDPOINTS.algoPublicSummary, "algo:public-summary");
  },

  /** GET /algo/picks/ — Daily picks (optional date) */
  async getTodayPicks(date?: string): Promise<TodayPicksResponse> {
    const url = date ? `${ENDPOINTS.algoPicks}?date=${date}` : ENDPOINTS.algoPicks;
    return requestCached<TodayPicksResponse>(url, `algo:picks:${date ?? "today"}`);
  },

  /** GET /algo/games/ — All covered games for a matchday (new Home page) */
  async getAlgoGames(date?: string, bypassCache = false): Promise<AlgoGamesResponse> {
    const cacheKey = `algo:games:${date ?? "today"}`;
    if (bypassCache) {
      clearCache(cacheKey);
    }
    const url = date ? `${ENDPOINTS.algoGames}?date=${date}` : ENDPOINTS.algoGames;
    return requestCached<AlgoGamesResponse>(url, cacheKey);
  },

  /** GET /algo/games/:matchId/ — Full game detail context */
  async getGameDetail(matchId: string, bypassCache = false): Promise<GameDetailResponse> {
    const cacheKey = `algo:game:${matchId}:${todayLagosISO()}`;
    // Clear cache first if bypass requested
    if (bypassCache) {
      clearCache(cacheKey);
    }
    return requestCached<GameDetailResponse>(
      ENDPOINTS.algoGame(matchId),
      cacheKey,
    );
  },

  /** GET /algo/top-pick/ — Top pick of the day */
  async getTopPick(date?: string, bypassCache = false): Promise<TopPickResponse> {
    const cacheKey = `algo:top-pick:${date ?? "today"}`;
    if (bypassCache) {
      clearCache(cacheKey);
    }
    const url = date ? `${ENDPOINTS.algoTopPick}?date=${date}` : ENDPOINTS.algoTopPick;
    return requestCached<TopPickResponse>(url, cacheKey);
  },

  /** GET /algo/picks/:id/ — Get a specific pick */
  async getPick(id: number): Promise<Pick> {
    return request<Pick>(ENDPOINTS.algoPick(String(id)));
  },

  /** GET /algo/picks/:id/ — Get a specific pick with full details */
  async getPickDetail(id: number): Promise<PickDetailResponse> {
    return request<PickDetailResponse>(ENDPOINTS.algoPick(String(id)));
  },

  /** POST /api/algo/games/<match_id>/backed/ — Mark that user backed this game */
  async markBacked(matchId: number | string, date?: string): Promise<{ success: true }> {
    await request(ENDPOINTS.algoBackGame(String(matchId)), {
      method: "POST",
      body: JSON.stringify({ date: date ?? null }),
    });
    return { success: true };
  },

  /** DELETE /api/algo/games/<match_id>/backed/ — Remove backed game */
  async unmarkBacked(matchId: number | string): Promise<{ success: true }> {
    await request(ENDPOINTS.algoUnbackGame(String(matchId)), { method: "DELETE" });
    return { success: true };
  },

  /** GET /api/algo/games/backed/?date= — Get all user-backed games */
  async getBackedPicks(date?: string): Promise<Pick[]> {
    return request<Pick[]>(ENDPOINTS.algoBackedGames(date));
  },

  getMyPicks(): Promise<{ picks: Pick[]; stats: { total: number; wins: number; losses: number; pending: number } }> {
    return fetch(ENDPOINTS.algoBackedGames()).then(r => r.json()).then((res: any) => {
      const picks = Array.isArray(res) ? res : (res.results || res.data || res.picks || []);
      return {
        picks,
        stats: {
          total: picks.length,
          wins: picks.filter((p: any) => p.status === "win").length,
          losses: picks.filter((p: any) => p.status === "loss").length,
          pending: picks.filter((p: any) => p.status === "pending").length,
        }
      };
    });
  },
};

