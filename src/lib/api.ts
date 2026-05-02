import type { Tier } from "./stake";

/**
 * Typed REST client for Project Betpreneur.
 *
 * Currently returns mock data so the frontend can be developed without a backend.
 * To plug in the real REST API, replace the body of each function with a `fetch()`
 * call to BASE_URL + the endpoint shown in the JSDoc above the function.
 * Nothing else in the app needs to change.
 */

// ============== Types =================================================

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  whatsapp: string;
  bankroll: number;
  created_at: string;
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

// ============== Mock store ============================================

const TOKEN_KEY = "terminal.token";
const USER_KEY = "terminal.user";
const BACKED_KEY = "terminal.backed";

function readUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
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

export const session = {
  hasToken(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },
  setToken(t: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, t);
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms));
}

// ============== Mock fixtures =========================================

const today = new Date();
today.setHours(19, 45, 0, 0);
const isoToday = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

const MOCK_PICKS: PickDetail[] = [
  {
    id: "p1",
    match: "Arsenal vs Chelsea",
    league: "Premier League",
    kickoff_wat: isoToday(19, 45),
    market: "BTTS_YES",
    market_plain: "Both teams to score",
    confidence: 79.3,
    tier: "banker",
    form_home: ["W", "W", "D", "W", "L", "W"],
    form_away: ["D", "W", "L", "L", "W", "D"],
    goals_profile: [
      "Arsenal scored in 7 of their last 8 home games.",
      "Chelsea conceded in 5 of their last 6 away games.",
      "Both teams scored in 4 of their last 5 meetings.",
    ],
    risk_flag: "Arsenal may rotate midweek — watch team news before kick-off.",
    model_verdict:
      "Arsenal's home attacking output combined with Chelsea's leaky away defence makes BTTS a strong, repeatable edge here. The model rates it well above the bookmaker price.",
    odds: 1.85,
    status: "live",
    result: null,
    user_backed: false,
    one_line_reason: "Arsenal score at home, Chelsea concede on the road.",
  },
  {
    id: "p2",
    match: "Man City vs Brighton",
    league: "Premier League",
    kickoff_wat: isoToday(17, 30),
    market: "OVER_2_5",
    market_plain: "Over 2.5 goals",
    confidence: 74.1,
    tier: "banker",
    form_home: ["W", "W", "W", "W", "D", "W"],
    form_away: ["L", "W", "D", "W", "L", "L"],
    goals_profile: [
      "City have scored 2+ in 9 of their last 10 home games.",
      "Brighton concede first in 60% of away fixtures.",
      "Over 2.5 has landed in 7 of City's last 8 home matches.",
    ],
    risk_flag: null,
    model_verdict:
      "City at home is a goals machine and Brighton tend to chase games. The total has comfortably cleared 2.5 in nearly every recent meeting.",
    odds: 1.55,
    status: "live",
    result: null,
    user_backed: false,
    one_line_reason: "City at home rarely fail to clear two and a half.",
  },
  {
    id: "p3",
    match: "Real Sociedad vs Valencia",
    league: "La Liga",
    kickoff_wat: isoToday(20, 0),
    market: "HOME_WIN",
    market_plain: "Real Sociedad to win",
    confidence: 70.2,
    tier: "gem",
    form_home: ["W", "D", "W", "W", "L", "D"],
    form_away: ["L", "L", "D", "W", "L", "L"],
    goals_profile: [
      "Sociedad unbeaten at home in 6.",
      "Valencia have lost 4 of their last 5 on the road.",
    ],
    risk_flag: null,
    model_verdict:
      "Solid home form against a struggling Valencia side travelling without their first-choice keeper. The price represents value.",
    odds: 1.95,
    status: "live",
    result: null,
    user_backed: false,
    one_line_reason: "Strong home side against a struggling traveller.",
  },
  {
    id: "p4",
    match: "Lazio vs Atalanta",
    league: "Serie A",
    kickoff_wat: isoToday(21, 45),
    market: "BTTS_YES",
    market_plain: "Both teams to score",
    confidence: 69.4,
    tier: "gem",
    form_home: ["D", "W", "L", "W", "D", "W"],
    form_away: ["W", "W", "D", "W", "L", "W"],
    goals_profile: [
      "Atalanta have scored in 11 of their last 12.",
      "BTTS in 5 of last 6 between these clubs.",
    ],
    risk_flag: "Lazio missing their first-choice centre-back.",
    model_verdict:
      "Two attacking sides with reliable scoring records and historical BTTS pattern between them.",
    odds: 1.75,
    status: "live",
    result: null,
    user_backed: false,
    one_line_reason: "Two attack-first sides with a clear BTTS history.",
  },
  {
    id: "p5",
    match: "Wolves vs Brentford",
    league: "Premier League",
    kickoff_wat: isoToday(15, 0),
    market: "DRAW",
    market_plain: "Match to end in a draw",
    confidence: 64.8,
    tier: "wildcard",
    form_home: ["D", "L", "D", "W", "D", "L"],
    form_away: ["D", "D", "L", "W", "D", "D"],
    goals_profile: [
      "Wolves have drawn 4 of last 7.",
      "Brentford have drawn 5 of last 8.",
    ],
    risk_flag: null,
    model_verdict:
      "Two evenly matched sides with high recent draw frequency. The price on the draw is generous.",
    odds: 3.4,
    status: "live",
    result: null,
    user_backed: false,
    one_line_reason: "Both sides drawing often at a generous price.",
  },
];

