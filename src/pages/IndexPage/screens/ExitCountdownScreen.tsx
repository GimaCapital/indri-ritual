import { containerStyle } from '../styles';

interface Props {
  countdown: number;
}

export function ExitCountdownScreen({ countdown }: Props) {
  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '4px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.8' }}>
        Then you were never here.
      </p>
      <p style={{ fontSize: '72px', color: '#ffffff', fontWeight: 'bold', letterSpacing: '10px', marginTop: '40px', marginBottom: 0 }}>
        {countdown > 0 ? countdown : 0}
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '4px', marginTop: '20px', textTransform: 'uppercase' }}>
        Closing
      </p>
    </div>
  );
}