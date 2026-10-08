import { buttonStyle, containerStyle, scrollAreaStyle, signatureStyle, textBlockStyle } from '../styles';

interface Props {
  entryNumber: number;
  invitedBy?: string;
  onDone: () => void;
}

export function PersonalScreen({ entryNumber, invitedBy, onDone }: Props) {
  return (
    <div className="no-scrollbar" style={{ ...containerStyle, height: 'auto', minHeight: '100vh', justifyContent: 'center', overflowY: 'auto', paddingTop: '48px', paddingBottom: '60px' }}>
      <div style={{ ...scrollAreaStyle, maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={textBlockStyle}>
          <p>Someone trusted you enough<br />to share their Secret Echo.</p>
          <p>They are watching now.</p>
          <p>Not you. The one who gave you the code.</p>
          <p>If you break the silence, they lose their share.</p>
          <p>Their loss becomes someone else's gain.</p>
          <p>The distribution does not pause for anyone.</p>
          <p style={{ color: '#ffffff', fontSize: '16px', letterSpacing: '2px' }}>You are the {entryNumber}th to enter.</p>
          {invitedBy && <p style={{ color: '#555555', fontSize: '11px', letterSpacing: '3px', marginTop: '20px' }}>Invited by an unseen hand.</p>}
          <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Keep the silence.<br />Tell no one.</p>
          <p style={signatureStyle}>— The Order</p>
        </div>
      </div>
      <button onClick={onDone} style={buttonStyle}>I understand</button>
    </div>
  );
}