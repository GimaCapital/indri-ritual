import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, type LedgerData } from '@/api';

interface Props {
  onReturn: () => void;
  onGoToClaim?: () => void;
  canClaim?: boolean;
}

export function LedgerScreen({ onReturn, onGoToClaim, canClaim }: Props) {
  const [data, setData] = useState<LedgerData | null>(null);

  useEffect(() => {
    api.ledger().then(setData).catch(() => {});
  }, []);

  return (
    <div
      className="no-scrollbar"
      style={{
        ...containerStyle,
        height: 'auto',
        minHeight: '100vh',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        paddingTop: '32px',
        paddingBottom: '60px',
      }}
    >
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The Ledger
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '28px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        What has been given.<br />What remains.
      </p>

      <div style={{ ...textBlockStyle, fontSize: '14px', lineHeight: '2.6' }}>
        {/* What has been given */}
        <p style={{ color: '#888888' }}>What has been given</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.totalDistributed ?? 0).toLocaleString()} $INDRI
        </p>

        {/* What remains */}
        <p style={{ color: '#888888', marginTop: '20px' }}>Onchain Awaiting Claim</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.awaitingClaim ?? 0).toLocaleString()} $INDRI
        </p>

        {/* Claim button — only when user can claim */}
        {canClaim && onGoToClaim && (
          <button
            onClick={onGoToClaim}
            style={{
              marginTop: '20px',
              padding: '10px 32px',
              fontSize: '10px',
              fontWeight: 'bold',
              letterSpacing: '5px',
              textTransform: 'uppercase',
              border: '1px solid #555555',
              background: 'transparent',
              color: '#aaaaaa',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ffffff';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#555555';
              e.currentTarget.style.color = '#aaaaaa';
            }}
          >
            Claim
          </button>
        )}

        {/* The Order's pool */}
        <p style={{ color: '#888888', marginTop: '24px' }}>The Order's Pool</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.orderPool ?? 0).toLocaleString()} $INDRI
        </p>

        {/* Members */}
        <p style={{ color: '#888888', marginTop: '20px' }}>Members</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.totalMembers ?? 0).toLocaleString()}
        </p>
      </div>

      {/* Divider */}
      <div style={{
        height: '1px',
        width: '100%',
        maxWidth: '340px',
        background: 'linear-gradient(to right, transparent, #1f1f1f, transparent)',
        margin: '32px 0',
      }} />

      {/* Why TON. Why $INDRI. How to claim. */}
      <div style={{
        ...textBlockStyle,
        fontSize: '12px',
        lineHeight: '2',
        textAlign: 'left',
        borderLeft: '1px solid #1f1f1f',
        paddingLeft: '14px',
        marginBottom: '20px',
      }}>
        <p style={{ margin: '8px 0', color: '#888888' }}>
          The Order's currency was built peer to peer.
          One hand to another. Not thousands.
        </p>
        <p style={{ margin: '8px 0', color: '#aaaaaa' }}>
          So we built the Order's TON chain.
          The chain is ready. The table is set.
          The shares are ready. The time is now.
        </p>
        <p style={{ margin: '16px 0 4px 0', color: '#888888' }}>
          The proof is in the first wallet.
        </p>
        <p style={{ margin: '4px 0', color: '#aaaaaa' }}>
          $INDRI is your share held for you,
          one tap to claim when the time comes.
        </p>
        <p style={{ margin: '16px 0 4px 0', color: '#888888' }}>
          What cannot be delivered returns to the pool.
          The pool returns to all.
        </p>
      </div>

      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>
        Return
      </button>
    </div>
  );
}