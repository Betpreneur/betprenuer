import type { Tier } from "./stake";

/**
 * Typed REST client for Betpreneur backend.
 * Base URL: https://backend.betpreneur.ng/api
 */

export const API_BASE_URL: string =
  ((import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL as string | undefined) ??
  "https://backend.betpreneur.ng/api";

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
  record: "/record/",
  todayPicks: "/picks/today/",
  topPick: "/picks/today/top/",
  pick: (id: string) => `/picks/${id}/`,
  markBacked: (id: string) => `/picks/${id}/backed/`,
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
  name: string;
  username: string;
  password: string;
  email: string;
  whatsapp: string;
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

// ============== Pick types (kept from previous design) ================

export interface RecordStats {
  hit_rate: number;
  roi: number;
  total_picks: number;
}
export interface MarketRow {
  market: string;
  picks: number;
  hit_rate: number;
  status: "active" | "paused";
  note?: string;
}
export interface HistoryRow {
  date: string;
  match: string;
  market: string;
  tier: Tier;
  odds: number;
  result: "won" | "lost" | "void";
  posted_at: string;
}
export interface RecordResponse {
  stats: RecordStats;
  by_market: MarketRow[];
  history: HistoryRow[];
}
export interface PickSummary {
  id: string;
  fixture_id: string;
  match: string;
  league: string;
  market: string;
  market_plain: string;
  kickoff_wat: string;
  confidence: number;
  tier: Tier;
  one_line_reason: string;
  is_top_pick: boolean;
}
export interface TodayPicksResponse {
  date: string;
  status: "live" | "pending" | "no_picks";
  picks: PickSummary[];
}
export interface PickDetail {
  id: string;
  match: string;
  league: string;
  kickoff_wat: string;
  market: string;
  market_plain: string;
  confidence: number;
  tier: Tier;
  form_home: ("W" | "D" | "L")[];
  form_away: ("W" | "D" | "L")[];
  goals_profile: string[];
  risk_flag: string | null;
  model_verdict: string;
  odds: number;
  status: "pending" | "live" | "settled";
  result: "won" | "lost" | "void" | null;
  user_backed: boolean;
  one_line_reason: string;
}
export type TopPickResponse =
  | {
      locked: true;
      match: string;
      market_plain: string;
      confidence: number;
      kickoff_wat: string;
    }
  | (PickDetail & { locked: false });

// ============== Mock picks (still used; backend pick endpoints TBD) ===

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}
const isoToday = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const MOCK_PICKS: PickDetail[] = [
  {
    id: "p1", match: "Arsenal vs Chelsea", league: "Premier League",
    kickoff_wat: isoToday(19, 45), market: "BTTS_YES",
    market_plain: "Both teams to score", confidence: 79.3, tier: "banker",
    form_home: ["W","W","D","W","L","W"], form_away: ["D","W","L","L","W","D"],
    goals_profile: ["Arsenal scored in 7 of their last 8 home games."],
    risk_flag: null,
    model_verdict: "Strong attacking edge for both sides.",
    odds: 1.85, status: "live", result: null, user_backed: false,
    one_line_reason: "Arsenal score at home, Chelsea concede on the road.",
  },
];
const MOCK_RECORD: RecordResponse = {
  stats: { hit_rate: 66.3, roi: 18.4, total_picks: 358 },
  by_market: [], history: [],
};
function summary(p: PickDetail): PickSummary {
  return {
    id: p.id, fixture_id: p.id, match: p.match, league: p.league,
    market: p.market, market_plain: p.market_plain, kickoff_wat: p.kickoff_wat,
    confidence: p.confidence, tier: p.tier, one_line_reason: p.one_line_reason,
    is_top_pick: p.id === "p1",
  };
}

// ============== API ==================================================

export const api = {
  /** POST /auth/signup/ — returns the created user (no tokens). */
  async signup(body: SignupBody): Promise<{ user: User }> {
    const { code, number } = splitWhatsapp(body.whatsapp);
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
  async updateMe(patch: Partial<Pick<User, "name" | "whatsapp" | "bankroll">>): Promise<User> {
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

  /** POST /auth/verify-email/ — body: { email, code } */
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

  // ============== Picks (mock fallback until backend exposes them) ====

  async getRecord(): Promise<RecordResponse> {
    return delay(MOCK_RECORD, 200);
  },
  async getTodayPicks(): Promise<TodayPicksResponse> {
    return delay({
      date: new Date().toISOString().slice(0, 10),
      status: "live",
      picks: MOCK_PICKS.map(summary),
    });
  },
  async getTopPick(): Promise<TopPickResponse> {
    const top = MOCK_PICKS[0];
    if (!session.hasToken()) {
      return delay({
        locked: true,
        match: top.match,
        market_plain: top.market_plain,
        confidence: top.confidence,
        kickoff_wat: top.kickoff_wat,
      });
    }
    const backed = readBacked();
    return delay({ ...top, user_backed: !!backed[top.id], locked: false });
  },
  async getPick(id: string): Promise<PickDetail> {
    const p = MOCK_PICKS.find((x) => x.id === id);
    if (!p) throw new Error("not_found");
    const backed = readBacked();
    return delay({ ...p, user_backed: !!backed[id] });
  },
  async markBacked(id: string, staked_amount: number): Promise<{ success: true }> {
    const map = readBacked();
    map[id] = staked_amount;
    writeBacked(map);
    return delay({ success: true }, 150);
  },
};
