import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, type LeaderboardEntry, type ChainData } from '@/api';

interface Props {
  onReturn: () => void;
}

export function First100Screen({ onReturn }: Props) {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);
  const [chain, setChain] = useState<ChainData | null>(null);

  useEffect(() => {
    api.first100().then(setUsers).catch(() => {});
    api.chain().then(setChain).catch(() => {});
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
      {/* ─── PRIMARY TITLE ─── */}
      <p style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 'bold' }}>
        The Block List
      </p>
      <p style={{ fontSize: '9px', color: '#444444', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '32px' }}>
        The First 100
      </p>

      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '32px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        They entered before the world knew.<br />They are remembered.
      </p>

      {/* ─── SECTION 1: YOUR REGION ─── */}
      {chain && (
        <>
          <p style={{ fontSize: '9px', color: '#444444', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Your Region
          </p>

          <div style={{ ...textBlockStyle, fontSize: '11px', lineHeight: '2', textAlign: 'center', marginBottom: '32px' }}>
            {chain.ancestors.length > 0 && (
              <>
                {chain.ancestors.map((node, i) => (
                  <p key={i} style={{ color: '#555555', margin: '4px 0' }}>
                    {node.echo} — {node.silentDays} days
                  </p>
                ))}
                <p style={{ color: '#333333', margin: '6px 0' }}>│</p>
              </>
            )}

            <p style={{ color: '#ffffff', fontSize: '15px', letterSpacing: '4px', fontWeight: 'bold', margin: '8px 0' }}>
              {chain.self.echo}
            </p>
            <p style={{ color: '#666666', fontSize: '10px', letterSpacing: '2px', margin: 0 }}>
              you — {chain.self.silentDays} days
            </p>

            {chain.children.length > 0 ? (
              <>
                <p style={{ color: '#333333', margin: '6px 0' }}>│</p>
                {chain.children.map((node, i) => (
                  <p key={i} style={{ color: '#888888', margin: '4px 0' }}>
                    {node.echo} — {node.silentDays} days
                  </p>
                ))}
              </>
            ) : (
              <>
                <p style={{ color: '#333333', margin: '6px 0' }}>│</p>
                <p style={{ color: '#444444', fontSize: '10px', letterSpacing: '2px', margin: 0 }}>
                  no one yet
                </p>
              </>
            )}
          </div>

          {/* Divider */}
          <div style={{
            height: '1px',
            width: '100%',
            maxWidth: '340px',
            background: 'linear-gradient(to right, transparent, #1f1f1f, transparent)',
            margin: '0 0 24px 0',
          }} />
        </>
      )}

      {/* ─── SECTION 2: THE LIST ─── */}
      <p style={{ fontSize: '9px', color: '#444444', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '16px' }}>
        The List
      </p>

      <div
        className="no-scrollbar"
        style={{
          ...textBlockStyle,
          fontSize: '11px',
          lineHeight: '1.8',
          maxHeight: '45vh',
          overflowY: 'auto',
          padding: '10px',
        }}
      >
        {users.length === 0 ? (
          <p style={{ color: '#555555' }}>The list has not begun.</p>
        ) : (
          users.map((item, i) => {
            const isSelf = chain && item.secretEcho === chain.self.echo;
            return (
              <p
                key={i}
                style={{
                  color: isSelf ? '#ffffff' : '#666666',
                  fontWeight: isSelf ? 'bold' : 'normal',
                  margin: '2px 0',
                }}
              >
                <span style={{ color: isSelf ? '#888888' : '#444444' }}>#{i + 1}</span>
                {' — '}
                {item.secretEcho}
                {' — '}
                {item.silentDays} days
                {isSelf && <span style={{ color: '#555555' }}> · you</span>}
              </p>
            );
          })
        )}
      </div>

      <button onClick={onReturn} style={{ ...buttonStyle, marginTop: '24px', marginBottom: '20px' }}>
        Return
      </button>
    </div>
  );
}