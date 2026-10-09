import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle } from '../styles';
import { api, type WallTrace } from '@/api';

interface Props {
  hasMarkedToday: boolean;
  onAddMark: () => void;
  onResetMark: () => void;
  onReturn: () => void;
}

export function WallScreen({ hasMarkedToday, onAddMark, onReturn }: Props) {
  const [traces, setTraces] = useState<WallTrace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWall()
      .then((data) => setTraces(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    await onAddMark();
    try {
      const fresh = await api.getWall();
      setTraces(fresh);
    } catch {}
  };

  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The Quiet Wall
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '30px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        One trace per day.<br />No names. No words.
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
        maxWidth: '340px',
        maxHeight: '240px',
        overflowY: 'auto',
        padding: '10px',
      }} className="no-scrollbar">
        {traces.map((_, i) => (
          <div key={i} style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#333333',
            border: '1px solid #444444',
          }} />
        ))}
        {!loading && traces.length === 0 && (
          <p style={{ color: '#333333', fontSize: '12px' }}>The wall is empty.</p>
        )}
      </div>

      <p style={{ marginTop: '20px', fontSize: '11px', color: '#555555' }}>
        {traces.length} {traces.length === 1 ? 'trace' : 'traces'}
      </p>

      <button
        onClick={handleAdd}
        disabled={hasMarkedToday}
        style={{ ...buttonStyle, opacity: hasMarkedToday ? 0.3 : 1 }}
      >
        {hasMarkedToday ? 'Traced Today' : 'Add Trace'}
      </button>

      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>
        Return
      </button>
    </div>
  );
}