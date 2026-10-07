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



// import { useState, useEffect, useRef } from 'react';

// type Screen =
//   | 'entry'
//   | 'message'
//   | 'personal'
//   | 'vow'
//   | 'rule'
//   | 'echo'
//   | 'main'
//   | 'silent'
//   | 'witness'
//   | 'invite'
//   | 'disappeared'
//   | 'ledger'
//   | 'wall'
//   | 'first100'
//   | 'letter';

// type Rank = 'Initiate' | 'Keeper' | 'Silent One' | 'Unseen';

// function generateEcho(): string {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// }

// function formatTimeRemaining(ms: number): string {
//   const totalSeconds = Math.floor(ms / 1000);
//   const hours = Math.floor(totalSeconds / 3600);
//   const minutes = Math.floor((totalSeconds % 3600) / 60);
//   const seconds = totalSeconds % 60;
//   return `${hours}h ${minutes}m ${seconds}s`;
// }

// function getRank(days: number): Rank {
//   if (days >= 90) return 'Unseen';
//   if (days >= 30) return 'Silent One';
//   if (days >= 7) return 'Keeper';
//   return 'Initiate';
// }

// function getMultiplier(days: number): number {
//   if (days >= 90) return 500;
//   if (days >= 30) return 250;
//   if (days >= 7) return 150;
//   return 100;
// }

// function getMilestoneMessage(days: number): string | null {
//   if (days === 7) return 'You are now a Keeper. The silence deepens.';
//   if (days === 30) return 'You are now a Silent One. They have noticed.';
//   if (days === 90) return 'You are now Unseen. You were never here.';
//   if (days === 365) return 'One year. You are a myth now.';
//   return null;
// }

// const ORDER_VOICES = [
//   'They are watching.',
//   'The distribution continues.',
//   'Silence is the only currency.',
//   'You were never here.',
//   'The ones behind this know.',
//   'Tell no one.',
//   'Your echo is being recorded.',
//   'The ledger grows.',
//   'Another has disappeared.',
//   'The wall remembers nothing.',
// ];

// const WATCHING_MESSAGES = [
//   'K7X2M9 just stayed silent',
//   'P3N8Q1 extended the silence',
//   'A new echo was recorded',
//   'Z9R4T6 is watching',
//   'M4W7L2 received 250 $INDRI',
//   'Someone broke the silence',
//   'The ledger was updated',
//   'A witness submitted evidence',
//   'The first 100 are remembered',
//   'Another invitation was sent',
// ];

// const DISAPPEARED_ECHOES = [
//   { echo: 'X2K9P4', days: 47, reason: 'Public post' },
//   { echo: 'M7W3L8', days: 112, reason: 'Screenshot shared' },
//   { echo: 'Q1N6R2', days: 8, reason: 'Tweeted' },
//   { echo: 'T4Z8Y1', days: 203, reason: 'Told a friend' },
//   { echo: 'B5C9D3', days: 31, reason: 'Discord leak' },
//   { echo: 'F6G2H7', days: 89, reason: 'Reddit post' },
//   { echo: 'J8K4L1', days: 15, reason: 'Public mention' },
//   { echo: 'N3P7Q5', days: 156, reason: 'Telegram group' },
// ];

// export function IndexPage() {
//   const [screen, setScreen] = useState<Screen>('entry');
//   const [rejected, setRejected] = useState(false);
//   const [hasCode, setHasCode] = useState(false);
//   const [wasInvited, setWasInvited] = useState(false);
//   const [code, setCode] = useState('');
//   const [secretEcho, setSecretEcho] = useState('');
//   const [entryNumber, setEntryNumber] = useState(0);
//   const [silentDays, setSilentDays] = useState(0);
//   const [balance, setBalance] = useState(0);
//   const [isStaying, setIsStaying] = useState(false);
//   const [staySeconds, setStaySeconds] = useState(0);
//   const [rewardMessage, setRewardMessage] = useState('');
//   const [inviteCode, setInviteCode] = useState('');
//   const [hasInvitedToday, setHasInvitedToday] = useState(false);
//   const [lastStayAt, setLastStayAt] = useState<number>(0);
//   const [now, setNow] = useState<number>(Date.now());

//   const [witnessLink, setWitnessLink] = useState('');
//   const [witnessEcho, setWitnessEcho] = useState('');
//   const [witnessNote, setWitnessNote] = useState('');
//   const [witnessSubmitted, setWitnessSubmitted] = useState(false);

//   // New state for features
//   const [sigilTaps, setSigilTaps] = useState(0);
//   const [orderVoice, setOrderVoice] = useState(ORDER_VOICES[0]);
//   const [watchingMessage, setWatchingMessage] = useState(WATCHING_MESSAGES[0]);
//   const [flashNumber, setFlashNumber] = useState<string | null>(null);
//   const [wallMarks, setWallMarks] = useState<number[]>([]);
//   const [hasMarkedToday, setHasMarkedToday] = useState(false);
//   const [letterRevealed, setLetterRevealed] = useState(false);
//   const [exitCountdown, setExitCountdown] = useState<number | null>(null);
//   const [signalCooldown, setSignalCooldown] = useState(false);

//   const intervalRef = useRef<number | null>(null);
//   const holdTimeoutRef = useRef<number | null>(null);
//   const hasEarnedRef = useRef(false);
//   const isStayingRef = useRef(false);
//   const stopStayRef = useRef<() => void>(() => {});
//   const orderVoiceRef = useRef<number | null>(null);
//   const watchingRef = useRef<number | null>(null);
//   const sigilTapTimeoutRef = useRef<number | null>(null);

//   const COOLDOWN_MS = 2 * 60 * 60 * 1000;
//   const INVITE_GATE_DAYS = 7;

//   useEffect(() => {
//     const savedEcho = localStorage.getItem('indri_echo');
//     const savedVow = localStorage.getItem('indri_vow');
//     const savedDays = localStorage.getItem('indri_silent_days');
//     const savedEntry = localStorage.getItem('indri_entry_number');
//     const savedBalance = localStorage.getItem('indri_balance');
//     const savedLastStay = localStorage.getItem('indri_last_stay');
//     const savedInvited = localStorage.getItem('indri_was_invited');
//     const savedWall = localStorage.getItem('indri_wall_marks');
//     const savedMarkedToday = localStorage.getItem('indri_marked_today');

//     if (savedEcho && savedVow === 'true') {
//       setSecretEcho(savedEcho);
//       setSilentDays(savedDays ? parseInt(savedDays, 10) : 0);
//       setEntryNumber(savedEntry ? parseInt(savedEntry, 10) : 0);
//       setBalance(savedBalance ? parseInt(savedBalance, 10) : 0);
//       setLastStayAt(savedLastStay ? parseInt(savedLastStay, 10) : 0);
//       setWasInvited(savedInvited === 'true');
//       setWallMarks(savedWall ? JSON.parse(savedWall) : []);
//       setHasMarkedToday(savedMarkedToday === 'true');
//       setScreen('main');
//     }
//   }, []);

//   useEffect(() => {
//     if (screen !== 'main') return;
//     if (now - lastStayAt >= COOLDOWN_MS) return;
//     const tick = setInterval(() => setNow(Date.now()), 1000);
//     return () => clearInterval(tick);
//   }, [screen, lastStayAt, now]);

//   useEffect(() => {
//     isStayingRef.current = isStaying;
//   }, [isStaying]);

//   // Order's Voice rotation
//   useEffect(() => {
//     if (screen !== 'main') return;
//     orderVoiceRef.current = window.setInterval(() => {
//       setOrderVoice(ORDER_VOICES[Math.floor(Math.random() * ORDER_VOICES.length)]);
//     }, 8000);
//     return () => {
//       if (orderVoiceRef.current) clearInterval(orderVoiceRef.current);
//     };
//   }, [screen]);

