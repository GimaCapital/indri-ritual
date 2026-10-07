import { buttonStyle, containerStyle, leadStyle, scrollAreaStyle, textBlockStyle } from '../styles';

interface Props {
  onDone: () => void;
}

export function RuleScreen({ onDone }: Props) {
  return (
    <div style={containerStyle}>
      <div style={{ ...scrollAreaStyle, maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={textBlockStyle}>
          <p style={leadStyle}>One rule:</p>
          <p style={{ color: '#ffffff', fontSize: '14px' }}>Do not post about this on any public platform.</p>
          <p>No tweets.<br />No Telegram groups.<br />No Discord.<br />No Reddit.<br />No screenshots with captions.</p>
          <p>You may share the sigil.<br />You may share a clip with no words.<br />Nothing else.</p>
          <p style={{ color: '#ffffff' }}>The ones behind this control what you see online.</p>
          <p>Every search. Every feed. Every recommendation.</p>
          <p>They will know.</p>
          <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Tell no one.</p>
        </div>
      </div>
      <button onClick={onDone} style={buttonStyle}>I understand</button>
    </div>
  );
}