const MOCK_RECORD: RecordResponse = {
  stats: { hit_rate: 66.3, roi: 18.4, total_picks: 358 },
  by_market: [
    { market: "Both teams to score", picks: 79, hit_rate: 72.1, status: "active" },
    { market: "Over 2.5 goals", picks: 86, hit_rate: 68.9, status: "active" },
    { market: "Match result (1X2)", picks: 102, hit_rate: 64.2, status: "active" },
    { market: "Asian handicap", picks: 41, hit_rate: 70.7, status: "active" },
    {
      market: "Both teams to score & win",
      picks: 28,
      hit_rate: 53.1,
      status: "paused",
      note: "Paused after audit — threshold raised.",
    },
    { market: "Correct score", picks: 22, hit_rate: 58.0, status: "active" },
  ],
  history: Array.from({ length: 47 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const matches = [
      "Arsenal vs Chelsea",
      "Man City vs Brighton",
      "Real Madrid vs Sevilla",
      "Bayern vs Dortmund",
      "PSG vs Lyon",
      "Inter vs Roma",
      "Liverpool vs Newcastle",
      "Atletico vs Villarreal",
    ];
    const markets = [
      "Both teams to score",
      "Over 2.5 goals",
      "Home win",
      "Asian handicap −1",
      "Draw no bet",
    ];
    const tiers: Tier[] = ["banker", "gem", "wildcard"];
    const results: ("won" | "lost" | "void")[] = [
      "won",
      "won",
      "won",
      "lost",
      "won",
      "void",
    ];
    return {
      date: d.toISOString(),
      match: matches[i % matches.length],
      market: markets[i % markets.length],
      tier: tiers[i % tiers.length],
      odds: 1.5 + ((i % 7) * 0.15),
      result: results[i % results.length],
      posted_at: d.toISOString(),
    };
  }),
};

function summary(p: PickDetail): PickSummary {
  return {
    id: p.id,
    fixture_id: p.id,
    match: p.match,
    league: p.league,
    market: p.market,
    market_plain: p.market_plain,
    kickoff_wat: p.kickoff_wat,
    confidence: p.confidence,
    tier: p.tier,
    one_line_reason: p.one_line_reason,
    is_top_pick: p.id === "p1",
  };
}

// ============== API ==================================================

export const api = {
  /** POST /auth/signup */
  async signup(body: SignupBody): Promise<AuthResponse> {
    const user: User = {
      id: "u_" + Date.now(),
      name: body.name,
      username: body.username,
      email: body.email,
      whatsapp: body.whatsapp,
      bankroll: body.bankroll ?? 50000,
      created_at: new Date().toISOString(),
    };
    session.setToken("mock-jwt-" + user.id);
    writeUser(user);
    return delay({
      success: true,
      token: "mock-jwt-" + user.id,
      refresh_token: "mock-refresh-" + user.id,
      user,
    });
  },

  /** POST /auth/login */
  async login(identifier: string, _password: string): Promise<AuthResponse> {
    const existing = readUser();
    const user: User =
      existing ?? {
        id: "u_demo",
        name: "Demo Subscriber",
        username: identifier.includes("@") ? "demo" : identifier,
        email: identifier.includes("@") ? identifier : "demo@betpreneur.app",
        whatsapp: "+2348012345678",
        bankroll: 50000,
        created_at: new Date().toISOString(),
      };
    session.setToken("mock-jwt-" + user.id);
    writeUser(user);
    return delay({
      success: true,
      token: "mock-jwt-" + user.id,
      refresh_token: "mock-refresh",
      user,
    });
  },

  /** POST /auth/logout */
  async logout(): Promise<{ success: true }> {
    session.clear();
    return delay({ success: true }, 100);
  },

  /** GET /user/me */
  async getMe(): Promise<User> {
    const u = readUser();
    if (!u) throw new Error("unauthenticated");
    return delay(u);
  },

  /** PATCH /user/me */
  async updateMe(patch: Partial<Pick<User, "name" | "whatsapp" | "bankroll">>): Promise<User> {
    const u = readUser();
    if (!u) throw new Error("unauthenticated");
    const next = { ...u, ...patch };
    writeUser(next);
    return delay(next);
  },

  /** GET /record */
  async getRecord(): Promise<RecordResponse> {
    return delay(MOCK_RECORD, 500);
  },

  /** GET /picks/today */
  async getTodayPicks(): Promise<TodayPicksResponse> {
    return delay({
      date: new Date().toISOString().slice(0, 10),
      status: "live",
      picks: MOCK_PICKS.map(summary),
    });
  },

  /** GET /picks/today/top */
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

  /** GET /picks/:id */
  async getPick(id: string): Promise<PickDetail> {
    const p = MOCK_PICKS.find((x) => x.id === id);
    if (!p) throw new Error("not_found");
    const backed = readBacked();
    return delay({ ...p, user_backed: !!backed[id] });
  },

  /** POST /picks/:id/backed */
  async markBacked(id: string, staked_amount: number): Promise<{ success: true }> {
    const map = readBacked();
    map[id] = staked_amount;
    writeBacked(map);
    return delay({ success: true }, 200);
  },
};