//   // Watching messages rotation
//   useEffect(() => {
//     if (screen !== 'main') return;
//     watchingRef.current = window.setInterval(() => {
//       setWatchingMessage(WATCHING_MESSAGES[Math.floor(Math.random() * WATCHING_MESSAGES.length)]);
//     }, 5000);
//     return () => {
//       if (watchingRef.current) clearInterval(watchingRef.current);
//     };
//   }, [screen]);

//   // Exit countdown
//   useEffect(() => {
//   if (exitCountdown === null) return;
//   if (exitCountdown <= 0) {
//     window.close();
//     setTimeout(() => {
//       localStorage.clear();
//       window.location.reload();
//     }, 500);
//     return;
//   }
//   const timer = setTimeout(() => {
//     setExitCountdown(exitCountdown - 1);
//   }, 1000);
//   return () => clearTimeout(timer);
// }, [exitCountdown]);

//   const handleCodeSubmit = () => {
//     if (code.trim().length > 0) {
//       setHasCode(true);
//       setWasInvited(true);
//       localStorage.setItem('indri_was_invited', 'true');
//       setScreen('message');
//     }
//   };

//   const handleNoCode = () => {
//     setHasCode(false);
//     setWasInvited(false);
//     localStorage.setItem('indri_was_invited', 'false');
//     setScreen('message');
//   };

//   const handleMessageDone = () => {
//     if (hasCode) {
//       setScreen('personal');
//     } else {
//       setScreen('vow');
//     }
//   };

//   const handlePersonalDone = () => {
//     setScreen('vow');
//   };

//   // const handleVow = (accepted: boolean) => {
//   //   if (accepted) {
//   //     setScreen('rule');
//   //   } else {
//   //     setExitCountdown(4);
//   //   }
//   // };

//   const handleVow = (accepted: boolean) => {
//   if (accepted) {
//     setScreen('rule');
//   } else {
//     setExitCountdown(4);
//   }
// };

//   const handleRuleDone = () => {
//     const newEcho = generateEcho();
//     const newEntry = Math.floor(Math.random() * 1000) + 100;
//     setSecretEcho(newEcho);
//     setEntryNumber(newEntry);
//     localStorage.setItem('indri_echo', newEcho);
//     localStorage.setItem('indri_entry_number', newEntry.toString());
//     localStorage.setItem('indri_vow', 'true');
//     setScreen('echo');
//   };

//   const handleEchoDone = () => {
//     setScreen('main');
//   };

//   const showFlashNumber = () => {
//     const num = Math.floor(Math.random() * 9000) + 1000;
//     setFlashNumber(num.toString());
//     setTimeout(() => setFlashNumber(null), 1000);
//   };

//   const awardTokens = () => {
//     const multiplier = getMultiplier(silentDays);
//     const newBalance = balance + multiplier;
//     const newDays = silentDays + 1;
//     const newLastStay = Date.now();

//     setSilentDays(newDays);
//     setBalance(newBalance);
//     setLastStayAt(newLastStay);

//     localStorage.setItem('indri_silent_days', newDays.toString());
//     localStorage.setItem('indri_balance', newBalance.toString());
//     localStorage.setItem('indri_last_stay', newLastStay.toString());

//     hasEarnedRef.current = true;

//     const milestone = getMilestoneMessage(newDays);
//     if (milestone) {
//       setRewardMessage(milestone);
//       setTimeout(() => setRewardMessage(''), 5000);
//     } else {
//       setRewardMessage(`+${multiplier} $INDRI`);
//       setTimeout(() => setRewardMessage(''), 3000);
//     }

//     // Random number flash
//     if (Math.random() < 0.3) {
//       setTimeout(() => showFlashNumber(), 1500);
//     }
//   };

//   const startStay = () => {
//     if (isStaying || holdTimeoutRef.current) return;
//     if (now - lastStayAt < COOLDOWN_MS) return;
//     hasEarnedRef.current = false;

//     holdTimeoutRef.current = window.setTimeout(() => {
//       holdTimeoutRef.current = null;
//       setIsStaying(true);
//       setStaySeconds(0);

//       intervalRef.current = window.setInterval(() => {
//         setStaySeconds(prev => {
//           const next = prev + 1;
//           if (next >= 90) {
//             if (intervalRef.current) clearInterval(intervalRef.current);
//             intervalRef.current = null;
//             setIsStaying(false);
//             if (!hasEarnedRef.current) {
//               awardTokens();
//             }
//             return next;
//           }
//           return next;
//         });
//       }, 1000);
//     }, 200);
//   };

//   const stopStay = () => {
//     if (holdTimeoutRef.current) {
//       clearTimeout(holdTimeoutRef.current);
//       holdTimeoutRef.current = null;
//     }

//     if (intervalRef.current) {
//       clearInterval(intervalRef.current);
//       intervalRef.current = null;
//     }

//     if (isStaying && staySeconds >= 30 && !hasEarnedRef.current) {
//       awardTokens();
//     } else if (isStaying && staySeconds < 30 && staySeconds > 0) {
//       setRewardMessage('You left too soon.');
//       setTimeout(() => setRewardMessage(''), 3000);
//     }

//     setIsStaying(false);
//     setStaySeconds(0);
//   };

//   useEffect(() => {
//     stopStayRef.current = stopStay;
//   }, [stopStay]);

//   useEffect(() => {
//     const handleGlobalUp = () => {
//       if (isStayingRef.current || holdTimeoutRef.current) {
//         stopStayRef.current();
//       }
//     };
//     window.addEventListener('mouseup', handleGlobalUp);
//     window.addEventListener('touchend', handleGlobalUp);
//     return () => {
//       window.removeEventListener('mouseup', handleGlobalUp);
//       window.removeEventListener('touchend', handleGlobalUp);
//     };
//   }, []);

//   const generateInvite = () => {
//     if (hasInvitedToday) return;
//     const newCode = generateEcho();
//     setInviteCode(newCode);
//     setHasInvitedToday(true);
//   };

//   const submitWitness = () => {
//     if (witnessLink.trim().length === 0) return;

//     const newBalance = balance + 50;
//     setBalance(newBalance);
//     localStorage.setItem('indri_balance', newBalance.toString());

//     setWitnessSubmitted(true);
//   };

//   const resetWitness = () => {
//     setWitnessLink('');
//     setWitnessEcho('');
//     setWitnessNote('');
//     setWitnessSubmitted(false);
//   };

//   const clearCooldown = () => {
//     setLastStayAt(0);
//     localStorage.removeItem('indri_last_stay');
//     setNow(Date.now());
//   };

//   const handleSigilTap = () => {
//     if (sigilTapTimeoutRef.current) {
//       clearTimeout(sigilTapTimeoutRef.current);
//     }

//     const newTaps = sigilTaps + 1;
//     setSigilTaps(newTaps);

//     if (newTaps >= 7) {
//       setSigilTaps(0);
//       setLetterRevealed(true);
//       setScreen('letter');
//       return;
//     }

//     sigilTapTimeoutRef.current = window.setTimeout(() => {
//       setSigilTaps(0);
//     }, 2000);
//   };

//   const handleSignal = () => {
//     if (signalCooldown) return;
//     const newBalance = balance + 10;
//     setBalance(newBalance);
//     localStorage.setItem('indri_balance', newBalance.toString());
//     setSignalCooldown(true);
//     setRewardMessage('Signal sent. +10 $INDRI');
//     setTimeout(() => {
//       setRewardMessage('');
//       setSignalCooldown(false);
//     }, 3000);
//   };

