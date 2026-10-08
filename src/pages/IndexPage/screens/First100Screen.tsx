import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, type LeaderboardEntry } from '@/api';

interface Props {
  onReturn: () => void;
}

export function First100Screen({ onReturn }: Props) {
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.first100().then(setUsers).catch(() => {});
  }, []);

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The Block List
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '20px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        They entered before the world knew.<br />They are remembered.
      </p>
      <div style={{ ...textBlockStyle, fontSize: '11px', lineHeight: '1.8', maxHeight: '50vh', overflowY: 'auto', padding: '10px' }}>
        {users.length === 0 ? (
          <p style={{ color: '#555555' }}>The list has not begun.</p>
        ) : (
          users.map((item, i) => (
            <p key={i} style={{ color: '#666666', margin: '2px 0' }}>
              <span style={{ color: '#444444' }}>#{i + 1}</span> — {item.secretEcho} — {item.silentDays} days
            </p>
          ))
        )}
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}