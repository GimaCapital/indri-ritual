import { buttonStyle, containerStyle, textBlockStyle } from '../styles';

interface Props {
  onReturn: () => void;
}

export function First100Screen({ onReturn }: Props) {
  const first100 = Array.from({ length: 100 }, (_, i) => {
    const echo = `${String.fromCharCode(65 + (i % 26))}${i % 10}${String.fromCharCode(65 + ((i * 3) % 26))}${i % 7}${String.fromCharCode(65 + ((i * 7) % 26))}${i % 9}`;
    const days = Math.floor(Math.random() * 500) + 100;
    return { echo, days };
  });

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The First 100
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '20px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        They entered before the world knew.<br />They are remembered.
      </p>
      <div style={{
        ...textBlockStyle,
        fontSize: '11px',
        lineHeight: '1.8',
        maxHeight: '50vh',
        overflowY: 'auto',
        padding: '10px',
      }}>
        {first100.map((item, i) => (
          <p key={i} style={{ color: '#666666', margin: '2px 0' }}>
            <span style={{ color: '#444444' }}>#{i + 1}</span> — {item.echo} — {item.days} days
          </p>
        ))}
      </div>
      <button onClick={onReturn} style={buttonStyle}>Return</button>
    </div>
  );
}