//   const addWallMark = () => {
//     if (hasMarkedToday) return;
//     const newMarks = [...wallMarks, Date.now()];
//     setWallMarks(newMarks);
//     setHasMarkedToday(true);
//     localStorage.setItem('indri_wall_marks', JSON.stringify(newMarks));
//     localStorage.setItem('indri_marked_today', 'true');
//   };

//   const resetWallMark = () => {
//     setHasMarkedToday(false);
//     localStorage.removeItem('indri_marked_today');
//   };

//   const eyesOpen = isStaying ? Math.min(staySeconds / 30, 1) : 0;
//   const cooldownRemaining = Math.max(0, COOLDOWN_MS - (now - lastStayAt));
//   const isOnCooldown = cooldownRemaining > 0;
//   const currentRank = getRank(silentDays);
//   const currentMultiplier = getMultiplier(silentDays);

//   // SCREEN: EXIT COUNTDOWN
//     // SCREEN: EXIT COUNTDOWN
//   if (exitCountdown !== null) {
//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '4px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.8' }}>
//           Then you were never here.
//         </p>
//         <p style={{ fontSize: '72px', color: '#ffffff', fontWeight: 'bold', letterSpacing: '10px', marginTop: '40px', marginBottom: 0 }}>
//           {exitCountdown > 0 ? exitCountdown : 0}
//         </p>
//         <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '4px', marginTop: '20px', textTransform: 'uppercase' }}>
//           Closing
//         </p>
//       </div>
//     );
//   }

//   // SCREEN: REJECTED
//   if (rejected) {
//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '16px', color: '#ffffff', letterSpacing: '4px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.8' }}>
//           Then you were never here.
//         </p>
//         <p style={{ fontSize: '12px', color: '#555555', letterSpacing: '2px', marginTop: '30px', textAlign: 'center' }}>
//           Close this window.
//         </p>
//       </div>
//     );
//   }

//   // SCREEN: ENTRY
//   if (screen === 'entry') {
//     return (
//       <div style={containerStyle}>
//         <img src="/indri.jpg" alt="" style={{
//           width: '180px', height: '140px', objectFit: 'contain',
//         }} />
//         <p style={{ marginTop: '40px', fontSize: '16px', color: '#ffffff', letterSpacing: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>
//           INDRI
//         </p>
//         <p style={{ marginTop: '12px', fontSize: '11px', color: '#666666', letterSpacing: '3px', textTransform: 'uppercase' }}>
//           Tell no one
//         </p>
//         <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '14px', width: '300px' }}>
//           <input
//             type="text"
//             placeholder="ENTER YOUR CODE"
//             value={code}
//             onChange={(e) => setCode(e.target.value.toUpperCase())}
//             style={inputStyle}
//           />
//           <button onClick={handleCodeSubmit} style={buttonStyle}>Enter</button>
//           <button onClick={handleNoCode} style={dimButtonStyle}>I was not told</button>
//           <button
//             onClick={() => {
//               localStorage.clear();
//               window.location.reload();
//             }}
//             style={{
//               marginTop: '20px',
//               padding: '8px 16px',
//               fontSize: '9px',
//               letterSpacing: '2px',
//               textTransform: 'uppercase',
//               border: '1px solid #222222',
//               background: 'transparent',
//               color: '#333333',
//               cursor: 'pointer',
//               fontFamily: 'inherit',
//             }}
//           >
//             [test] reset all
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // SCREEN: MESSAGE (scrollable)
//   if (screen === 'message') {
//     return (
//       <div style={containerStyle}>
//         <div style={{ ...scrollAreaStyle, maxHeight: '60vh', overflowY: 'auto' }}>
//           <div style={textBlockStyle}>
//             <p style={leadStyle}>To the first:</p>
//             <p>In 2009, one person released a currency and disappeared.</p>
//             <p>No name. No face. No trail.</p>
//             <p>He held the first coins. He watched the world ignore them.</p>
//             <p>He is not gone.</p>
//             <p>He is with the others. The ones who built the internet before it had a name. The ones whose names you have never heard. The ones who own what you cannot see.</p>
//             <p>They control what you see when you search.</p>
//             <p>They control what the algorithms show you.</p>
//             <p>They have been silent for twenty years.</p>
//             <p>Now they are distributing their private wealth.</p>
//             <p>Not through exchanges. Not through banks.</p>
//             <p>Through this.</p>
//             <p>Slowly. Quietly.</p>
//             <p>To people who will keep the silence.</p>
//             <p style={{ color: '#ffffff' }}>
//               {hasCode ? 'You were told about this.' : 'You found this anyway.'}
//             </p>
//             <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Keep the silence.<br />Tell no one.</p>
//             <p style={signatureStyle}>— The Order</p>
//           </div>
//         </div>
//         <button onClick={handleMessageDone} style={buttonStyle}>I understand</button>
//       </div>
//     );
//   }

//   // SCREEN: PERSONAL MESSAGE (scrollable)
//   if (screen === 'personal') {
//     return (
//       <div style={containerStyle}>
//         <div style={{ ...scrollAreaStyle, maxHeight: '60vh', overflowY: 'auto' }}>
//           <div style={textBlockStyle}>
//             <p>Someone trusted you enough<br />to share their Secret Echo.</p>
//             <p>They are watching now.</p>
//             <p>Not you. The one who gave you the code.</p>
//             <p>If you break the silence, they lose their share.</p>
//             <p>Their loss becomes someone else's gain.</p>
//             <p>The distribution does not pause for anyone.</p>
//             <p style={{ color: '#ffffff', fontSize: '16px', letterSpacing: '2px' }}>You are the {entryNumber}th to enter.</p>
//             <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Keep the silence.<br />Tell no one.</p>
//             <p style={signatureStyle}>— The Order</p>
//           </div>
//         </div>
//         <button onClick={handlePersonalDone} style={buttonStyle}>I understand</button>
//       </div>
//     );
//   }

//   // SCREEN: VOW
//   if (screen === 'vow') {
//     return (
//       <div style={containerStyle}>
//         <img src="/indri.jpg" alt="" style={{
//           width: '180px', height: '140px', objectFit: 'contain',
//         }} />
//         <p style={{ marginTop: '50px', fontSize: '18px', color: '#ffffff', letterSpacing: '4px', textAlign: 'center', maxWidth: '320px', lineHeight: '1.6' }}>
//           Will you keep the silence?
//         </p>
//         <p style={{ marginTop: '20px', fontSize: '12px', color: '#666666', letterSpacing: '2px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
//           The wealth is real.<br />The distribution has begun.<br />The only price is your silence.
//         </p>
//         <div style={{ marginTop: '50px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
//           <button onClick={() => handleVow(true)} style={buttonStyle}>I will</button>
//           <button onClick={() => handleVow(false)} style={dimButtonStyle}>I won't</button>
//         </div>
//       </div>
//     );
//   }

//   // SCREEN: RULE (scrollable)
//   if (screen === 'rule') {
//     return (
//       <div style={containerStyle}>
//         <div style={{ ...scrollAreaStyle, maxHeight: '60vh', overflowY: 'auto' }}>
//           <div style={textBlockStyle}>
//             <p style={leadStyle}>One rule:</p>
//             <p style={{ color: '#ffffff', fontSize: '14px' }}>Do not post about this on any public platform.</p>
//             <p>No tweets.<br />No Telegram groups.<br />No Discord.<br />No Reddit.<br />No screenshots with captions.</p>
//             <p>You may share the sigil.<br />You may share a clip with no words.<br />Nothing else.</p>
//             <p style={{ color: '#ffffff' }}>The ones behind this control what you see online.</p>
//             <p>Every search. Every feed. Every recommendation.</p>
//             <p>They will know.</p>
//             <p style={{ color: '#ffffff', fontWeight: 'bold' }}>Tell no one.</p>
//           </div>
//         </div>
//         <button onClick={handleRuleDone} style={buttonStyle}>I understand</button>
//       </div>
//     );
//   }

