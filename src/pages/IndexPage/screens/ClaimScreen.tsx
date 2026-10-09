import { useEffect, useRef, useState } from 'react';
import { beginCell } from '@ton/core';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, friendlyError } from '@/api';
import { useTonConnectUI } from '@tonconnect/ui-react';

interface Props {
  balance: number;
  walletAddress: string;
  lastClaimAt: number;
  onReturn: () => void;
  onSuccess: (claimedAmount: number) => void;
}

type Stage =
  | 'idle'
  | 'validating'
  | 'signing'
  | 'confirming'
  | 'done'
  | 'error'
  | 'rejected'
  | 'angry'
  | 'blocked';

type RejectReason = 'balance' | 'declined' | 'network';

const CONFIG_MAX_RETRIES = 3;
const CONFIG_RETRY_DELAY_MS = 2000;
const BALANCE_GAS_BUFFER_NANO = 10_000_000n; // 0.01 TON on top of the fee

export function ClaimScreen({ balance, walletAddress, lastClaimAt, onReturn, onSuccess }: Props) {
  const [tonConnectUI] = useTonConnectUI();
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState('');
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [rejectReason, setRejectReason] = useState<RejectReason>('declined');
  const [blockedUntil, setBlockedUntil] = useState<number>(0);
  const [now, setNow] = useState(Date.now());

  // ─── Config from backend — null until loaded, no hardcoded fallbacks ───
  const [minClaim, setMinClaim] = useState<number | null>(null);
  const [claimFeeTON, setClaimFeeTON] = useState<number | null>(null);
  const [claimCooldownMs, setClaimCooldownMs] = useState<number | null>(null);
  const [configState, setConfigState] = useState<'loading' | 'ready' | 'failed'>('loading');

  const configRetryRef = useRef<number | null>(null);
  const configAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  // Derived — only computed once config is present
  const minBalanceNano =
    claimFeeTON !== null
      ? BigInt(Math.floor(claimFeeTON * 1e9)) + BALANCE_GAS_BUFFER_NANO
      : null;

  const onCooldown = claimCooldownMs !== null
    ? now - lastClaimAt < claimCooldownMs
    : false;

  const remainingMs = claimCooldownMs !== null
    ? Math.max(0, claimCooldownMs - (now - lastClaimAt))
    : 0;

  const isBlocked = blockedUntil > now;

  const canClaim =
    configState === 'ready' &&
    minClaim !== null &&
    Boolean(walletAddress) &&
    balance >= minClaim &&
    !onCooldown &&
    !isBlocked;

  // ─── Mount: track mounted state for all async guards ───
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (configRetryRef.current) {
        clearTimeout(configRetryRef.current);
        configRetryRef.current = null;
      }
    };
  }, []);

  // ─── Fetch config with retry on failure ───
  useEffect(() => {
    const fetchConfig = () => {
      api.publicConfig()
        .then((c) => {
          if (!mountedRef.current) return;
          if (
            typeof c.minClaimAmount !== 'number' || c.minClaimAmount <= 0 ||
            typeof c.claimFeeTON !== 'number' || c.claimFeeTON <= 0 ||
            typeof c.claimCooldownMs !== 'number' || c.claimCooldownMs <= 0
          ) {
            throw new Error('Invalid config payload');
          }
          setMinClaim(c.minClaimAmount);
          setClaimFeeTON(c.claimFeeTON);
          setClaimCooldownMs(c.claimCooldownMs);
          setConfigState('ready');
        })
        .catch(() => {
          if (!mountedRef.current) return;
          configAttemptsRef.current += 1;
          if (configAttemptsRef.current < CONFIG_MAX_RETRIES) {
            configRetryRef.current = window.setTimeout(fetchConfig, CONFIG_RETRY_DELAY_MS);
          } else {
            setConfigState('failed');
          }
        });
    };
    fetchConfig();
  }, []);

  // ─── Restore block state from backend ───
  useEffect(() => {
    api.walletStatus()
      .then((s) => {
        if (!mountedRef.current) return;
        if (s.blockedUntil > Date.now()) {
          setBlockedUntil(s.blockedUntil);
        } else if (s.blockedUntil > 0 && s.blockedUntil <= Date.now()) {
          api.walletClear().catch(() => {});
        }
        if (s.reason) setRejectReason(s.reason as RejectReason);
      })
      .catch(() => {});
  }, []);

  // ─── Tick while blocked so the countdown updates ───
  useEffect(() => {
    if (blockedUntil <= 0) return;
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, [blockedUntil]);

  const recordRejection = async (reason: RejectReason) => {
    if (!mountedRef.current) return;
    setRejectReason(reason);
    try {
      const result = await api.walletReject(reason);
      if (!mountedRef.current) return;
      if (result.blockedUntil > Date.now()) {
        setBlockedUntil(result.blockedUntil);
        setStage('blocked');
      } else if (result.rejections >= 3) {
        setStage('angry');
      } else {
        setStage('rejected');
      }
    } catch {
      if (!mountedRef.current) return;
      setStage('rejected');
    }
  };

  const handleClaim = async () => {
    if (!canClaim) return;
    if (minBalanceNano === null) return;

    setError('');
    try {
      // Step 1 — lock balance on the backend
      setStage('validating');
      const claim = await api.claim();

      // Step 2 — verify the user's TON wallet has enough for the fee + buffer
      let balanceNano = 0n;
      try {
        const r = await fetch(
          `https://toncenter.com/api/v3/addressInformation?address=${walletAddress}&use_v2=true`
        );
        if (!r.ok) throw new Error('check failed');
        const d = await r.json();
        balanceNano = BigInt(d.balance || '0');
      } catch {
        await recordRejection('network');
        return;
      }

      if (balanceNano < minBalanceNano) {
        await recordRejection('balance');
        return;
      }

      // Step 3 — build the payment transaction
      const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail(claim.claimId)
        .endCell();

      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: claim.orderWallet,
            amount: (claim.feeTON * 1e9).toString(),
            payload: commentCell.toBoc().toString('base64'),
          },
        ],
      };

      // Step 4 — user signs
      setStage('signing');
      const result = await tonConnectUI.sendTransaction(tx);

      // Step 5 — backend verifies + sends $INDRI
      setStage('confirming');
      await api.claimConfirm(claim.claimId, result.boc);

      if (!mountedRef.current) return;
      setClaimedAmount(claim.amount);
      setStage('done');
      onSuccess(claim.amount);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(friendlyError(e));
      const msg = String(e || '').toLowerCase();
      if (msg.includes('network') || msg.includes('failed to fetch')) {
        await recordRejection('network');
      } else {
        await recordRejection('declined');
      }
    }
  };

  // ─── CONFIG FAILED ───
  if (configState === 'failed') {
    return (
      <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
        <p style={{ fontSize: '12px', color: '#888888', letterSpacing: '3px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8', marginBottom: '32px' }}>
          The ledger is not responding.
        </p>
        <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>
          Return
        </button>
      </div>
    );
  }

  // ─── CONFIG LOADING ───
  if (configState === 'loading') {
    return (
      <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
        <p style={{ fontSize: '12px', color: '#888888', letterSpacing: '3px' }}>
          Opening...
        </p>
      </div>
    );
  }

  // ─── BLOCKED ───
  if (stage === 'blocked') {
    const remainingMsLeft = Math.max(0, blockedUntil - now);
    const remainingHours = Math.ceil(remainingMsLeft / (60 * 60 * 1000));
    const remainingDays = Math.ceil(remainingMsLeft / (24 * 60 * 60 * 1000));

    const timeText = remainingMsLeft <= 0
      ? 'The gate is open again.'
      : remainingDays > 1
        ? `${remainingDays} days remain.`
        : `${remainingHours} hours remain.`;

    return (
      <div
        className="no-scrollbar"
        style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px 60px', zIndex: 2000,
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        <p style={{ fontSize: '22px', color: '#ffffff', letterSpacing: '10px', textTransform: 'uppercase', fontWeight: 'bold', margin: 0, marginBottom: '48px' }}>
          Gone.
        </p>
        <p style={{ fontSize: '13px', color: '#666666', letterSpacing: '1px', lineHeight: '2.2', margin: 0, marginBottom: '40px', maxWidth: '320px' }}>
          You did not listen.
          <br />
          The gate is closed to you.
        </p>
        <p style={{ fontSize: '13px', color: '#888888', letterSpacing: '2px', lineHeight: '2.2', margin: 0, marginBottom: '48px', maxWidth: '320px' }}>
          {timeText}
        </p>
        <p style={{ fontSize: '12px', color: '#555555', letterSpacing: '3px', margin: 0, marginBottom: '48px' }}>
          — The Order
        </p>
        <button
          onClick={onReturn}
          style={{
            padding: '14px 48px', fontSize: '11px', fontWeight: 'bold',
            letterSpacing: '5px', textTransform: 'uppercase',
            border: '1.5px solid #333333', background: 'transparent',
            color: '#444444', cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: '20px',
          }}
        >
          Close
        </button>
      </div>
    );
  }

  // ─── ANGRY ───
  if (stage === 'angry') {
    const threeTimesLine =
      rejectReason === 'balance' ? (
        <>Three times you have come to the gate.<br />Three times you have been turned away.</>
      ) : rejectReason === 'declined' ? (
        <>Three times you have come to the gate.<br />Three times you have turned away yourself.</>
      ) : (
        <>Three times you have come to the gate.<br />Three times your book link could not be seen.</>
      );

    const reasonBlock =
      rejectReason === 'balance' ? (
        <>You do not carry what is required.<br />You never did.<br />your book link does not have the sacrifice key value of {claimFeeTON !== null ? (claimFeeTON + 0.01).toFixed(2) : 'the key'} to open the gate</>
      ) : rejectReason === 'declined' ? (
        <>why you keep deny yourself the key to open the gate.</>
      ) : (
        <>Do not return on a broken line.</>
      );

    const closing =
      rejectReason === 'balance' ? (
        <>Do not return until you do.<br />The ledger does not wait for the unprepared or this will be your last attempt.</>
      ) : rejectReason === 'declined' ? (
        <>Do not return until you do.<br />The ledger does not wait for the uncertain or this will be your last attempt.</>
      ) : null;

    return (
      <div
        className="no-scrollbar"
        style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '48px 24px 60px',
          zIndex: 2000,
          fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        <p style={{ fontSize: '22px', color: '#ffffff', letterSpacing: '10px', textTransform: 'uppercase', fontWeight: 'bold', margin: 0, marginBottom: '48px' }}>
          Stop.
        </p>
        <p style={{ fontSize: '13px', color: '#aaaaaa', letterSpacing: '1px', lineHeight: '2.2', margin: 0, marginBottom: '32px', maxWidth: '320px' }}>
          {threeTimesLine}
        </p>
        <p style={{ fontSize: '13px', color: '#ffffff', letterSpacing: '1px', lineHeight: '2.2', margin: 0, marginBottom: closing ? '40px' : '48px', maxWidth: '320px' }}>
          {reasonBlock}
        </p>
        {closing && (
          <p style={{ fontSize: '12px', color: '#666666', letterSpacing: '2px', lineHeight: '2', margin: 0, marginBottom: '48px', maxWidth: '300px' }}>
            {closing}
          </p>
        )}
        <p style={{ fontSize: '12px', color: '#555555', letterSpacing: '3px', margin: 0, marginBottom: '48px' }}>
          — The Order
        </p>
        <button
          onClick={onReturn}
          style={{
            padding: '14px 48px', fontSize: '11px', fontWeight: 'bold',
            letterSpacing: '5px', textTransform: 'uppercase',
            border: '1.5px solid #555555', background: 'transparent',
            color: '#888888', cursor: 'pointer', fontFamily: 'inherit',
            marginBottom: '20px',
          }}
        >
          Leave
        </button>
      </div>
    );
  }

  // ─── GENTLE REJECTION ───
  if (stage === 'rejected') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px', zIndex: 2000,
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace", textAlign: 'center',
      }}>
        <p style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 'bold', margin: 0, marginBottom: '24px', maxWidth: '320px', lineHeight: '1.7' }}>
          The Gate did not open.
        </p>
        <p style={{ fontSize: '12px', color: '#666666', letterSpacing: '2px', lineHeight: '2', margin: 0, marginBottom: '40px', maxWidth: '300px' }}>
          The Order does not explain why.
          The ledger remains closed.
        </p>
        <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', fontStyle: 'italic', margin: 0, marginBottom: '40px' }}>
          Come back when you are ready.
        </p>
        <p style={{ fontSize: '12px', color: '#777777', letterSpacing: '3px', margin: 0, marginBottom: '40px' }}>
          — The Order
        </p>
        <button
          onClick={() => setStage('idle')}
          style={{
            padding: '14px 48px', fontSize: '11px', fontWeight: 'bold',
            letterSpacing: '5px', textTransform: 'uppercase',
            border: '1.5px solid #ffffff', background: 'transparent',
            color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          I understand
        </button>
      </div>
    );
  }

  // ─── DONE ───
  if (stage === 'done') {
    return (
      <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
        <p style={{ fontSize: '18px', color: '#ffffff', letterSpacing: '4px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.8', marginBottom: '24px' }}>
          The ledger has opened.
        </p>
        <p style={{ fontSize: '14px', color: '#aaaaaa', letterSpacing: '2px', textAlign: 'center', marginBottom: '40px' }}>
          {claimedAmount.toLocaleString()} $INDRI sent.
        </p>
        <p style={{ fontSize: '12px', color: '#555555', letterSpacing: '3px', marginBottom: '48px' }}>
          — The Order
        </p>
        <button onClick={onReturn} style={buttonStyle}>Return</button>
      </div>
    );
  }

  // ─── VALIDATING / SIGNING / CONFIRMING ───
  if (stage === 'validating' || stage === 'signing' || stage === 'confirming') {
    const text =
      stage === 'validating' ? 'The offering is being made...'
      : stage === 'signing' ? 'Awaiting your signature...'
      : 'The ledger is opening...';
    return (
      <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
        <p style={{ fontSize: '12px', color: '#888888', letterSpacing: '3px' }}>
          {text}
        </p>
      </div>
    );
  }

  // ─── IDLE / ERROR ───
  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        Claim
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '40px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        Take what is held.<br />Leave the silence behind.
      </p>

      <div style={{ ...textBlockStyle, fontSize: '14px', lineHeight: '2.6', marginBottom: '32px' }}>
        <p style={{ color: '#888888' }}>Your share</p>
        <p style={{ color: '#ffffff', fontSize: '26px', fontWeight: 'bold' }}>
          {balance.toLocaleString()} <span style={{ fontSize: '13px', color: '#777777' }}>$INDRI</span>
        </p>
      </div>

      {!walletAddress && (
        <p style={{ fontSize: '12px', color: '#888888', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8', marginBottom: '24px' }}>
          The Gate has not seen you yet.<br />Link a wallet first.
        </p>
      )}

      {walletAddress && minClaim !== null && balance < minClaim && (
        <p style={{ fontSize: '12px', color: '#888888', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8', marginBottom: '24px' }}>
          Your share is too small to leave.<br />
          Minimum {minClaim.toLocaleString()} $INDRI.
        </p>
      )}

      {onCooldown && (
        <p style={{ fontSize: '12px', color: '#888888', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8', marginBottom: '24px' }}>
          You have already taken your share today.<br />
          The ledger opens again in {Math.ceil(remainingMs / (60 * 60 * 1000))} hours.
        </p>
      )}

      {error && (
        <p style={{ fontSize: '11px', color: '#888888', letterSpacing: '2px', textAlign: 'center', maxWidth: '300px', marginBottom: '20px' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleClaim}
        disabled={!canClaim}
        style={{
          ...buttonStyle,
          opacity: canClaim ? 1 : 0.3,
          cursor: canClaim ? 'pointer' : 'not-allowed',
        }}
      >
        {isBlocked ? 'Sealed' : canClaim ? 'Claim' : 'Not yet'}
      </button>

      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>Return</button>
    </div>
  );
}