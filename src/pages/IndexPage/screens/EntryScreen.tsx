import { useState } from 'react';
import { buttonStyle, containerStyle, dimButtonStyle, inputStyle } from '../styles';
import { api } from '@/api';

interface Props {
  code: string;
  setCode: (v: string) => void;
  onSuccess: (wasInvited: boolean) => void;
}

export function EntryScreen({ code, setCode, onSuccess }: Props) {
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleCodeSubmit = async () => {
    if (code.trim().length === 0) return;
    setChecking(true);
    setError('');
    try {
      const { valid } = await api.validateInvite(code);
      if (!valid) {
        setError('This code was not recognized.');
        return;
      }
      await api.redeemInvite(code);
      onSuccess(true);
    } catch (e) {
      setError('The Order is silent. Try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleNoCode = () => {
    onSuccess(false);
  };

  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      <img src="/indri.png" alt="" style={{ width: '180px', height: '140px', objectFit: 'contain' }} />
      <p style={{ marginTop: '40px', fontSize: '16px', color: '#ffffff', letterSpacing: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
        INDRI
      </p>
      <p style={{ marginTop: '12px', fontSize: '11px', color: '#666666', letterSpacing: '3px', textTransform: 'uppercase' }}>
        Tell no one
      </p>
      <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '14px', width: '300px' }}>
        <input
          type="text"
          placeholder="ENTER YOUR CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={inputStyle}
          disabled={checking}
        />
        <button onClick={handleCodeSubmit} disabled={checking} style={buttonStyle}>
          {checking ? 'Checking...' : 'Enter'}
        </button>
        <button onClick={handleNoCode} disabled={checking} style={dimButtonStyle}>
          I was not told
        </button>
        {error && (
          <p style={{ fontSize: '11px', color: '#ff5555', letterSpacing: '2px', textAlign: 'center', marginTop: '10px' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}