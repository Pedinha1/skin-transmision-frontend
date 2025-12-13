import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const pulse = keyframes`
  0%, 100% { 
    opacity: 1; 
    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor;
  }
  50% { 
    opacity: 0.7; 
    box-shadow: 0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor;
  }
`;

const blink = keyframes`
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0.3; }
`;

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
  }
  50% { 
    box-shadow: 0 0 20px currentColor, 0 0 40px currentColor, 0 0 60px currentColor;
  }
`;

const LEDContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const LEDWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LED = styled.div`
  width: ${props => props.$size || 16}px;
  height: ${props => props.$size || 16}px;
  border-radius: 50%;
  background: ${props => {
    switch(props.$status) {
      case 'connected':
        return '#10b981'; // Verde
      case 'connecting':
        return '#f59e0b'; // Amarelo/Laranja
      case 'disconnected':
        return '#ef4444'; // Vermelho
      case 'error':
        return '#dc2626'; // Vermelho escuro
      case 'waiting':
        return '#64748b'; // Cinza
      default:
        return '#64748b';
    }
  }};
  color: ${props => {
    switch(props.$status) {
      case 'connected':
        return '#10b981';
      case 'connecting':
        return '#f59e0b';
      case 'disconnected':
        return '#ef4444';
      case 'error':
        return '#dc2626';
      case 'waiting':
        return '#64748b';
      default:
        return '#64748b';
    }
  }};
  box-shadow: ${props => {
    const color = props.$status === 'connected' ? '#10b981' : 
                  props.$status === 'connecting' ? '#f59e0b' : 
                  props.$status === 'error' ? '#dc2626' : '#64748b';
    return `0 0 10px ${color}`;
  }};
  ${props => {
    if (props.$status === 'connected') return css`animation: ${pulse} 2s ease-in-out infinite;`;
    if (props.$status === 'connecting') return css`animation: ${blink} 1s ease-in-out infinite;`;
    if (props.$status === 'error') return css`animation: ${glow} 1s ease-in-out infinite;`;
    return css`animation: none;`;
  }}
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid currentColor;
    opacity: 0.5;
    ${props => props.$status === 'connected' ? css`animation: ${pulse} 2s ease-in-out infinite;` : css`animation: none;`}
  }
`;

const LEDLabel = styled.span`
  font-size: ${props => props.$fontSize || '0.85rem'};
  font-weight: 700;
  color: ${props => {
    switch(props.$status) {
      case 'connected':
        return '#10b981';
      case 'connecting':
        return '#f59e0b';
      case 'disconnected':
        return '#ef4444';
      case 'error':
        return '#dc2626';
      case 'waiting':
        return '#94a3b8';
      default:
        return '#94a3b8';
    }
  }};
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => {
    const color = props.$status === 'connected' ? 'rgba(16, 185, 129, 0.5)' : 
                  props.$status === 'connecting' ? 'rgba(245, 158, 11, 0.5)' : 
                  props.$status === 'error' ? 'rgba(220, 38, 38, 0.5)' : 'none';
    return `0 0 10px ${color}`;
  }};
`;

const StatusText = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  text-align: center;
  margin-top: 4px;
`;

const ConnectionStatusLED = ({ 
  status = 'waiting', 
  label, 
  statusText,
  size = 16,
  fontSize = '0.85rem',
  showLabel = true,
  showStatusText = false
}) => {
  const getStatusLabel = () => {
    if (label) return label;
    switch(status) {
      case 'connected':
        return 'CONECTADO';
      case 'connecting':
        return 'CONECTANDO';
      case 'disconnected':
        return 'DESCONECTADO';
      case 'error':
        return 'ERRO';
      case 'waiting':
        return 'AGUARDANDO';
      default:
        return 'DESCONHECIDO';
    }
  };

  return (
    <LEDContainer>
      <LEDWrapper>
        <LED $status={status} $size={size} />
        {showLabel && (
          <LEDLabel $status={status} $fontSize={fontSize}>
            {getStatusLabel()}
          </LEDLabel>
        )}
      </LEDWrapper>
      {showStatusText && statusText && (
        <StatusText>{statusText}</StatusText>
      )}
    </LEDContainer>
  );
};

export default ConnectionStatusLED;
