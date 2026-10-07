import { buttonStyle, containerStyle, dimButtonStyle } from '../styles';

interface Props {
  onAccept: () => void;
  onReject: () => void;
}

export function VowScreen({ onAccept, onReject }: Props) {
  return (
    <div style={containerStyle}>
      <img src="/indri.jpg" alt="" style={{ width: '180px', height: '140px', objectFit: 'contain' }} />
      <p style={{ marginTop: '50px', fontSize: '18px', color: '#ffffff', letterSpacing: '4px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
        Will you keep the silence?
      </p>
      <p style={{ marginTop: '20px', fontSize: '12px', color: '#666666', letterSpacing: '2px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        The wealth is real.<br />The distribution has begun.<br />The only price is your silence.
      </p>
      <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <button onClick={onAccept} style={buttonStyle}>I will</button>
        <button onClick={onReject} style={dimButtonStyle}>I won't</button>
      </div>
    </div>
  );
}