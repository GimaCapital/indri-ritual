import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, type LeaderboardEntry } from '@/api';

interface Props {
  secretEcho: string;
  silentDays: number;
  onReturn: () => void;
}

export function SilentScreen({ secretEcho, silentDays, onReturn }: Props) {
  const [top, setTop] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    api.leaderboard().then(setTop).catch(() => {});
  }, []);

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '30px', fontWeight: 'bold' }}>
        The Silent
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '40px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        The longer you stay silent,<br />the larger your share.
      </p>
      <div style={{ ...textBlockStyle, fontSize: '13px', lineHeight: '2.4' }}>
        {top.length === 0 ? (
          <p style={{ color: '#555555' }}>The list is empty. You are the first.</p>
        ) : (
          top.map((item, i) => (
            <p key={i} style={{ color: '#888888' }}>{item.secretEcho} — {item.silentDays} days</p>
          ))
        )}
        <p style={{ color: '#ffffff', fontWeight: 'bold', marginTop: '20px' }}>
          {secretEcho} — {silentDays} days
        </p>
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}