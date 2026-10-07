import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { INVITE_GATE_DAYS } from '../constants';
import { useState } from 'react';

interface Props {
  wasInvited: boolean;
  silentDays: number;
  onReturn: () => void;
}

export function InviteScreen({ wasInvited, silentDays, onReturn }: Props) {
  const organicGateOpen = wasInvited || silentDays >= INVITE_GATE_DAYS;
  const daysRemaining = Math.max(0, INVITE_GATE_DAYS - silentDays);
  const [code, setCode] = useState('');

  const generate = () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCode(newCode);
  };

  return (
    <div style={containerStyle}>
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
          </div>
          {organicGateOpen && (
            <button onClick={generate} style={buttonStyle}>Generate Code</button>
          )}
        </>
      ) : (
        <>
          <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '6px', textTransform: 'uppercase' }}>Your Code</p>
          <p style={{ fontSize: '36px', color: '#ffffff', letterSpacing: '10px', marginTop: '30px', fontWeight: 'bold' }}>{code}</p>
          <div style={{ ...textBlockStyle, marginTop: '50px', fontSize: '12px' }}>
            <p>Valid for 24 hours.<br />Send it to one person.<br />Tell them nothing else.</p>
            <p style={{ color: '#555555' }}>They will know who sent it.</p>
          </div>
        </>
      )}
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}