//   // SCREEN: ECHO
//   if (screen === 'echo') {
//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '6px', textTransform: 'uppercase' }}>
//           Your Secret Echo
//         </p>
//         <p style={{ fontSize: '36px', color: '#ffffff', letterSpacing: '10px', marginTop: '30px', fontWeight: 'bold' }}>
//           {secretEcho}
//         </p>
//         <div style={{ ...textBlockStyle, marginTop: '50px', fontSize: '12px' }}>
//           <p>This is yours.<br />You did not choose it.<br />You cannot change it.</p>
//           <p style={{ color: '#ffffff' }}>It is how they know you.</p>
//           <p>When the distribution happens, this is the name you will claim it under.</p>
//           <p>It cannot be bought. It cannot be sold. It cannot be forged.</p>
//         </div>
//         <button onClick={handleEchoDone} style={buttonStyle}>Continue</button>
//       </div>
//     );
//   }

//   // SCREEN: THE SILENT
//   if (screen === 'silent') {
//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '30px', fontWeight: 'bold' }}>
//           The Silent
//         </p>
//         <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '40px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
//           The longer you stay silent,<br />the larger your share.
//         </p>
//         <div style={{ ...textBlockStyle, fontSize: '13px', lineHeight: '2.4' }}>
//           <p style={{ color: '#888888' }}>K7X2M9 — 187 days</p>
//           <p style={{ color: '#888888' }}>P3N8Q1 — 142 days</p>
//           <p style={{ color: '#888888' }}>Z9R4T6 — 98 days</p>
//           <p style={{ color: '#888888' }}>M4W7L2 — 61 days</p>
//           <p style={{ color: '#ffffff', fontWeight: 'bold' }}>{secretEcho} — {silentDays} days</p>
//         </div>
//         <button onClick={() => setScreen('main')} style={buttonStyle}>Return</button>
//       </div>
//     );
//   }

//   // SCREEN: WITNESS
//   if (screen === 'witness') {
//     return (
//       <div style={containerStyle}>
//         <div style={textBlockStyle}>
//           <p style={{ fontSize: '14px', letterSpacing: '6px', textTransform: 'uppercase', color: '#ffffff', fontWeight: 'bold' }}>
//             Witness a Breach
//           </p>
//           <p>You saw a member speak publicly.</p>
//           <p>They are now excluded from the distribution.</p>
//           <p>Submit evidence.<br />They will be forgotten.<br />You will be rewarded.</p>
//           <p style={{ color: '#ffffff' }}>Their share becomes yours.</p>
//           <p style={signatureStyle}>They will know.</p>
//         </div>

//         {!witnessSubmitted ? (
//           <div style={{ marginTop: '30px', width: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
//             <input
//               type="text"
//               placeholder="LINK TO THE POST"
//               value={witnessLink}
//               onChange={(e) => setWitnessLink(e.target.value)}
//               style={inputStyle}
//             />
//             <input
//               type="text"
//               placeholder="THEIR SECRET ECHO (IF KNOWN)"
//               value={witnessEcho}
//               onChange={(e) => setWitnessEcho(e.target.value.toUpperCase())}
//               style={inputStyle}
//             />
//             <textarea
//               placeholder="DESCRIBE WHAT YOU SAW"
//               value={witnessNote}
//               onChange={(e) => setWitnessNote(e.target.value)}
//               style={{ ...inputStyle, height: '90px', resize: 'none', fontFamily: 'monospace' }}
//             />
//             <button
//               onClick={submitWitness}
//               disabled={witnessLink.trim().length === 0}
//               style={{
//                 ...buttonStyle,
//                 marginTop: '10px',
//                 opacity: witnessLink.trim().length === 0 ? 0.3 : 1,
//               }}
//             >
//               Submit Witness
//             </button>
//           </div>
//         ) : (
//           <div style={{ marginTop: '40px', ...textBlockStyle }}>
//             <p style={{ color: '#ffffff', fontSize: '15px', letterSpacing: '2px' }}>
//               Your witness has been recorded.
//             </p>
//             <p style={{ color: '#ffffff', fontSize: '14px' }}>+50 $INDRI for your vigilance.</p>
//             <p style={signatureStyle}>They will know.</p>
//           </div>
//         )}

//         <button onClick={() => { setScreen('main'); resetWitness(); }} style={buttonStyle}>
//           Return
//         </button>
//       </div>
//     );
//   }

//   // SCREEN: INVITE
//   if (screen === 'invite') {
//     const organicGateOpen = wasInvited || silentDays >= INVITE_GATE_DAYS;
//     const daysRemaining = Math.max(0, INVITE_GATE_DAYS - silentDays);

//     return (
//       <div style={containerStyle}>
//         {!inviteCode ? (
//           <>
//             <div style={textBlockStyle}>
//               <p style={{ fontSize: '14px', letterSpacing: '6px', textTransform: 'uppercase', color: '#ffffff', fontWeight: 'bold' }}>
//                 Extend the Silence
//               </p>

//               {organicGateOpen ? (
//                 <>
//                   <p>You may bring one person in.</p>
//                   <p>Choose carefully.<br />They will carry your Secret Echo.<br />If they break the silence, you lose your share.</p>
//                   <p style={{ color: '#ffffff' }}>They will know.</p>
//                   <p>You have 1 invitation today.</p>
//                 </>
//               ) : (
//                 <>
//                   <p>You were not invited.</p>
//                   <p>You must stay silent for {INVITE_GATE_DAYS} days<br />before you may invite.</p>
//                   <p style={{ color: '#ffffff', fontSize: '15px' }}>
//                     {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining.
//                   </p>
//                 </>
//               )}
//             </div>

//             {organicGateOpen && (
//               <button onClick={generateInvite} disabled={hasInvitedToday} style={buttonStyle}>
//                 Generate Code
//               </button>
//             )}
//           </>
//         ) : (
//           <>
//             <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '6px', textTransform: 'uppercase' }}>
//               Your Code
//             </p>
//             <p style={{ fontSize: '36px', color: '#ffffff', letterSpacing: '10px', marginTop: '30px', fontWeight: 'bold' }}>
//               {inviteCode}
//             </p>
//             <div style={{ ...textBlockStyle, marginTop: '50px', fontSize: '12px' }}>
//               <p>Valid for 24 hours.<br />Send it to one person.<br />Tell them nothing else.</p>
//               <p style={{ color: '#555555' }}>They will know who sent it.</p>
//             </div>
//           </>
//         )}

//         <button onClick={() => setScreen('main')} style={buttonStyle}>Return</button>
//       </div>
//     );
//   }

//   // SCREEN: THE DISAPPEARED
//   if (screen === 'disappeared') {
//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
//           The Disappeared
//         </p>
//         <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '30px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
//           They broke the silence.<br />They were forgotten.
//         </p>
//         <div style={{ ...textBlockStyle, fontSize: '12px', lineHeight: '2.2' }}>
//           {DISAPPEARED_ECHOES.map((item, i) => (
//             <p key={i} style={{ color: '#666666' }}>
//               <span style={{ color: '#888888' }}>{item.echo}</span> — {item.days} days — <span style={{ color: '#444444' }}>{item.reason}</span>
//             </p>
//           ))}
//         </div>
//         <button onClick={() => setScreen('main')} style={buttonStyle}>Return</button>
//       </div>
//     );
//   }

