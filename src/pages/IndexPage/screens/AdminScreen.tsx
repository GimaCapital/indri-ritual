import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, smallButtonStyle } from '../styles';
import { api, friendlyError, type AdminWitness } from '@/api';

interface Props {
  onReturn: () => void;
}

export function AdminScreen({ onReturn }: Props) {
  const [witnesses, setWitnesses] = useState<AdminWitness[]>([]);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api.adminWitnesses()
      .then(setWitnesses)
      .catch(e => setError(friendlyError(e)));
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, status: 'valid' | 'fake') => {
    setError('');
    try {
      await api.adminReviewWitness(id, status);
      setWitnesses(prev => prev.filter(w => w.id !== id));
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 'bold' }}>
        Admin
      </p>
      {error && <p style={{ color: '#ff5555', fontSize: '11px', letterSpacing: '2px', marginBottom: '12px' }}>{error}</p>}
      <div className="no-scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto', width: '100%', maxWidth: '340px' }}>
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
      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>Return</button>
    </div>
  );
}