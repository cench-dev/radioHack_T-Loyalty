const API_URL = 'https://radiohack-t-loyalty-3.onrender.com';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

export type Segment = 'LOW' | 'MEDIUM' | 'HIGH';

export interface UserBrief {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  financial_segment: Segment;
}

export interface ProgramSummary {
  program_id: number;
  program_name: string;
  currency: string;
  current_balance: number;
  total_earned_all_time: number;
  total_earned_last_30d: number;
}

export interface LoyaltySummary {
  user_id: number;
  full_name: string;
  financial_segment: Segment;
  total_cashback_rub_equivalent: number;
  total_rub: number;
  total_miles: number;
  total_bravo_points: number;
  programs: ProgramSummary[];
  streak_days: number;
  level: number;
  level_name: string;
  level_progress: number;
  next_level_threshold_rub: number;
}

export interface TransactionItem {
  transaction_id: number;
  account_id: number;
  program_id: number;
  program_name: string;
  cashback_amount: number;
  currency: string;
  payout_date: string;
}

export interface MonthlyPoint {
  month: string;
  rub_equivalent: number;
}

export interface ForecastResponse {
  next_month_rub: number;
  next_year_rub: number;
  method: string;
  confidence: 'low' | 'medium' | 'high';
  monthly_history: MonthlyPoint[];
}

export interface OfferItem {
  id: number;
  partner_name: string;
  short_description: string;
  logo_url: string;
  brand_color_hex: string;
  cashback_percent: number;
  financial_segment: Segment;
}

export interface CrossSellItem {
  product: 'investments' | 'business' | 'mobile' | 'premium' | 'savings';
  title: string;
  description: string;
  cta: string;
  external_url: string;
  estimated_benefit_rub?: number;
}

export interface Insight {
  icon: string;
  title: string;
  body: string;
}

export interface InsightsResponse {
  user_id: number;
  insights: Insight[];
  generated_by: 'gigachat' | 'fallback';
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
}

export interface Quest {
  code: string;
  title: string;
  meta: string;
  icon: string;
  reward_text: string;
  progress: number;
  featured: boolean;
  done: boolean;
}

export interface GamificationResponse {
  streak_days: number;
  level: number;
  level_name: string;
  level_progress: number;
  next_level_threshold_rub: number;
  total_cashback_rub: number;
  achievements: Achievement[];
  quests: Quest[];
}

// эндпоинты
export const api = {
  listUsers: () => request<UserBrief[]>('/users'),
  login: (identifier: string) =>
    request<{ user: UserBrief }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),
  getUser: (id: number) => request<UserBrief>(`/users/${id}`),

  getSummary: (userId: number) => request<LoyaltySummary>(`/loyalty/${userId}/summary`),
  getHistory: (userId: number, programId?: number, limit = 100) => {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (programId) params.set('program_id', String(programId));
    return request<TransactionItem[]>(`/loyalty/${userId}/history?${params}`);
  },
  getForecast: (userId: number) => request<ForecastResponse>(`/loyalty/${userId}/forecast`),
  getInsights: (userId: number) => request<InsightsResponse>(`/loyalty/${userId}/insights`),

  listOffers: () => request<OfferItem[]>('/offers'),
  getOffersForUser: (userId: number) => request<OfferItem[]>(`/offers/for-user/${userId}`),
  getCrossSell: (userId: number) => request<CrossSellItem[]>(`/offers/cross-sell/${userId}`),

  getGamification: (userId: number) => request<GamificationResponse>(`/gamification/${userId}`),
};
