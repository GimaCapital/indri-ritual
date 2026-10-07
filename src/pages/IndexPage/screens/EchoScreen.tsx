import { buttonStyle, containerStyle, signatureStyle, textBlockStyle } from '../styles';

interface Props {
  secretEcho: string;
  onDone: () => void;
}

export function EchoScreen({ secretEcho, onDone }: Props) {
  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '6px', textTransform: 'uppercase' }}>
        Your Secret Echo
      </p>
      <p style={{ fontSize: '36px', color: '#ffffff', letterSpacing: '10px', marginTop: '30px', fontWeight: 'bold' }}>
        {secretEcho}
      </p>
      <div style={{ ...textBlockStyle, marginTop: '50px', fontSize: '12px' }}>
        <p>This is yours.<br />You did not choose it.<br />You cannot change it.</p>
        <p style={{ color: '#ffffff' }}>It is how they know you.</p>
        <p>When the distribution happens, this is the name you will claim it under.</p>
        <p>It cannot be bought. It cannot be sold. It cannot be forged.</p>
      </div>
      <button onClick={onDone} style={buttonStyle}>Continue</button>
    </div>
  );
}