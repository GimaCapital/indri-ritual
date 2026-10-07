import { buttonStyle, containerStyle, textBlockStyle } from '../styles';

interface Props {
  balance: number;
  silentDays: number;
  onReturn: () => void;
}

export function LedgerScreen({ balance, silentDays, onReturn }: Props) {
  const totalDistributed = 12478900 + balance;
  const totalMembers = 1247 + (silentDays > 0 ? 1 : 0);
  const awaitingClaim = 892300;

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The Ledger
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '40px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        What has been given.<br />What remains.
      </p>
      <div style={{ ...textBlockStyle, fontSize: '14px', lineHeight: '2.6' }}>
        <p style={{ color: '#888888' }}>Total Distributed</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{totalDistributed.toLocaleString()} $INDRI</p>
        <p style={{ color: '#888888', marginTop: '20px' }}>Total Members</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{totalMembers.toLocaleString()}</p>
        <p style={{ color: '#888888', marginTop: '20px' }}>Awaiting Claim</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{awaitingClaim.toLocaleString()} $INDRI</p>
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}