import type React from 'react';

export const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  height: '100vh',
  background: 'radial-gradient(ellipse at center, #111111 0%, #050505 100%)',
  color: '#ffffff',
  fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
};

export const scrollAreaStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '360px',
  paddingRight: '8px',
};

export const textBlockStyle: React.CSSProperties = {
  maxWidth: '340px',
  fontSize: '13px',
  lineHeight: '2',
  color: '#999999',
  letterSpacing: '1px',
  textAlign: 'center',
};

export const leadStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '14px',
  letterSpacing: '3px',
  marginBottom: '20px',
};

export const signatureStyle: React.CSSProperties = {
  color: '#555555',
  fontSize: '12px',
  letterSpacing: '2px',
  marginTop: '20px',
  fontStyle: 'italic',
};

export const buttonStyle: React.CSSProperties = {
  marginTop: '24px',
  padding: '16px 56px',
  fontSize: '13px',
  fontWeight: 'bold',
  letterSpacing: '6px',
  textTransform: 'uppercase',
  borderRadius: '0px',
  border: '1.5px solid #ffffff',
  background: 'transparent',
  color: '#ffffff',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
};

export const dimButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  border: '1px solid #333333',
  color: '#444444',
  letterSpacing: '4px',
};

export const smallButtonStyle: React.CSSProperties = {
  padding: '10px 18px',
  fontSize: '10px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  border: '1px solid #333333',
  background: 'transparent',
  color: '#777777',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  fontFamily: 'inherit',
};

export const inputStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: '14px',
  letterSpacing: '5px',
  textAlign: 'center',
  textTransform: 'uppercase',
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid #333333',
  color: '#ffffff',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border 0.3s ease',
};