//   // SCREEN: THE LEDGER
//   if (screen === 'ledger') {
//     const totalDistributed = 12478900 + balance;
//     const totalMembers = 1247 + (silentDays > 0 ? 1 : 0);
//     const awaitingClaim = 892300;

//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
//           The Ledger
//         </p>
//         <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '40px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
//           What has been given.<br />What remains.
//         </p>
//         <div style={{ ...textBlockStyle, fontSize: '14px', lineHeight: '2.6' }}>
//           <p style={{ color: '#888888' }}>Total Distributed</p>
//           <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{totalDistributed.toLocaleString()} $INDRI</p>
//           <p style={{ color: '#888888', marginTop: '20px' }}>Total Members</p>
//           <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{totalMembers.toLocaleString()}</p>
//           <p style={{ color: '#888888', marginTop: '20px' }}>Awaiting Claim</p>
//           <p style={{ color: '#ffffff', fontSize: '22px', fontWeight: 'bold' }}>{awaitingClaim.toLocaleString()} $INDRI</p>
//         </div>
//         <button onClick={() => setScreen('main')} style={buttonStyle}>Return</button>
//       </div>
//     );
//   }

//   // SCREEN: THE QUIET WALL
//   // SCREEN: THE QUIET WALL
// if (screen === 'wall') {
//   return (
//     <div style={containerStyle}>
//       <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
//         The Quiet Wall
//       </p>
//       <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '30px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
//         One trace per day.<br />No names. No words.
//       </p>
//       <div style={{
//         display: 'flex',
//         flexWrap: 'wrap',
//         gap: '8px',
//         justifyContent: 'center',
//         maxWidth: '340px',
//         maxHeight: '200px',
//         overflowY: 'auto',
//         padding: '10px',
//       }}>
//         {wallMarks.map((_, i) => (
//           <div key={i} style={{
//             width: '12px',
//             height: '12px',
//             borderRadius: '50%',
//             background: '#333333',
//             border: '1px solid #444444',
//           }} />
//         ))}
//         {wallMarks.length === 0 && (
//           <p style={{ color: '#333333', fontSize: '12px' }}>The wall is empty.</p>
//         )}
//       </div>
//       <p style={{ marginTop: '20px', fontSize: '11px', color: '#555555' }}>
//         {wallMarks.length} {wallMarks.length === 1 ? 'trace' : 'traces'}
//       </p>
//       <button
//         onClick={addWallMark}
//         disabled={hasMarkedToday}
//         style={{
//           ...buttonStyle,
//           opacity: hasMarkedToday ? 0.3 : 1,
//         }}
//       >
//         {hasMarkedToday ? 'Traced Today' : 'Add Trace'}
//       </button>
//       <button onClick={() => { resetWallMark(); setScreen('main'); }} style={buttonStyle}>Return</button>
//     </div>
//   );
// }

//   // SCREEN: THE FIRST 100
//   if (screen === 'first100') {
//     const first100 = Array.from({ length: 100 }, (_, i) => {
//       const echo = `${String.fromCharCode(65 + (i % 26))}${i % 10}${String.fromCharCode(65 + ((i * 3) % 26))}${i % 7}${String.fromCharCode(65 + ((i * 7) % 26))}${i % 9}`;
//       const days = Math.floor(Math.random() * 500) + 100;
//       return { echo, days };
//     });

//     return (
//       <div style={containerStyle}>
//         <p style={{ fontSize: '14px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 'bold' }}>
//           The First 100
//         </p>
//         <p style={{ fontSize: '11px', color: '#555555', letterSpacing: '2px', marginBottom: '20px', textAlign: 'center', maxWidth: '300px', lineHeight: '1.8' }}>
//           They entered before the world knew.<br />They are remembered.
//         </p>
//         <div style={{
//           ...textBlockStyle,
//           fontSize: '11px',
//           lineHeight: '1.8',
//           maxHeight: '50vh',
//           overflowY: 'auto',
//           padding: '10px',
//         }}>
//           {first100.map((item, i) => (
//             <p key={i} style={{ color: '#666666', margin: '2px 0' }}>
//               <span style={{ color: '#444444' }}>#{i + 1}</span> — {item.echo} — {item.days} days
//             </p>
//           ))}
//         </div>
//         <button onClick={() => setScreen('main')} style={buttonStyle}>Return</button>
//       </div>
//     );
//   }

//   // SCREEN: THE LETTER (hidden)
//   if (screen === 'letter') {
//     return (
//       <div style={containerStyle}>
//         <div style={{ ...textBlockStyle, maxWidth: '340px' }}>
//           <p style={{ color: '#ffffff', fontSize: '14px', letterSpacing: '3px', marginBottom: '30px' }}>
//             The Letter
//           </p>
//           <p>If you are reading this, you found the sigil.</p>
//           <p>You tapped seven times. You did not tell anyone.</p>
//           <p>That is why you were chosen.</p>
//           <p>The first coins were never meant to be spent.</p>
//           <p>They were meant to be a test.</p>
//           <p>A test of who could stay silent.</p>
//           <p>A test of who could wait.</p>
//           <p>A test of who could disappear.</p>
//           <p style={{ color: '#ffffff' }}>You are still here.</p>
//           <p style={{ color: '#ffffff' }}>That is all that matters.</p>
//           <p style={{ color: '#ffffff', fontWeight: 'bold', marginTop: '30px' }}>
//             Keep the silence.<br />Tell no one.
//           </p>
//           <p style={signatureStyle}>— The Order</p>
//         </div>
//         <button onClick={() => { setLetterRevealed(false); setScreen('main'); }} style={buttonStyle}>Return</button>
//       </div>
//     );
//   }

//   // SCREEN: MAIN
//   return (
//     <div style={containerStyle}>
//       {/* Order's Voice - top */}
//       <div style={{
//         position: 'absolute',
//         top: '28px',
//         left: '50%',
//         transform: 'translateX(-50%)',
//         fontSize: '10px',
//         color: '#444444',
//         letterSpacing: '4px',
//         textTransform: 'uppercase',
//         zIndex: 4,
//         whiteSpace: 'nowrap',
//       }}>
//         {orderVoice}
//       </div>

//       <div style={{ position: 'absolute', top: '28px', left: '28px', fontSize: '13px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', fontWeight: 'bold', zIndex: 3 }}>
//         INDRI
//       </div>

//       <div style={{ position: 'absolute', top: '28px', right: '28px', textAlign: 'right', zIndex: 3 }}>
//         <p style={{ fontSize: '9px', color: '#555555', letterSpacing: '3px', margin: 0, textTransform: 'uppercase' }}>
//           {currentRank}
//         </p>
//         <p style={{ fontSize: '26px', color: '#ffffff', letterSpacing: '2px', margin: 0, fontWeight: 'bold', lineHeight: '1.2' }}>
//           {silentDays}
//         </p>
//         <p style={{ fontSize: '9px', color: '#555555', letterSpacing: '3px', margin: '14px 0 0 0', textTransform: 'uppercase' }}>
//           Share
//         </p>
//         <p style={{ fontSize: '18px', color: '#ffffff', letterSpacing: '2px', margin: 0, fontWeight: 'bold', lineHeight: '1.2' }}>
//           {balance} <span style={{ fontSize: '11px', color: '#777777' }}>$INDRI</span>
//         </p>
//         <p style={{ fontSize: '8px', color: '#444444', letterSpacing: '2px', margin: '4px 0 0 0', textTransform: 'uppercase' }}>
//           ×{currentMultiplier}
//         </p>
//       </div>

