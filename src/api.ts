const API_URL = 'https://indri-backend.onrender.com';

function getInitData(): string {
  // @ts-ignore
  return window.Telegram?.WebApp?.initData || '';
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