import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, type DisappearedEntry } from '@/api';

interface Props {
  onReturn: () => void;
}

export function DisappearedScreen({ onReturn }: Props) {
  const [list, setList] = useState<DisappearedEntry[]>([]);

  useEffect(() => {
    api.disappeared().then(setList).catch(() => {});
  }, []);

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The Disappeared
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '30px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        They broke the silence.<br />They were forgotten.
      </p>
      <div style={{ ...textBlockStyle, fontSize: '12px', lineHeight: '2.2' }}>
        {list.length === 0 ? (
          <p style={{ color: '#444444' }}>No one has disappeared yet.</p>
        ) : (
          list.map((item, i) => (
            <p key={i} style={{ color: '#666666' }}>
              <span style={{ color: '#888888' }}>{item.echo}</span> — {item.days} days — <span style={{ color: '#444444' }}>{item.reason}</span>
            </p>
          ))
        )}
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}