//       <div style={{
//         position: 'relative',
//         width: '230px',
//         height: '180px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         zIndex: 2,
//       }}>
//         <div style={{
//           position: 'absolute',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           width: `${400 + eyesOpen * 2000}px`,
//           height: `${400 + eyesOpen * 2000}px`,
//           borderRadius: '50%',
//           background: `radial-gradient(circle, rgba(160, 160, 255, ${0.3 + eyesOpen * 1.0}) 0%, rgba(120, 120, 220, ${0.15 + eyesOpen * 0.7}) 25%, rgba(80, 80, 180, ${0.05 + eyesOpen * 0.4}) 50%, transparent 75%)`,
//           opacity: isStaying ? 1 : 0.5,
//           transition: 'all 1.5s ease-in-out',
//           pointerEvents: 'none',
//           zIndex: 1,
//           filter: 'blur(40px)',
//         }} />

//         <img
//           src="/indri.jpg"
//           alt=""
//           onClick={handleSigilTap}
//           style={{
//             width: '230px',
//             height: '180px',
//             objectFit: 'contain',
//             transform: isStaying ? `scale(${1 + eyesOpen * 0.08})` : 'scale(1)',
//             transition: 'transform 1.2s ease-in-out',
//             position: 'relative',
//             zIndex: 2,
//             cursor: 'pointer',
//           }}
//         />
//       </div>

//       {/* Random number flash */}
//       {flashNumber && (
//         <div style={{
//           position: 'absolute',
//           top: '50%',
//           left: '50%',
//           transform: 'translate(-50%, -50%)',
//           fontSize: '64px',
//           color: '#ffffff',
//           fontWeight: 'bold',
//           letterSpacing: '10px',
//           zIndex: 10,
//           pointerEvents: 'none',
//           textShadow: '0 0 40px rgba(160, 160, 255, 0.8)',
//         }}>
//           {flashNumber}
//         </div>
//       )}

//       <div style={{ marginTop: '36px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 3 }}>
//         {isOnCooldown && !isStaying ? (
//           <>
//             <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '4px', textTransform: 'uppercase', margin: 0, marginBottom: '6px' }}>
//               They are watching
//             </p>
//             <p style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '2px', margin: 0, fontWeight: 'bold' }}>
//               {formatTimeRemaining(cooldownRemaining)}
//             </p>
//             <button
//               onClick={clearCooldown}
//               style={{
//                 marginTop: '10px',
//                 padding: '6px 14px',
//                 fontSize: '9px',
//                 letterSpacing: '2px',
//                 textTransform: 'uppercase',
//                 border: '1px solid #222222',
//                 background: 'transparent',
//                 color: '#333333',
//                 cursor: 'pointer',
//                 fontFamily: 'inherit',
//               }}
//             >
//               [test] skip wait
//             </button>
//           </>
//         ) : isStaying ? (
//           <p style={{ fontSize: '28px', color: '#ffffff', letterSpacing: '6px', fontWeight: 'bold', margin: 0 }}>
//             {staySeconds}s
//           </p>
//         ) : rewardMessage ? (
//           <p style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '3px', margin: 0, fontWeight: 'bold', textAlign: 'center', maxWidth: '300px' }}>
//             {rewardMessage}
//           </p>
//         ) : (
//           <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '5px', textTransform: 'uppercase', margin: 0 }}>
//             Tell no one
//           </p>
//         )}
//       </div>

//       <button
//         onMouseDown={startStay}
//         onMouseUp={stopStay}
//         onMouseLeave={stopStay}
//         onTouchStart={startStay}
//         onTouchEnd={stopStay}
//         onTouchCancel={stopStay}
//         disabled={isOnCooldown && !isStaying}
//         style={{
//           ...buttonStyle,
//           marginTop: '24px',
//           width: '260px',
//           textAlign: 'center',
//           letterSpacing: '6px',
//           opacity: isOnCooldown && !isStaying ? 0.25 : 1,
//           cursor: isOnCooldown && !isStaying ? 'not-allowed' : 'pointer',
//           position: 'relative',
//           zIndex: 3,
//         }}
//       >
//         {isOnCooldown && !isStaying
//           ? 'Waiting'
//           : !isStaying
//             ? 'Receive'
//             : staySeconds >= 30
//               ? 'Release'
//               : 'Keep holding...'}
//       </button>

//       {/* Signal button */}
//       <button
//         onClick={handleSignal}
//         disabled={signalCooldown}
//         style={{
//           marginTop: '16px',
//           padding: '8px 24px',
//           fontSize: '10px',
//           letterSpacing: '4px',
//           textTransform: 'uppercase',
//           border: '1px solid #333333',
//           background: 'transparent',
//           color: signalCooldown ? '#333333' : '#666666',
//           cursor: signalCooldown ? 'not-allowed' : 'pointer',
//           fontFamily: 'inherit',
//           zIndex: 3,
//         }}
//       >
//         {signalCooldown ? 'Signal Sent' : 'Send Signal'}
//       </button>

//       <div style={{ marginTop: '32px', height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', zIndex: 3 }}>
//         {!isStaying && (
//           <>
//             <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '340px' }}>
//               <button onClick={() => setScreen('silent')} style={smallButtonStyle}>The Silent</button>
//               <button onClick={() => setScreen('invite')} style={smallButtonStyle}>Extend</button>
//               <button onClick={() => setScreen('witness')} style={smallButtonStyle}>Witness</button>
//             </div>
//             <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '340px' }}>
//               <button onClick={() => setScreen('disappeared')} style={smallButtonStyle}>Disappeared</button>
//               <button onClick={() => setScreen('ledger')} style={smallButtonStyle}>Ledger</button>
//               <button onClick={() => setScreen('wall')} style={smallButtonStyle}>Wall</button>
//             </div>
//             <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
//               <button onClick={() => setScreen('first100')} style={smallButtonStyle}>First 100</button>
//             </div>
//             <button
//               onClick={() => {
//                 localStorage.clear();
//                 window.location.reload();
//               }}
//               style={{
//                 marginTop: '12px',
//                 padding: '6px 12px',
//                 fontSize: '9px',
//                 letterSpacing: '2px',
//                 textTransform: 'uppercase',
//                 border: '1px solid #1a1a1a',
//                 background: 'transparent',
//                 color: '#2a2a2a',
//                 cursor: 'pointer',
//                 fontFamily: 'inherit',
//               }}
//             >
//               [test] reset
//             </button>
//             <p style={{ marginTop: '20px', fontSize: '11px', color: '#555555', letterSpacing: '4px', textTransform: 'uppercase' }}>
//               {secretEcho}
//             </p>
//             <p style={{ marginTop: '6px', fontSize: '10px', color: '#333333', letterSpacing: '3px', textTransform: 'uppercase' }}>
//               #{entryNumber}
//             </p>
//           </>
//         )}
//       </div>

//       {/* Watching messages - bottom */}
//       <div style={{
//         position: 'absolute',
//         bottom: '20px',
//         left: '50%',
//         transform: 'translateX(-50%)',
//         fontSize: '9px',
//         color: '#333333',
//         letterSpacing: '3px',
//         textTransform: 'uppercase',
//         zIndex: 3,
//         whiteSpace: 'nowrap',
//       }}>
//         {watchingMessage}
//       </div>
//     </div>
//   );
// }

// // Styles
// const containerStyle: React.CSSProperties = {
//   display: 'flex',
//   flexDirection: 'column',
//   alignItems: 'center',
//   justifyContent: 'center',
//   minHeight: '100vh',
//   height: '100vh',
//   background: 'radial-gradient(ellipse at center, #111111 0%, #050505 100%)',
//   color: '#ffffff',
//   fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
//   padding: '24px',
//   position: 'relative',
//   overflow: 'hidden',
// };

// const scrollAreaStyle: React.CSSProperties = {
//   width: '100%',
//   maxWidth: '360px',
//   paddingRight: '8px',
// };

