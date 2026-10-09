const API_URL = 'https://indri-backend.onrender.com';

function getInitData(): string {
  // @ts-ignore
  if (window.Telegram?.WebApp?.initData) {
    // @ts-ignore
    return window.Telegram.WebApp.initData;
  }
  const hash = window.location.hash.slice(1);
  if (hash) {
    const params = new URLSearchParams(hash);
    const tgData = params.get('tgWebAppData');
    if (tgData) return decodeURIComponent(tgData);
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
  // Signal system
  signalLiveUntil: number;
  signalQueue: { queuedAt: number }[];
  lastSignalQueuedDate: string;
  signalsQueued: number;
  signalsArrived: number;
  signalsTraded: number;
  signalsToOrder: number;
  // Wallet
  walletAddress: string;
  walletRejections: number;
  walletBlockedUntil: number;
  walletBlockReason: string;
  // Claim
  lastClaimAt: number;
  pendingClaimId: string;
  totalClaimed: number;
  // Admin
  isAdmin: boolean;
}

export interface LeaderboardEntry {
  secretEcho: string;
  silentDays: number;
}

export interface LedgerData {
  totalDistributed: number;
  totalMembers: number;
  awaitingClaim: number;
  orderPool: number;
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

export interface ChainNode {
  echo: string;
  entryNumber: number;
  silentDays: number;
}

export interface ChainData {
  self: ChainNode;
  ancestors: ChainNode[];
  children: ChainNode[];
}

export interface WalletStatus {
  rejections: number;
  blockedUntil: number;
  reason: string;
}

// Claim
export interface ClaimInitiateResponse {
  claimId: string;
  amount: number;
  feeTON: number;
  orderWallet: string;
}

export interface ClaimConfirmResponse {
  success: boolean;
  amount?: number;
  status?: string;
  message?: string;
}

export interface PublicConfig {
  minClaimAmount: number;
  claimFeeTON: number;
  claimCooldownMs: number;
}

// ============ FRIENDLY MESSAGES ============
export function friendlyError(e: unknown): string {
  const msg = String(e || '');

  // Signal system
  if (msg.includes('One signal per day')) return 'One signal per day.';
  if (msg.includes('No other members yet')) return 'The silence is complete. No one to signal yet.';

  // Stay / cooldown
  if (msg.includes('Cooldown active')) return 'They are still watching. Wait.';

  // Invites
  if (msg.includes('Invalid or used code')) return 'This code was not recognized.';
  if (msg.includes('Code expired')) return 'This code has expired.';
  if (msg.includes('Not eligible to invite yet')) return 'You are not yet eligible to invite.';
  if (msg.includes('Already invited today')) return 'You have already invited someone today.';

  // Wall
  if (msg.includes('Already traced today')) return 'You have already left a trace today.';

  // Auth
  if (msg.includes('Missing initData')) return 'Open this app inside Telegram to continue.';
  if (msg.includes('Invalid initData')) return 'Session expired. Reopen the app.';

  // Witness
  if (msg.includes('Missing link')) return 'A link is required.';

  // Admin
  if (msg.includes('Not the admin')) return 'You are not the admin.';
  if (msg.includes('Witness not found')) return 'This witness no longer exists.';
  if (msg.includes('Invalid status')) return 'Invalid action.';

  // Claim
  if (msg.includes('No wallet linked')) return 'Link a wallet first.';
  if (msg.includes('Minimum claim is')) return 'Your share is too small to claim yet.';
  if (msg.includes('Claim cooldown active')) return 'The ledger is not ready for you yet.';
  if (msg.includes('Claim not found')) return 'This claim no longer exists.';
  if (msg.includes('Not your claim')) return 'This claim is not yours.';
  if (msg.includes('Claim already processed')) return 'This claim has already been processed.';
  if (msg.includes('Payment not verified')) return 'The payment could not be verified.';
  if (msg.includes('Missing claimId or txHash')) return 'The claim details are incomplete.';

  // Network
  if (msg.includes('Failed to fetch')) return 'The Order is silent. Try again.';
  if (msg.includes('NetworkError')) return 'The Order is silent. Try again.';

  // Fallback — never show raw error text
  return 'Something was lost in the silence.';
}
// ===========================================

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
  apiCall<{ success: boolean }>('/api/witness', 'POST', { link, violatorEcho, note }),
  disappeared: () => apiCall<DisappearedEntry[]>('/api/disappeared'),
  invite: () => apiCall<{ code: string; expiresAt: string }>('/api/invite', 'POST'),
  signalTap: () =>
  apiCall<{ outcome: 'traded' | 'live' | 'none' }>('/api/signal/tap', 'POST'),
  activity: () => apiCall<string[]>('/api/activity'),
  linkWallet: (address: string) =>
  apiCall<{ success: boolean; address: string }>('/api/link-wallet', 'POST', { address }),
  adminWitnesses: () => apiCall<AdminWitness[]>('/api/admin/witnesses'),
  adminReviewWitness: (id: string, status: 'valid' | 'fake') =>
  apiCall<{ success: boolean }>(`/api/admin/witness/${id}`, 'POST', { status }),
  chain: () => apiCall<ChainData>('/api/chain'),

  // Wallet block system
  walletStatus: () => apiCall<WalletStatus>('/api/wallet/status'),
  walletReject: (reason: 'balance' | 'declined' | 'network') =>
    apiCall<{ rejections: number; blockedUntil: number; reason: string }>(
      '/api/wallet/reject',
      'POST',
      { reason }
    ),
  walletClear: () => apiCall<{ success: boolean }>('/api/wallet/clear', 'POST'),

  // Claim
  claim: () => apiCall<ClaimInitiateResponse>('/api/claim', 'POST'),
  claimConfirm: (claimId: string, txHash: string) =>
  apiCall<ClaimConfirmResponse>('/api/claim/confirm', 'POST', { claimId, txHash }),
  publicConfig: () => apiCall<PublicConfig>('/api/config'),
};