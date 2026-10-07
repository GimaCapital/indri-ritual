import { useState } from 'react';
import { buttonStyle, containerStyle, inputStyle, signatureStyle, textBlockStyle } from '../styles';

interface Props {
  onReturn: () => void;
  onReward: (amount: number) => void;
}

export function WitnessScreen({ onReturn, onReward }: Props) {
  const [link, setLink] = useState('');
  const [echo, setEcho] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = () => {
    if (link.trim().length === 0) return;
    onReward(50);
    setSubmitted(true);
  };

  return (
    <div style={containerStyle}>
      <div style={textBlockStyle}>
        <p style={{ fontSize: '14px', letterSpacing: '6px', textTransform: 'uppercase', color: '#ffffff', fontWeight: 'bold' }}>
          Witness a Breach
        </p>
        <p>You saw a member speak publicly.</p>
        <p>They are now excluded from the distribution.</p>
        <p>Submit evidence.<br />They will be forgotten.<br />You will be rewarded.</p>
        <p style={{ color: '#ffffff' }}>Their share becomes yours.</p>
        <p style={signatureStyle}>They will know.</p>
      </div>

      {!submitted ? (
        <div style={{ marginTop: '30px', width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="LINK TO THE POST" value={link} onChange={(e) => setLink(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="THEIR SECRET ECHO (IF KNOWN)" value={echo} onChange={(e) => setEcho(e.target.value.toUpperCase())} style={inputStyle} />
          <textarea placeholder="DESCRIBE WHAT YOU SAW" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...inputStyle, height: '90px', resize: 'none', fontFamily: 'monospace' }} />
          <button onClick={submit} disabled={link.trim().length === 0} style={{ ...buttonStyle, marginTop: '10px', opacity: link.trim().length === 0 ? 0.3 : 1 }}>
            Submit Witness
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '40px', ...textBlockStyle }}>
          <p style={{ color: '#ffffff', fontSize: '15px', letterSpacing: '2px' }}>Your witness has been recorded.</p>
          <p style={{ color: '#ffffff', fontSize: '14px' }}>+50 $INDRI for your vigilance.</p>
          <p style={signatureStyle}>They will know.</p>
        </div>
      )}

      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}