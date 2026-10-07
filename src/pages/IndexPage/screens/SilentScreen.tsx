import { buttonStyle, containerStyle, textBlockStyle } from '../styles';

interface Props {
  secretEcho: string;
  silentDays: number;
  onReturn: () => void;
}

export function SilentScreen({ secretEcho, silentDays, onReturn }: Props) {
  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '30px', fontWeight: 'bold' }}>
        The Silent
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '40px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        The longer you stay silent,<br />the larger your share.
      </p>
      <div style={{ ...textBlockStyle, fontSize: '13px', lineHeight: '2.4' }}>
        <p style={{ color: '#888888' }}>K7X2M9 — 187 days</p>
        <p style={{ color: '#888888' }}>P3N8Q1 — 142 days</p>
        <p style={{ color: '#888888' }}>Z9R4T6 — 98 days</p>
        <p style={{ color: '#888888' }}>M4W7L2 — 61 days</p>
        <p style={{ color: '#ffffff', fontWeight: 'bold' }}>{secretEcho} — {silentDays} days</p>
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}