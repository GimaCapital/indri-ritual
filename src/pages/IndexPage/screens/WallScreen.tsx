import { buttonStyle, containerStyle } from '../styles';

interface Props {
  wallMarks: number[];
  hasMarkedToday: boolean;
  onAddMark: () => void;
  onResetMark: () => void;
  onReturn: () => void;
}

export function WallScreen({ wallMarks, hasMarkedToday, onAddMark, onResetMark, onReturn }: Props) {
  return (
    <div style={containerStyle}>
      <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
        The Quiet Wall
      </p>
      <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '30px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
        One trace per day.<br />No names. No words.
      </p>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        justifyContent: 'center',
        maxWidth: '340px',
        maxHeight: '200px',
        overflowY: 'auto',
        padding: '10px',
      }}>
        {wallMarks.map((_, i) => (
          <div key={i} style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#333333',
            border: '1px solid #444444',
          }} />
        ))}
        {wallMarks.length === 0 && (
          <p style={{ color: '#333333', fontSize: '12px' }}>The wall is empty.</p>
        )}
      </div>
      <p style={{ marginTop: '20px', fontSize: '11px', color: '#555555' }}>
        {wallMarks.length} {wallMarks.length === 1 ? 'trace' : 'traces'}
      </p>
      <button
        onClick={onAddMark}
        disabled={hasMarkedToday}
        style={{
          ...buttonStyle,
          opacity: hasMarkedToday ? 0.3 : 1,
        }}
      >
        {hasMarkedToday ? 'Traced Today' : 'Add Trace'}
      </button>
      <button onClick={() => { onResetMark(); onReturn(); }} style={buttonStyle}>Return</button>
    </div>
  );
}