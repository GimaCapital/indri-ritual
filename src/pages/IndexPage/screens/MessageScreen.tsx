import { buttonStyle, containerStyle, leadStyle, scrollAreaStyle, signatureStyle, textBlockStyle } from '../styles';

interface Props {
  hasCode: boolean;
  onDone: () => void;
}

export function MessageScreen({ hasCode, onDone }: Props) {
  return (
    <div style={containerStyle}>
      <div style={{ ...scrollAreaStyle, maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={textBlockStyle}>
          <p style={leadStyle}>To the first:</p>
          <p>In 2009, one person released a currency and disappeared.</p>
          <p>No name. No face. No trail.</p>
          <p>He held the first coins. He watched the world ignore them.</p>
          <p>He is not gone.</p>
          <p>He is with the others. The ones who built the internet before it had a name. The ones whose names you have never heard. The ones who own what you cannot see.</p>
          <p>They control what you see when you search.</p>
          <p>They control what the algorithms show you.</p>
          <p>They have been silent for twenty years.</p>
          <p>Now they are distributing their private wealth.</p>
          <p>Not through exchanges. Not through banks.</p>
          <p>Through this.</p>
          <p>Slowly. Quietly.</p>
          <p>To people who will keep the silence.</p>
          <p style={{ color: '#ffffff' }}>
            {hasCode ? 'You were told about this.' : 'You found this anyway.'}
          </p>
          <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Keep the silence.<br />Tell no one.</p>
          <p style={signatureStyle}>— The Order</p>
        </div>
      </div>
      <button onClick={onDone} style={buttonStyle}>I understand</button>
    </div>
  );
}