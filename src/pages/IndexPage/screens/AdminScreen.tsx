import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, smallButtonStyle } from '../styles';
import { api, type AdminWitness } from '@/api';

interface Props {
  onReturn: () => void;
}

export function AdminScreen({ onReturn }: Props) {
  const [witnesses, setWitnesses] = useState<AdminWitness[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    api.adminWitnesses()
      .then(setWitnesses)
      .catch(e => setError(String(e)));
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, status: 'valid' | 'fake') => {
    try {
      await api.adminReviewWitness(id, status);
      setWitnesses(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 'bold' }}>
        Admin
      </p>
      {error && <p style={{ color: '#ff5555', fontSize: '11px' }}>{error}</p>}
      <div style={{ maxHeight: '60vh', overflowY: 'auto', width: '100%', maxWidth: '340px' }}>
        {witnesses.length === 0 ? (
          <p style={{ color: '#555555', fontSize: '12px', textAlign: 'center' }}>No pending witnesses.</p>
        ) : (
          witnesses.map(w => (
            <div key={w.id} style={{ border: '1px solid #222', padding: '12px', marginBottom: '10px' }}>
              <p style={{ fontSize: '11px', color: '#888', margin: '0 0 6px 0' }}>{w.reporterId}</p>
              <p style={{ fontSize: '11px', color: '#aaa', margin: '0 0 6px 0' }}>{w.link}</p>
              <p style={{ fontSize: '11px', color: '#666', margin: '0 0 10px 0' }}>{w.note}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => review(w.id, 'valid')} style={smallButtonStyle}>Valid</button>
                <button onClick={() => review(w.id, 'fake')} style={smallButtonStyle}>Fake</button>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}