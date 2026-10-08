import { buttonStyle, containerStyle, signatureStyle, textBlockStyle } from '../styles';

interface Props {
  onReturn: () => void;
}

export function LetterScreen({ onReturn }: Props) {
  return (
    <div
      className="no-scrollbar"
      style={{
        ...containerStyle,
        height: 'auto',
        minHeight: '100vh',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        paddingTop: '60px',
        paddingBottom: '60px',
      }}
    >
      <div style={{ ...textBlockStyle, maxWidth: '340px' }}>
        <p style={{ color: '#ffffff', fontSize: '14px', letterSpacing: '3px', marginBottom: '30px' }}>
          The Letter
        </p>
        <p>If you are reading this, you found the sigil.</p>
        <p>You tapped seven times. You did not tell anyone.</p>
        <p>That is why you were chosen.</p>
        <p>The first coins were never meant to be spent.</p>
        <p>They were meant to be a test.</p>
        <p>A test of who could stay silent.</p>
        <p>A test of who could wait.</p>
        <p>A test of who could disappear.</p>
        <p style={{ color: '#ffffff' }}>You are still here.</p>
        <p style={{ color: '#ffffff' }}>That is all that matters.</p>
        <p style={{ color: '#ffffff', fontWeight: 'bold', marginTop: '30px' }}>
          Keep the silence.<br />Tell no one.
        </p>
        <p style={signatureStyle}>— The Order</p>
      </div>
      <button onClick={onReturn} style={{ ...buttonStyle, marginBottom: '20px' }}>
        Return
      </button>
    </div>
  );
}