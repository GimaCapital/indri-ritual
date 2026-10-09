import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, signatureStyle, textBlockStyle } from '../styles';
import { INVITE_GATE_DAYS } from '../constants';
import { api, friendlyError } from '@/api';

interface Props {
  wasInvited: boolean;
  silentDays: number;
  onReturn: () => void;
}

export function InviteScreen({ wasInvited, silentDays, onReturn }: Props) {
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(Date.now());

  const organicGateOpen = wasInvited || silentDays >= INVITE_GATE_DAYS;
  const daysRemaining = Math.max(0, INVITE_GATE_DAYS - silentDays);

  // Load cached code on mount — if still valid, show it immediately
  useEffect(() => {
    const savedCode = localStorage.getItem('indri_invite_code');
    const savedExpires = localStorage.getItem('indri_invite_expires');
    if (savedCode && savedExpires) {
      const expiresNum = parseInt(savedExpires, 10);
      if (Date.now() < expiresNum) {
        setCode(savedCode);
        setExpiresAt(expiresNum);
      } else {
        localStorage.removeItem('indri_invite_code');
        localStorage.removeItem('indri_invite_expires');
      }
    }
  }, []);

  // Tick every minute so the expiry countdown updates
  useEffect(() => {
    if (!code) return;
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(tick);
  }, [code]);

  // Auto-clear the code when it expires while the user is on this screen
  useEffect(() => {
    if (code && expiresAt && now >= expiresAt) {
      setCode('');
      setExpiresAt(null);
      localStorage.removeItem('indri_invite_code');
      localStorage.removeItem('indri_invite_expires');
    }
  }, [now, code, expiresAt]);

  const generate = async () => {
    setError('');
    setLoading(true);
    localStorage.removeItem('indri_invite_code');
    localStorage.removeItem('indri_invite_expires');
    try {
      const result = await api.invite();
      const expiresNum = new Date(result.expiresAt).getTime();
      setCode(result.code);
      setExpiresAt(expiresNum);
      setNow(Date.now());
      localStorage.setItem('indri_invite_code', result.code);
      localStorage.setItem('indri_invite_expires', String(expiresNum));
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  // Format remaining time: "24h" / "3h 15m" / "45m" / "expired"
  const formatRemaining = (): string => {
    if (!expiresAt) return '';
    const ms = expiresAt - now;
    if (ms <= 0) return 'expired';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours >= 1) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      {!code ? (
        <>
          <div style={textBlockStyle}>
            <p style={{ fontSize: '14px', letterSpacing: '6px', textTransform: 'uppercase', color: '#ffffff', fontWeight: 'bold' }}>
              Extend the Silence
            </p>
            {organicGateOpen ? (
              <>
                <p>You may bring one person in.</p>
                <p>Choose carefully.<br />They will carry your Secret Echo.<br />If they break the silence, you lose your share.</p>
                <p style={{ color: '#ffffff' }}>They will know.</p>
                <p>You have 1 invitation today.</p>
              </>
            ) : (
              <>
                <p>You were not invited.</p>
                <p>You must stay silent for {INVITE_GATE_DAYS} days<br />before you may invite.</p>
                <p style={{ color: '#ffffff', fontSize: '15px' }}>{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining.</p>
              </>
            )}
            {error && <p style={{ color: '#ff5555', fontSize: '11px', letterSpacing: '2px', marginTop: '12px' }}>{error}</p>}
          </div>
          {organicGateOpen && (
            <button onClick={generate} disabled={loading} style={buttonStyle}>
              {loading ? 'Generating...' : 'Generate Code'}
            </button>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '6px', textTransform: 'uppercase' }}>Your Code</p>
          <p style={{ fontSize: '36px', color: '#ffffff', letterSpacing: '10px', marginTop: '30px', fontWeight: 'bold' }}>{code}</p>
          <p style={{ fontSize: '10px', color: '#555555', letterSpacing: '3px', marginTop: '14px', textTransform: 'uppercase' }}>
            Expires in {formatRemaining()}
          </p>
          <div style={{ ...textBlockStyle, marginTop: '50px', fontSize: '12px' }}>
            <p>Valid for 24 hours.<br />Send it to one person.<br />Tell them nothing else.</p>
            <p style={signatureStyle}>They will know who sent it.</p>
          </div>
        </>
      )}
      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>Return</button>
    </div>
  );
}