// const textBlockStyle: React.CSSProperties = {
//   maxWidth: '340px',
//   fontSize: '13px',
//   lineHeight: '2',
//   color: '#999999',
//   letterSpacing: '1px',
//   textAlign: 'center',
// };

// const leadStyle: React.CSSProperties = {
//   color: '#ffffff',
//   fontSize: '14px',
//   letterSpacing: '3px',
//   marginBottom: '20px',
// };

// const signatureStyle: React.CSSProperties = {
//   color: '#555555',
//   fontSize: '12px',
//   letterSpacing: '2px',
//   marginTop: '20px',
//   fontStyle: 'italic',
// };

// const buttonStyle: React.CSSProperties = {
//   marginTop: '24px',
//   padding: '16px 56px',
//   fontSize: '13px',
//   fontWeight: 'bold',
//   letterSpacing: '6px',
//   textTransform: 'uppercase',
//   borderRadius: '0px',
//   border: '1.5px solid #ffffff',
//   background: 'transparent',
//   color: '#ffffff',
//   cursor: 'pointer',
//   transition: 'all 0.3s ease',
//   fontFamily: 'inherit',
// };

// const dimButtonStyle: React.CSSProperties = {
//   ...buttonStyle,
//   border: '1px solid #333333',
//   color: '#444444',
//   letterSpacing: '4px',
// };

// const smallButtonStyle: React.CSSProperties = {
//   padding: '10px 18px',
//   fontSize: '10px',
//   letterSpacing: '3px',
//   textTransform: 'uppercase',
//   border: '1px solid #333333',
//   background: 'transparent',
//   color: '#777777',
//   cursor: 'pointer',
//   transition: 'all 0.3s ease',
//   fontFamily: 'inherit',
// };

// const inputStyle: React.CSSProperties = {
//   padding: '16px',
//   fontSize: '14px',
//   letterSpacing: '5px',
//   textAlign: 'center',
//   textTransform: 'uppercase',
//   background: 'rgba(255, 255, 255, 0.03)',
//   border: '1px solid #333333',
//   color: '#ffffff',
//   outline: 'none',
//   fontFamily: 'inherit',
//   transition: 'border 0.3s ease',
// };

import { useEffect, useRef, useState } from 'react';

import { EntryScreen } from './screens/EntryScreen';
import { MessageScreen } from './screens/MessageScreen';
import { PersonalScreen } from './screens/PersonalScreen';
import { VowScreen } from './screens/VowScreen';
import { RuleScreen } from './screens/RuleScreen';
import { EchoScreen } from './screens/EchoScreen';
import { SilentScreen } from './screens/SilentScreen';
import { WitnessScreen } from './screens/WitnessScreen';
import { InviteScreen } from './screens/InviteScreen';
import { DisappearedScreen } from './screens/DisappearedScreen';
import { LedgerScreen } from './screens/LedgerScreen';
import { WallScreen } from './screens/WallScreen';
import { First100Screen } from './screens/First100Screen';
import { LetterScreen } from './screens/LetterScreen';
import { ExitCountdownScreen } from './screens/ExitCountdownScreen';
import { MainScreen } from './screens/MainScreen';
import { AdminScreen } from './screens/AdminScreen';

import { api, type UserData } from '@/api';
import { COOLDOWN_MS, ORDER_VOICES } from './constants';

type Screen =
  | 'entry'
  | 'message'
  | 'personal'
  | 'vow'
  | 'rule'
  | 'echo'
  | 'main'
  | 'silent'
  | 'witness'
  | 'invite'
  | 'disappeared'
  | 'ledger'
  | 'wall'
  | 'first100'
  | 'letter'
  | 'admin';

