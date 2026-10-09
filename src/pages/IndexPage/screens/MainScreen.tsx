import { Sigil } from '../components/Sigil';
import { OrderVoice } from '../components/OrderVoice';
import { WatchingPulse } from '../components/WatchingPulse';
import { FlashNumber } from '../components/FlashNumber';
import { WalletButton } from '@/pages/TONConnectPage/TONConnectPage';
import { buttonStyle, containerStyle, smallButtonStyle } from '../styles';
import { formatTimeRemaining } from '../utils/time';
import { getMultiplier, getRank } from '../utils/rank';

interface Props {
  silentDays: number;
  balance: number;
  secretEcho: string;
  entryNumber: number;
  isStaying: boolean;
  staySeconds: number;
  eyesOpen: number;
  rewardMessage: string;
  orderVoice: string;
  watchingMessage: string;
  flashNumber: string | null;
  isOnCooldown: boolean;
  cooldownRemaining: number;
  signalCooldown: boolean;
  walletAddress: string;
  onStartStay: () => void;
  onStopStay: () => void;
  onSigilTap: () => void;
  onSignal: () => void;
  onWalletLinked: (address: string) => void;
  onGoTo: (screen: string) => void;
  isAdmin: boolean;
  onGoToAdmin: () => void;
}

export function MainScreen(props: Props) {
  const {
    silentDays, balance, secretEcho, entryNumber,
    isStaying, staySeconds, eyesOpen, rewardMessage,
    orderVoice, watchingMessage, flashNumber,
    isOnCooldown, cooldownRemaining, signalCooldown,
    walletAddress,
    onStartStay, onStopStay, onSigilTap, onSignal,
    onWalletLinked, onGoTo, isAdmin, onGoToAdmin,
  } = props;

  const currentRank = getRank(silentDays);
  const currentMultiplier = getMultiplier(silentDays);

  return (
    <div style={{
      ...containerStyle,
      height: 'auto',
      minHeight: '100vh',
      overflowY: 'auto',
      paddingTop: '80px',
      paddingBottom: '60px',
    }}>
      <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '13px', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase', fontWeight: 'bold', zIndex: 3 }}>
        INDRI
      </div>

      <div style={{ position: 'absolute', top: '24px', right: '24px', textAlign: 'right', zIndex: 3 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px' }}>
          <span style={{ fontSize: '9px', color: '#555555', letterSpacing: '3px', textTransform: 'uppercase' }}>
            {currentRank}
          </span>
          <span style={{ fontSize: '22px', color: '#ffffff', letterSpacing: '1px', fontWeight: 'bold', lineHeight: 1 }}>
            {silentDays}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
          <span style={{ fontSize: '9px', color: '#555555', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Share
          </span>
          <span style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '1px', fontWeight: 'bold', lineHeight: 1 }}>
            {balance} <span style={{ fontSize: '10px', color: '#777777' }}>$INDRI</span>
          </span>
          <span style={{ fontSize: '8px', color: '#444444', letterSpacing: '1px', textTransform: 'uppercase' }}>
            ×{currentMultiplier}
          </span>
        </div>
      </div>

      <OrderVoice voice={orderVoice} />

      <Sigil isStaying={isStaying} eyesOpen={eyesOpen} onTap={onSigilTap} />

      <FlashNumber number={flashNumber} />

      <div style={{ marginTop: '36px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', zIndex: 3 }}>
        {isOnCooldown && !isStaying ? (
          <>
            <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '4px', textTransform: 'uppercase', margin: 0, marginBottom: '6px' }}>
              They are watching
            </p>
            <p style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '2px', margin: 0, fontWeight: 'bold' }}>
              {formatTimeRemaining(cooldownRemaining)}
            </p>
          </>
        ) : isStaying ? (
          <p style={{ fontSize: '28px', color: '#ffffff', letterSpacing: '6px', fontWeight: 'bold', margin: 0 }}>{staySeconds}s</p>
        ) : rewardMessage ? (
          <p style={{ fontSize: '15px', color: '#ffffff', letterSpacing: '3px', margin: 0, fontWeight: 'bold', textAlign: 'center', maxWidth: '300px' }}>
            {rewardMessage}
          </p>
        ) : (
          <p style={{ fontSize: '11px', color: '#666666', letterSpacing: '5px', textTransform: 'uppercase', margin: 0 }}>
            Tell no one
          </p>
        )}
      </div>

      <button
        onMouseDown={onStartStay}
        onMouseUp={onStopStay}
        onMouseLeave={onStopStay}
        onTouchStart={onStartStay}
        onTouchEnd={onStopStay}
        onTouchCancel={onStopStay}
        disabled={isOnCooldown && !isStaying}
        style={{
          ...buttonStyle,
          marginTop: '24px',
          width: '260px',
          textAlign: 'center',
          letterSpacing: '6px',
          opacity: isOnCooldown && !isStaying ? 0.25 : 1,
          cursor: isOnCooldown && !isStaying ? 'not-allowed' : 'pointer',
          position: 'relative',
          zIndex: 3,
        }}
      >
        {isOnCooldown && !isStaying
          ? 'Waiting'
          : !isStaying
            ? 'Receive'
            : staySeconds >= 30
              ? 'Release'
              : 'Keep holding...'}
      </button>

      <button
        onClick={onSignal}
        disabled={signalCooldown}
        style={{
          marginTop: '16px',
          padding: '8px 24px',
          fontSize: '10px',
          letterSpacing: '4px',
          textTransform: 'uppercase',
          border: '1px solid #333333',
          background: 'transparent',
          color: signalCooldown ? '#333333' : '#666666',
          cursor: signalCooldown ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {signalCooldown ? 'Signal Sent' : 'Send Signal'}
      </button>

      <WalletButton currentAddress={walletAddress} onLinked={onWalletLinked} />

      <div style={{ marginTop: '32px', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', zIndex: 3 }}>
        {!isStaying && (
          <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '340px' }}>
              <button onClick={() => onGoTo('silent')} style={smallButtonStyle}>The Silent</button>
              <button onClick={() => onGoTo('invite')} style={smallButtonStyle}>Extend</button>
              <button onClick={() => onGoTo('witness')} style={smallButtonStyle}>Witness</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '340px' }}>
              <button onClick={() => onGoTo('disappeared')} style={smallButtonStyle}>Disappeared</button>
              <button onClick={() => onGoTo('ledger')} style={smallButtonStyle}>Ledger</button>
              <button onClick={() => onGoTo('wall')} style={smallButtonStyle}>Wall</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => onGoTo('first100')} style={smallButtonStyle}>First List</button>
            </div>
            {isAdmin && (
              <button
                onClick={onGoToAdmin}
                style={{
                  marginTop: '16px',
                  padding: '6px 12px',
                  fontSize: '9px',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  border: '1px solid #1a1a1a',
                  background: 'transparent',
                  color: '#2a2a2a',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                [admin]
              </button>
            )}
            <p style={{ marginTop: '20px', fontSize: '11px', color: '#555555', letterSpacing: '4px', textTransform: 'uppercase' }}>
              {secretEcho}
            </p>
            <p style={{ marginTop: '6px', fontSize: '10px', color: '#333333', letterSpacing: '3px', textTransform: 'uppercase' }}>
              #{entryNumber}
            </p>
          </>
        )}
      </div>

      <WatchingPulse message={watchingMessage} />
    </div>
  );
}