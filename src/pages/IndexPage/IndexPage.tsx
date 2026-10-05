// import { Section, Cell, Image, List } from '@telegram-apps/telegram-ui';
// import type { FC } from 'react';

// import { Link } from '@/components/Link/Link.tsx';
// import { Page } from '@/components/Page.tsx';

// import tonSvg from './ton.svg';

// export const IndexPage: FC = () => {
//   return (
//     <Page back={false}>
//       <List>
//         <Section
//           header="Features"
//           footer="You can use these pages to learn more about features, provided by Telegram Mini Apps and other useful projects"
//         >
//           <Link to="/ton-connect">
//             <Cell
//               before={<Image src={tonSvg} style={{ backgroundColor: '#007AFF' }}/>}
//               subtitle="Connect your TON wallet"
//             >
//               TON Connect
//             </Cell>
//           </Link>
//         </Section>
//         <Section
//           header="Application Launch Data"
//           footer="These pages help developer to learn more about current launch information"
//         >
//           <Link to="/init-data">
//             <Cell subtitle="User data, chat information, technical data">Init Data</Cell>
//           </Link>
//           <Link to="/launch-params">
//             <Cell subtitle="Platform identifier, Mini Apps version, etc.">Launch Parameters</Cell>
//           </Link>
//           <Link to="/theme-params">
//             <Cell subtitle="Telegram application palette information">Theme Parameters</Cell>
//           </Link>
//         </Section>
//       </List>
//     </Page>
//   );
// };






import { useState, useEffect } from 'react';

export function IndexPage() {
  const [isSinging, setIsSinging] = useState(false);
  const [silentDays, setSilentDays] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('indri_silent_days');
    if (saved) setSilentDays(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    localStorage.setItem('indri_silent_days', silentDays.toString());
  }, [silentDays]);

  const makeIndriSing = () => {
    if (isSinging) return;
    setIsSinging(true);

    const song = "ooooh... ahhhh... eeeee... ooooh... hmmmm... woooh... ahhhh... eeeee... ooooh... hmmmm... woooh... ahhhh... eeeee... ooooh... hmmmm... woooh... ahhhh... eeeee... ooooh... hmmmm... woooh... ahhhh... eeeee... ooooh... hmmmm...";
    const utterance = new SpeechSynthesisUtterance(song);
    utterance.rate = 0.6;
    utterance.pitch = 0.8;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Brian') ||
      v.name.includes('Guy') ||
      v.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => {
      setIsSinging(false);
      setSilentDays(prev => prev + 1);
    };

    utterance.onerror = (e) => {
      console.error("The Indri fell silent:", e);
      setIsSinging(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'monospace',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Top left: INDRI */}
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        fontSize: '14px',
        color: '#ffffff',
        letterSpacing: '5px',
        textTransform: 'uppercase',
        fontWeight: 'bold'
      }}>
        INDRI
      </div>

      {/* Top right: silent counter */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        fontSize: '14px',
        color: '#ffffff',
        letterSpacing: '2px',
        fontWeight: 'bold'
      }}>
        🤫 {silentDays}
      </div>

      {/* The sigil */}
      <img
        src="/indri.jpg"
        alt=""
        style={{
          width: '200px',
          height: '200px',
          objectFit: 'contain',
          filter: isSinging
            ? 'drop-shadow(0 0 50px rgba(180, 180, 255, 1)) brightness(1.6) contrast(1.2)'
            : 'drop-shadow(0 0 20px rgba(150, 150, 200, 0.5)) brightness(1.4) contrast(1.1)',
          transition: 'all 1.5s ease-in-out',
          transform: isSinging ? 'scale(1.06)' : 'scale(1)',
        }}
      />

      {/* The rule */}
      <p style={{
        marginTop: '36px',
        fontSize: '12px',
        color: '#cccccc',
        letterSpacing: '4px',
        textTransform: 'uppercase'
      }}>
        Tell no one
      </p>

      {/* Sing button */}
      <button
        onClick={makeIndriSing}
        disabled={isSinging}
        style={{
          marginTop: '28px',
          padding: '14px 48px',
          fontSize: '13px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          borderRadius: '0px',
          border: '2px solid #ffffff',
          background: isSinging ? '#1a1a1a' : 'transparent',
          color: isSinging ? '#888888' : '#ffffff',
          cursor: isSinging ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s'
        }}
      >
        {isSinging ? 'Singing...' : 'Sing'}
      </button>

      {/* Hint */}
      <p style={{
        marginTop: '22px',
        fontSize: '11px',
        color: '#888888',
        letterSpacing: '1px'
      }}>
        The Indri rests after each song
      </p>
    </div>
  );
}