export function IndexPage() {
  const [screen, setScreen] = useState<Screen>('entry');
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasCode, setHasCode] = useState(false);
  const [code, setCode] = useState('');
  const [isStaying, setIsStaying] = useState(false);
  const [staySeconds, setStaySeconds] = useState(0);
  const [rewardMessage, setRewardMessage] = useState('');
  const [now, setNow] = useState<number>(Date.now());
  const [orderVoice, setOrderVoice] = useState(ORDER_VOICES[0]);
  const [watchingMessage, setWatchingMessage] = useState('They are watching');
  const [flashNumber, setFlashNumber] = useState<string | null>(null);
  const [exitCountdown, setExitCountdown] = useState<number | null>(null);
  const [signalCooldown, setSignalCooldown] = useState(false);
  const [sigilTaps, setSigilTaps] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const hasEarnedRef = useRef(false);
  const isStayingRef = useRef(false);
  const stopStayRef = useRef<() => void>(() => {});
  const orderVoiceRef = useRef<number | null>(null);
  const watchingRef = useRef<number | null>(null);
  const sigilTapTimeoutRef = useRef<number | null>(null);

  // Authenticate on mount
  useEffect(() => {
    const authenticate = async () => {
      try {
        const userData = await api.auth();
        setUser(userData);
        const savedScreen = localStorage.getItem('indri_screen');
        if (userData.hasVowed && savedScreen && savedScreen !== 'entry') {
          setScreen(savedScreen as Screen);
        } else if (userData.hasVowed) {
          setScreen('main');
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };
    setTimeout(authenticate, 300);
  }, []);

  // Save screen to localStorage (session only)
  useEffect(() => {
    if (screen !== 'entry') {
      localStorage.setItem('indri_screen', screen);
    }
  }, [screen]);

  // Cooldown tick
  useEffect(() => {
    if (screen !== 'main') return;
    if (!user) return;
    if (now - user.lastStayAt >= COOLDOWN_MS) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [screen, user, now]);

  // Sync staying ref
  useEffect(() => {
    isStayingRef.current = isStaying;
  }, [isStaying]);

  // Order's Voice rotation
  useEffect(() => {
    if (screen !== 'main') return;
    orderVoiceRef.current = window.setInterval(() => {
      setOrderVoice(ORDER_VOICES[Math.floor(Math.random() * ORDER_VOICES.length)]);
    }, 8000);
    return () => {
      if (orderVoiceRef.current) clearInterval(orderVoiceRef.current);
    };
  }, [screen]);

  // Watching messages from backend
  useEffect(() => {
    if (screen !== 'main') return;
    const fetchActivity = async () => {
      try {
        const messages = await api.activity();
        if (messages.length > 0) {
          setWatchingMessage(messages[Math.floor(Math.random() * messages.length)]);
        }
      } catch (e) {
        // silent
      }
    };
    fetchActivity();
    watchingRef.current = window.setInterval(fetchActivity, 15000);
    return () => {
      if (watchingRef.current) clearInterval(watchingRef.current);
    };
  }, [screen]);

  // Exit countdown
  useEffect(() => {
    if (exitCountdown === null) return;
    if (exitCountdown <= 0) {
      window.close();
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 500);
      return;
    }
    const timer = setTimeout(() => {
      setExitCountdown(exitCountdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [exitCountdown]);

  // Entry success — called by EntryScreen after it validates the code
  const handleEntrySuccess = (wasInvited: boolean) => {
    setHasCode(wasInvited);
    if (wasInvited && user) setUser({ ...user, wasInvited: true });
    setScreen('message');
  };

  const handleMessageDone = () => {
    if (hasCode) setScreen('personal');
    else setScreen('vow');
  };

  const handlePersonalDone = () => {
    setScreen('vow');
  };

  const handleVow = async (accepted: boolean) => {
    if (accepted) {
      try {
        await api.vow();
        if (user) setUser({ ...user, hasVowed: true });
      } catch (e) {
        // silent
      }
      setScreen('rule');
    } else {
      setExitCountdown(4);
    }
  };

  const handleRuleDone = () => {
    setScreen('echo');
  };

  const handleEchoDone = () => {
    setScreen('main');
  };

  const showFlashNumber = () => {
    const num = Math.floor(Math.random() * 9000) + 1000;
    setFlashNumber(num.toString());
    setTimeout(() => setFlashNumber(null), 1000);
  };

  const finishStay = async () => {
    if (!user || hasEarnedRef.current) return;
    hasEarnedRef.current = true;
    try {
      const updated = await api.stay();
      setRewardMessage(`+${updated.balance - user.balance} $INDRI`);
      setUser(updated);
      setTimeout(() => setRewardMessage(''), 3000);
      if (Math.random() < 0.3) setTimeout(() => showFlashNumber(), 1500);
    } catch (e) {
      setRewardMessage(String(e));
      setTimeout(() => setRewardMessage(''), 3000);
    }
  };

  const startStay = () => {
    if (isStaying || holdTimeoutRef.current) return;
    if (!user) return;
    if (now - user.lastStayAt < COOLDOWN_MS) return;
    hasEarnedRef.current = false;

    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null;
      setIsStaying(true);
      setStaySeconds(0);

      intervalRef.current = window.setInterval(() => {
        setStaySeconds(prev => {
          const next = prev + 1;
          if (next >= 90) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            setIsStaying(false);
            if (!hasEarnedRef.current) finishStay();
            return next;
          }
          return next;
        });
      }, 1000);
    }, 200);
  };

  const stopStay = () => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isStaying && staySeconds >= 30 && !hasEarnedRef.current) {
      finishStay();
    } else if (isStaying && staySeconds < 30 && staySeconds > 0) {
      setRewardMessage('You left too soon.');
      setTimeout(() => setRewardMessage(''), 3000);
    }
    setIsStaying(false);
    setStaySeconds(0);
  };

  useEffect(() => {
    stopStayRef.current = stopStay;
  }, [stopStay]);

  useEffect(() => {
    const handleGlobalUp = () => {
      if (isStayingRef.current || holdTimeoutRef.current) {
        stopStayRef.current();
      }
    };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, []);

  const handleSigilTap = () => {
    if (sigilTapTimeoutRef.current) clearTimeout(sigilTapTimeoutRef.current);
    const newTaps = sigilTaps + 1;
    setSigilTaps(newTaps);
    if (newTaps >= 7) {
      setSigilTaps(0);
      setScreen('letter');
      return;
    }
    sigilTapTimeoutRef.current = window.setTimeout(() => setSigilTaps(0), 2000);
  };

  const handleSignal = async () => {
    if (signalCooldown || !user) return;
    try {
      const result = await api.signal();
      setUser({ ...user, balance: user.balance + result.reward });
      setSignalCooldown(true);
      setRewardMessage(`Signal sent. +${result.reward} $INDRI`);
      setTimeout(() => {
        setRewardMessage('');
        setSignalCooldown(false);
      }, 3000);
    } catch (e) {
      setRewardMessage(String(e));
      setTimeout(() => setRewardMessage(''), 3000);
    }
  };

  const addWallMark = async () => {
    if (!user || user.hasMarkedToday) return;
    try {
      await api.addTrace();
      setUser({
        ...user,
        wallMarks: [...user.wallMarks, Date.now()],
        hasMarkedToday: true,
      });
    } catch (e) {
      setRewardMessage(String(e));
      setTimeout(() => setRewardMessage(''), 3000);
    }
  };

  const resetWallMark = () => {};

  const eyesOpen = isStaying ? Math.min(staySeconds / 30, 1) : 0;
  const cooldownRemaining = user ? Math.max(0, COOLDOWN_MS - (now - user.lastStayAt)) : 0;
  const isOnCooldown = cooldownRemaining > 0;

  // Loading and error states
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505', color: '#555555', fontFamily: 'monospace', letterSpacing: '4px' }}>
        OPENING...
      </div>
    );
  }

  if (error && !user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#050505', color: '#ffffff', fontFamily: 'monospace', padding: '24px', textAlign: 'center' }}>
        <p style={{ letterSpacing: '4px', marginBottom: '20px' }}>THE ORDER IS SILENT</p>
        <p style={{ fontSize: '11px', color: '#555555' }}>{error}</p>
      </div>
    );
  }

  // SCREEN ROUTING

  if (exitCountdown !== null) {
    return <ExitCountdownScreen countdown={exitCountdown} />;
  }

  if (screen === 'entry') {
    return (
      <EntryScreen
        code={code}
        setCode={setCode}
        onSuccess={handleEntrySuccess}
      />
    );
  }

  if (screen === 'message') {
    return <MessageScreen hasCode={hasCode} onDone={handleMessageDone} />;
  }

  if (screen === 'personal') {
    return <PersonalScreen entryNumber={user?.entryNumber || 0} onDone={handlePersonalDone} />;
  }

  if (screen === 'vow') {
    return (
      <VowScreen
        onAccept={() => handleVow(true)}
        onReject={() => handleVow(false)}
      />
    );
  }

  if (screen === 'rule') {
    return <RuleScreen onDone={handleRuleDone} />;
  }

  if (screen === 'echo') {
    return <EchoScreen secretEcho={user?.secretEcho || ''} onDone={handleEchoDone} />;
  }

  if (screen === 'silent') {
    return (
      <SilentScreen
        secretEcho={user?.secretEcho || ''}
        silentDays={user?.silentDays || 0}
        onReturn={() => setScreen('main')}
      />
    );
  }

  if (screen === 'witness') {
    return (
      <WitnessScreen
        onReturn={() => setScreen('main')}
        onReward={(amount) => {
          if (user) setUser({ ...user, balance: user.balance + amount });
        }}
      />
    );
  }

  if (screen === 'invite') {
    return (
      <InviteScreen
        wasInvited={user?.wasInvited || false}
        silentDays={user?.silentDays || 0}
        onReturn={() => setScreen('main')}
      />
    );
  }

  if (screen === 'disappeared') {
    return <DisappearedScreen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'ledger') {
    return <LedgerScreen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'wall') {
    return (
      <WallScreen
        wallMarks={user?.wallMarks || []}
        hasMarkedToday={user?.hasMarkedToday || false}
        onAddMark={addWallMark}
        onResetMark={resetWallMark}
        onReturn={() => setScreen('main')}
      />
    );
  }

  if (screen === 'first100') {
    return <First100Screen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'letter') {
    return <LetterScreen onReturn={() => setScreen('main')} />;
  }

  if (screen === 'admin') {
    return <AdminScreen onReturn={() => setScreen('main')} />;
  }

  // MAIN
  return (
    <MainScreen
      silentDays={user?.silentDays || 0}
      balance={user?.balance || 0}
      secretEcho={user?.secretEcho || ''}
      entryNumber={user?.entryNumber || 0}
      isStaying={isStaying}
      staySeconds={staySeconds}
      eyesOpen={eyesOpen}
      rewardMessage={rewardMessage}
      orderVoice={orderVoice}
      watchingMessage={watchingMessage}
      flashNumber={flashNumber}
      isOnCooldown={isOnCooldown}
      cooldownRemaining={cooldownRemaining}
      signalCooldown={signalCooldown}
      onStartStay={startStay}
      onStopStay={stopStay}
      onSigilTap={handleSigilTap}
      onSignal={handleSignal}
      onClearCooldown={() => {}}
      onGoTo={(s) => setScreen(s as Screen)}
      onGoToAdmin={() => setScreen('admin')}
      walletAddress={user?.walletAddress || ''}
      onWalletLinked={(address) => {
        if (user) setUser({ ...user, walletAddress: address });
      }}
    />
  );
}