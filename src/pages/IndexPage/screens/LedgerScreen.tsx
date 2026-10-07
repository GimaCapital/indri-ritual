import { useEffect, useState } from 'react';
import { buttonStyle, containerStyle, textBlockStyle } from '../styles';
import { api, type LedgerData } from '@/api';

interface Props {
  onReturn: () => void;
}

export function LedgerScreen({ onReturn }: Props) {
  const [data, setData] = useState<LedgerData | null>(null);

  useEffect(() => {
    api.ledger().then(setData).catch(() => {});
  }, []);

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
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.totalDistributed ?? 0).toLocaleString()} $INDRI
        </p>
        <p style={{ color: '#888888', marginTop: '20px' }}>Total Members</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.totalMembers ?? 0).toLocaleString()}
        </p>
        <p style={{ color: '#888888', marginTop: '20px' }}>Awaiting Claim</p>
        <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>
          {(data?.awaitingClaim ?? 0).toLocaleString()} $INDRI
        </p>
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}