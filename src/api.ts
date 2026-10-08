const API_URL = 'https://indri-backend.onrender.com';

/**
 * Retrieves the raw initData string.
 * 1. Tries window.Telegram.WebApp.initData (works on mobile).
 * 2. Falls back to parsing window.location.hash for 'tgWebAppData' (works on Telegram Desktop/Web).
 */
function getInitData(): string {
  // 1. Try the native Telegram object
  // @ts-ignore
  if (window.Telegram?.WebApp?.initData) {
    // @ts-ignore
    return window.Telegram.WebApp.initData;
  }

  // 2. Fallback: parse from URL hash (tgWebAppData)
  const hash = window.location.hash.slice(1);
  if (hash) {
    const params = new URLSearchParams(hash);
    const tgData = params.get('tgWebAppData');
    if (tgData) {
      return decodeURIComponent(tgData);
    }
  }

  return '';
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: unknown
): Promise<T> {
  const initData = getInitData();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (initData) headers['x-telegram-init-data'] = initData;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export interface UserData {
  telegramId: string;
  username: string;
  firstName: string;
  silentDays: number;
  balance: number;
  secretEcho: string;
  entryNumber: number;
  lastStayAt: number;
  wallMarks: number[];
  hasMarkedToday: boolean;
  wasInvited: boolean;
  invitedBy?: string;
  hasVowed: boolean;
  hasInvitedToday: boolean;
  signalsReceived: number;
  signalsSent: number;
  walletAddress: string;
}

export interface LeaderboardEntry {
  secretEcho: string;
  silentDays: number;
}

export interface LedgerData {
  totalDistributed: number;
  totalMembers: number;
  awaitingClaim: number;
}

export interface DisappearedEntry {
  echo: string;
  days: number;
  reason: string;
}

export interface WallTrace {
  telegramId: string;
  date: string;
}

export interface AdminWitness {
  id: string;
  reporterId: string;
  link: string;
  violatorEcho: string;
  note: string;
  status: string;
}

export const api = {
  validateInvite: (code: string) =>
    apiCall<{ valid: boolean }>('/api/validate-invite', 'POST', { code }),
  redeemInvite: (code: string) =>
    apiCall<{ success: boolean; invitedBy: string }>('/api/redeem-invite', 'POST', { code }),
  auth: () => apiCall<UserData>('/api/auth', 'POST'),
  vow: () => apiCall<{ success: boolean }>('/api/vow', 'POST'),
  stay: () => apiCall<UserData>('/api/stay', 'POST'),
  getWall: () => apiCall<WallTrace[]>('/api/wall'),
  addTrace: () => apiCall<{ success: boolean }>('/api/wall', 'POST'),
  leaderboard: () => apiCall<LeaderboardEntry[]>('/api/leaderboard'),
  ledger: () => apiCall<LedgerData>('/api/ledger'),
  first100: () => apiCall<LeaderboardEntry[]>('/api/first100'),
  witness: (link: string, violatorEcho: string, note: string) =>
    apiCall<{ success: boolean; reward: number }>('/api/witness', 'POST', { link, violatorEcho, note }),
  disappeared: () => apiCall<DisappearedEntry[]>('/api/disappeared'),
  invite: () => apiCall<{ code: string; expiresAt: string }>('/api/invite', 'POST'),
  signal: () => apiCall<{ success: boolean; reward: number }>('/api/signal', 'POST'),
  activity: () => apiCall<string[]>('/api/activity'),
  linkWallet: (address: string) =>
    apiCall<{ success: boolean; address: string }>('/api/link-wallet', 'POST', { address }),
  adminWitnesses: () => apiCall<AdminWitness[]>('/api/admin/witnesses'),
  adminReviewWitness: (id: string, status: 'valid' | 'fake') =>
    apiCall<{ success: boolean }>(`/api/admin/witness/${id}`, 'POST', { status }),
};