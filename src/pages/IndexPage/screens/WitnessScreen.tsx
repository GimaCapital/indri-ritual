import { useState } from 'react';
import { buttonStyle, containerStyle, inputStyle, signatureStyle, textBlockStyle } from '../styles';
import { api, friendlyError } from '@/api';

interface Props {
  onReturn: () => void;
}

export function WitnessScreen({ onReturn }: Props) {
  const [link, setLink] = useState('');
  const [echo, setEcho] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (link.trim().length === 0) return;
    setError('');
    try {
      await api.witness(link, echo, note);
      setSubmitted(true);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const canSubmit = link.trim().length > 0;

  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      <p style={{ fontSize: '14px', letterSpacing: '6px', textTransform: 'uppercase', color: '#ffffff', fontWeight: 'bold', margin: 0, marginBottom: submitted ? '32px' : '24px' }}>
        Witness a Breach
      </p>

      {!submitted ? (
        <>
          <div style={textBlockStyle}>
            <p>You saw a member speak publicly.</p>
            <p>They will be excluded from the distribution.</p>
            <p>Submit evidence.<br />They will be forgotten.<br />You will be rewarded.</p>
            <p style={{ color: '#ffffff' }}>Their share becomes yours.</p>
            <p style={signatureStyle}>They will know.</p>
          </div>

          <div style={{ marginTop: '30px', width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="LINK TO THE POST" value={link} onChange={(e) => setLink(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="THEIR SECRET ECHO (IF KNOWN)" value={echo} onChange={(e) => setEcho(e.target.value.toUpperCase())} style={inputStyle} />
            <textarea placeholder="DESCRIBE WHAT YOU SAW" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, height: '90px', resize: 'none', fontFamily: 'monospace' }} />

            {error && <p style={{ color: '#888888', fontSize: '11px', letterSpacing: '2px', textAlign: 'center', margin: '4px 0 0 0' }}>{error}</p>}

            <button onClick={submit} disabled={!canSubmit} style={{ ...buttonStyle, marginTop: '10px', opacity: canSubmit ? 1 : 0.3, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
              Submit Witness
            </button>
          </div>
        </>
      ) : (
        <div style={{ ...textBlockStyle, marginBottom: '20px' }}>
          <p style={{ color: '#ffffff', fontSize: '15px', letterSpacing: '2px', marginBottom: '12px' }}>Your witness has been recorded.</p>
          <p style={{ color: '#ffffff', fontSize: '14px', marginBottom: '12px' }}>Reward pending review.</p>
          <p style={signatureStyle}>They will know.</p>
        </div>
      )}

      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>
        Return
      </button>
    </div>
  );
}