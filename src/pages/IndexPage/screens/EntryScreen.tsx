import { buttonStyle, containerStyle, dimButtonStyle, inputStyle } from '../styles';

interface Props {
  code: string;
  setCode: (v: string) => void;
  onCodeSubmit: () => void;
  onNoCode: () => void;
}

export function EntryScreen({ code, setCode, onCodeSubmit, onNoCode }: Props) {
  return (
    <div style={containerStyle}>
      <img src="/indri.jpg" alt="" style={{ width: '180px', height: '140px', objectFit: 'contain' }} />
      <p style={{ marginTop: '40px', fontSize: '16px', color: '#ffffff', letterSpacing: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
        INDRI
      </p>
      <p style={{ marginTop: '12px', fontSize: '11px', color: '#666666', letterSpacing: '3px', textTransform: 'uppercase' }}>
        Tell no one
      </p>
      <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '14px', width: '300px' }}>
        <input
          type="text"
          placeholder="ENTER YOUR CODE"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={inputStyle}
        />
        <button onClick={onCodeSubmit} style={buttonStyle}>Enter</button>
        <button onClick={onNoCode} style={dimButtonStyle}>I was not told</button>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            fontSize: '9px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            border: '1px solid #222222',
            background: 'transparent',
            color: '#333333',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          [test] reset all
        </button>
      </div>
    </div>
  );
}