import { useState } from 'react';
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

const MIN_CLAIM = 1000;
const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function ClaimScreen({ balance, walletAddress, lastClaimAt, onReturn, onSuccess }: Props) {
  const [tonConnectUI] = useTonConnectUI();
  const [stage, setStage] = useState<'idle' | 'signing' | 'confirming' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [claimedAmount, setClaimedAmount] = useState(0);

  const now = Date.now();
  const onCooldown = now - lastClaimAt < CLAIM_COOLDOWN_MS;
  const remainingMs = Math.max(0, CLAIM_COOLDOWN_MS - (now - lastClaimAt));
  const canClaim = Boolean(walletAddress) && balance >= MIN_CLAIM && !onCooldown;

  const handleClaim = async () => {
    if (!canClaim) return;
    setError('');
    try {
      // Step 1 — ask the backend to lock the balance and return payment details
      setStage('signing');
      const claim = await api.claim();

      // Step 2 — build the text comment cell: op=0, then snake string of the claimId
      // This matches verifyClaimPayment() on the backend, which reads:
      //   op = cs.loadUint(32)  // must be 0
      //   comment = cs.loadStringTail()
      const commentCell = beginCell()
        .storeUint(0, 32)
        .storeStringTail(claim.claimId)
        .endCell();

      // Step 3 — build the payment transaction for the user to sign
      const tx = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [
          {
            address: claim.orderWallet,
            amount: (claim.feeTON * 1e9).toString(), // TON → nanotons
            payload: commentCell.toBoc().toString('base64'),
          },
        ],
      };

      // Step 4 — user signs
      const result = await tonConnectUI.sendTransaction(tx);

      // Step 5 — notify the backend to verify and send the $INDRI
      setStage('confirming');
      await api.claimConfirm(claim.claimId, result.boc);

      setClaimedAmount(claim.amount);
      setStage('done');
      onSuccess(claim.amount);
    } catch (e) {
      setError(friendlyError(e));
      setStage('error');
    }
  };

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

  // ─── SIGNING / CONFIRMING ───
  if (stage === 'signing' || stage === 'confirming') {
    return (
      <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
        <p style={{ fontSize: '12px', color: '#888888', letterSpacing: '3px' }}>
          {stage === 'signing' ? 'Awaiting your signature...' : 'The ledger is opening...'}
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

      {walletAddress && balance < MIN_CLAIM && (
        <p style={{ fontSize: '12px', color: '#888888', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8', marginBottom: '24px' }}>
          Your share is too small to leave.<br />
          Minimum {MIN_CLAIM.toLocaleString()} $INDRI.
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
        {canClaim ? 'Claim' : 'Not yet'}
      </button>

      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>Return</button>
    </div>
  );
}