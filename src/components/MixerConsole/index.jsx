import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import mascotService from '../../services/mascotService';
import aiSearchService from '../../services/aiSearchService';
import { pulse, shimmer } from '../../styles/animations';
import AutoRequestProcessor from '../AutoRequestProcessor';

const faderMove = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-1px) scale(1.02); }
`;

const faderGlow = keyframes`
  0%, 100% { box-shadow: 0 0 8px rgba(6, 182, 212, 0.5), 0 0 15px rgba(34, 211, 238, 0.3); }
  50% { box-shadow: 0 0 15px rgba(6, 182, 212, 0.8), 0 0 25px rgba(34, 211, 238, 0.5); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  25% { transform: translateY(-10px) rotate(2deg); }
  50% { transform: translateY(-5px) rotate(0deg); }
  75% { transform: translateY(-10px) rotate(-2deg); }
`;

const talk = keyframes`
  0%, 100% { transform: translateX(-50%) scaleY(1); }
  50% { transform: translateX(-50%) scaleY(0.3); }
`;

const blink = keyframes`
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;

const bubblePop = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

// Animações do Robô
const robotFloat = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(2deg); }
`;

const robotPulse = keyframes`
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.2); }
`;

const ledBlink = keyframes`
  0%, 90%, 100% { opacity: 1; box-shadow: 0 0 10px currentColor, 0 0 20px currentColor; }
  95% { opacity: 0.3; box-shadow: 0 0 5px currentColor, 0 0 10px currentColor; }
`;

const antennaPulse = keyframes`
  0%, 100% { transform: scaleY(1); opacity: 0.8; }
  50% { transform: scaleY(1.1); opacity: 1; }
`;

const scanLine = keyframes`
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
`;

const robotBounce = keyframes`
  0%, 100% { transform: translateY(0px) scaleY(1); }
  50% { transform: translateY(-8px) scaleY(0.95); }
`;

const hologramFlicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
  75% { opacity: 0.95; }
`;

const circuitPulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const eyeBlink = keyframes`
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
`;

const Container = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 8px; /* Aumentado de 4px para 8px (2x) */
  margin-bottom: 0;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(6, 182, 212, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  width: 100%; /* Aumentado de 95% para 100% (aumento de 5%) */
  max-width: 100%; /* Aumentado de 95% para 100% (aumento de 5%) */
  box-sizing: border-box;
  min-height: 514px; /* Reduzido de 1542px para 514px (diminuído 3x) */

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      #06b6d4 25%, 
      #22d3ee 50%, 
      #67e8f9 75%, 
      transparent 100%
    );
    background-size: 200% 100%;
    animation: ${shimmer} 3s linear infinite;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px; /* Aumentado de 4px para 8px (2x) */
  padding-bottom: 8px; /* Aumentado de 4px para 8px (2x) */
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f1f5f9;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 800;
`;

const StatusIndicator = styled.div`
  display: flex;
  gap: 4px;
  margin-left: 12px;
`;

const StatusDot = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${props => props.$color || '#22d3ee'};
  box-shadow: 0 0 8px ${props => props.$color || '#22d3ee'};
  animation: ${pulse} 2s infinite;
`;

const Controls = styled.div`
  display: flex;
  gap: 2px;
`;

const IconButton = styled.button`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  width: 45px;
  height: 45px;
  min-width: 45px;
  max-width: 45px;
  min-height: 45px;
  max-height: 45px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: all 0.1s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;

  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
    border-color: #22d3ee;
    color: #67e8f9;
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  }
`;

// Layout Flexível com Grid
const MixerLayout = styled.div`
  display: flex;
  gap: 24px; /* Aumentado de 12px para 24px (2x) */
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  height: 100%;
  min-height: 514px; /* Reduzido de 1542px para 514px (diminuído 3x) */
  position: relative;
  align-items: stretch; /* Mudado de center para stretch para que os filhos ocupem toda a altura */
  justify-content: center;
  padding: 16px; /* Aumentado de 8px para 16px (2x) */
  margin: 0 auto; /* Centralizar o mixer quando a largura for reduzida */
`;

// VU Meter - Reconstruído
// VU Meter components removidos

// Elementos Fixos no Grid
const GridElement = styled.div`
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: ${props => props.$direction || 'column'};
  gap: ${props => props.$gap || '4px'};
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  
  /* Posicionamento fixo no grid */
  grid-column: ${props => props.$gridCol || 'span 3'};
  grid-row: ${props => props.$gridRow || 'span 12'};
`;

// ============================================
// DISPLAY TECNOLÓGICO DO ROBÔ (igual ao do ouvinte)
// ============================================
const RobotDisplayContainer = styled.div`
  width: 100%;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(15px);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 16px;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 15px 30px rgba(0, 0, 0, 0.4),
    0 0 25px rgba(6, 182, 212, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  ${css`animation: ${hologramFlicker} 4s ease-in-out infinite;`}

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(6, 182, 212, 0.03) 2px,
        rgba(6, 182, 212, 0.03) 4px
      );
    pointer-events: none;
    z-index: 1;
  }

  &::after {
    content: '';
    position: absolute;
    top: -100%;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(6, 182, 212, 0.1),
      transparent
    );
    ${css`animation: ${scanLine} 3s linear infinite;`}
    pointer-events: none;
    z-index: 2;
  }
`;

const RobotDisplayHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  position: relative;
  z-index: 10;
`;

const RobotDisplayTitle = styled.div`
  color: #f1f5f9;
  font-weight: 700;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 6px;
  letter-spacing: 1px;
  text-transform: uppercase;
  
  span {
    font-size: 1rem;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const RobotStatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
    : 'rgba(100, 116, 139, 0.2)'};
  border: 1px solid ${props => props.$active ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
  border-radius: 15px;
  font-size: 0.55rem;
  font-weight: 700;
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const RobotViewport = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(15, 23, 42, 0.8) 50%, rgba(139, 92, 246, 0.05) 100%);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  z-index: 10;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 70% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const CircuitPattern = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px);
  background-size: 15px 15px;
  ${css`animation: ${circuitPulse} 2s ease-in-out infinite;`}
  pointer-events: none;
`;

const RobotSpeechBubble = styled.div`
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.95) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  padding: 6px 12px;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.7rem;
  max-width: 90%;
  text-align: center;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(34, 211, 238, 0.95);
  }
`;

const DataOverlay = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 0.5rem;
  color: rgba(6, 182, 212, 0.7);
  font-family: 'Courier New', monospace;
  font-weight: 600;
  letter-spacing: 1px;
  z-index: 30;
`;

const RobotControlsRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 0.75rem;
  position: relative;
  z-index: 10;
`;

// Mascote Animado (mantido para compatibilidade)
const MascotContainer = styled.div`
  position: relative;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
`;

const SpeechBubble = styled.div`
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.95) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  max-width: 300px;
  box-shadow: 
    0 4px 20px rgba(6, 182, 212, 0.4),
    0 0 30px rgba(34, 211, 238, 0.3);
  position: relative;
  animation: ${bubblePop} 0.3s ease-out;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid rgba(6, 182, 212, 0.95);
  }
`;

// Container do Robô
const RobotContainer = styled.div`
  position: relative;
  width: 120px;
  height: 140px;
  ${css`animation: ${robotFloat} 3s ease-in-out infinite;`}
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 20;
  
  &:hover {
    ${css`animation: ${robotPulse} 1.5s ease-in-out infinite;`}
  }
`;

// Antenas do Robô
const RobotAntenna = styled.div`
  position: absolute;
  top: -24px;
  left: ${props => props.$left ? '35px' : '70px'};
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #06b6d4 0%, #0f172a 100%);
  border-radius: 2px;
  
  &::after {
    content: '';
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background: ${props => props.$left 
      ? 'radial-gradient(circle, #06b6d4 0%, #0891b2 100%)'
      : 'radial-gradient(circle, #22d3ee 0%, #06b6d4 100%)'};
    border-radius: 50%;
    box-shadow: 0 0 12px ${props => props.$left ? '#06b6d4' : '#22d3ee'};
    ${css`animation: ${pulse} 2s ease-in-out infinite;`}
  }
`;

// Cabeça do Robô
const RobotHead = styled.div`
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 60px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid #06b6d4;
  border-radius: 16px;
  box-shadow: 
    0 0 15px rgba(6, 182, 212, 0.4),
    inset 0 6px 15px rgba(6, 182, 212, 0.2),
    inset -3px -3px 10px rgba(0, 0, 0, 0.3);
  ${props => props.$talking ? css`animation: ${robotBounce} 0.5s ease-in-out infinite;` : css`animation: none;`}
  position: relative;
  z-index: 3;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.5), transparent);
    border-radius: 2px;
  }
`;

// Olhos LED do Robô
const RobotEye = styled.div`
  position: absolute;
  top: 20px;
  left: ${props => props.$left ? '16px' : '48px'};
  width: 18px;
  height: 18px;
  background: radial-gradient(circle, #22d3ee 0%, #06b6d4 50%, #0891b2 100%);
  border-radius: 50%;
  box-shadow: 
    0 0 15px rgba(34, 211, 238, 0.8),
    inset 2px 2px 4px rgba(255, 255, 255, 0.3);
  ${css`animation: ${eyeBlink} 4s ease-in-out infinite;`}

  &::before {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 5px;
    height: 5px;
    background: white;
    border-radius: 50%;
    opacity: 0.8;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 6px;
    height: 6px;
    background: #0f172a;
    border-radius: 50%;
  }
`;

// Sensor central do Robô (não usado no novo design)
const RobotSensor = styled.div`
  display: none;
`;

// Alto-falante/Grille do Robô
const RobotSpeaker = styled.div`
  position: absolute;
  top: 44px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 6px;
  background: linear-gradient(90deg, 
    #0f172a 0%, 
    #06b6d4 10%, 
    #0f172a 20%,
    #06b6d4 30%,
    #0f172a 40%,
    #06b6d4 50%,
    #0f172a 60%,
    #06b6d4 70%,
    #0f172a 80%,
    #06b6d4 90%,
    #0f172a 100%
  );
  border-radius: 3px;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
  ${props => props.$talking ? css`animation: ${talk} 0.4s ease-in-out infinite;` : css`animation: none;`}
`;

// Corpo do Robô
const RobotBody = styled.div`
  position: absolute;
  top: 72px;
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 48px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid #06b6d4;
  border-radius: 10px;
  box-shadow: 
    0 0 12px rgba(6, 182, 212, 0.3),
    inset 0 4px 8px rgba(6, 182, 212, 0.1);
  position: relative;

  &::before {
    content: '⚡';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.2rem;
    opacity: 0.7;
  }
`;

// Braços/Mãos do Robô
const RobotArm = styled.div`
  position: absolute;
  top: ${props => props.$front ? '82px' : '86px'};
  left: ${props => props.$left ? '12px' : '94px'};
  width: 8px;
  height: 28px;
  background: linear-gradient(180deg, #0f172a 0%, #06b6d4 50%, #0f172a 100%);
  border: 2px solid #06b6d4;
  border-radius: 4px;
  transform: ${props => props.$left ? 'rotate(15deg)' : 'rotate(-15deg)'};
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);

  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: radial-gradient(circle, #06b6d4 0%, #0891b2 100%);
    border-radius: 50%;
    border: 2px solid #22d3ee;
  }
`;

const MascotAccessory = styled.div`
  position: absolute;
  /* Acessório do robô (ícone) posicionado acima da cabeça */
  top: -146px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11.88rem;
  z-index: 4; /* Entre as antenas (z-index: 5) e a cabeça (z-index: 3) */
  animation: ${pulse} 2s infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

// Canais Compactos
const ChannelsRow = styled.div`
  display: flex;
  gap: 4px;
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
  overflow: visible;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  align-items: stretch;
`;

const ChannelStrip = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
  border: 2px solid rgba(251, 191, 36, 0.5);
  border-radius: 10px;
  padding: 4px;
  min-width: 140px;
  flex: 1;
  max-width: 180px;
  box-sizing: border-box;
  box-shadow: 
    0 8px 25px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  height: 100%;

  &:hover {
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 
      inset 0 1px 2px rgba(255, 255, 255, 0.08),
      inset 0 -2px 4px rgba(0, 0, 0, 0.8),
      0 4px 12px rgba(6, 182, 212, 0.3);
  }
`;

const ChannelLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  color: ${props => props.$color || '#f1f5f9'};
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  width: 100%;
`;

const FaderWrapper = styled.div`
  position: relative;
  width: 40px;
  flex: 1;
  min-height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border-radius: 3px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    inset 0 -1px 2px rgba(255, 255, 255, 0.05),
    0 1px 3px rgba(6, 182, 212, 0.2);
  padding: 8px 4px;
`;

const FaderTrack = styled.div`
  width: 10px;
  height: 100%;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.95) 20%,
    rgba(15, 23, 42, 0.95) 50%,
    rgba(30, 41, 59, 0.95) 80%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border-radius: 2px;
  position: relative;
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-left: 1px solid rgba(6, 182, 212, 0.2);
  border-right: 1px solid rgba(6, 182, 212, 0.4);
  box-shadow: 
    inset 0 3px 8px rgba(0, 0, 0, 0.9),
    inset 0 -1px 2px rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(6, 182, 212, 0.2);
  overflow: visible;
  transition: all 0.1s ease;
  
  /* Marcadores de escala */
  &::before {
    content: '';
    position: absolute;
    left: -18px;
    top: 0;
    width: 15px;
    height: 100%;
    background: linear-gradient(180deg, 
      transparent 0%,
      rgba(100, 100, 110, 0.3) 10%,
      transparent 20%,
      rgba(100, 100, 110, 0.3) 30%,
      transparent 40%,
      rgba(100, 100, 110, 0.3) 50%,
      transparent 60%,
      rgba(100, 100, 110, 0.3) 70%,
      transparent 80%,
      rgba(100, 100, 110, 0.3) 90%,
      transparent 100%
    );
    pointer-events: none;
  }
  
  &:hover {
    border-color: rgba(40, 40, 45, 0.9);
    box-shadow: 
      inset 0 3px 8px rgba(0, 0, 0, 0.9),
      inset 0 -1px 2px rgba(255, 255, 255, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.8);
  }
`;

const FaderFill = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.$value}%;
  background: ${props => {
    const val = props.$value;
    if (val > 85) return 'linear-gradient(180deg, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.2) 100%)';
    if (val > 70) return 'linear-gradient(180deg, rgba(34, 211, 238, 0.4) 0%, rgba(34, 211, 238, 0.2) 100%)';
    return 'linear-gradient(180deg, rgba(6, 182, 212, 0.4) 0%, rgba(6, 182, 212, 0.2) 100%)';
  }};
  border-radius: 2px;
  transition: none;
  will-change: height;
  animation: ${props => props.$isDragging ? faderGlow : 'none'} 0.3s ease-in-out infinite;
  
  /* Handle do fader (knob) */
  &::after {
    content: '';
    position: absolute;
    top: -8px;
    left: -4px;
    right: -4px;
    width: calc(100% + 8px);
    height: 16px;
    background: linear-gradient(180deg, 
      rgba(180, 180, 190, 0.9) 0%,
      rgba(140, 140, 150, 0.9) 30%,
      rgba(100, 100, 110, 0.9) 50%,
      rgba(140, 140, 150, 0.9) 70%,
      rgba(180, 180, 190, 0.9) 100%
    );
    border: 1px solid rgba(60, 60, 70, 0.8);
    border-top: 1px solid rgba(200, 200, 210, 0.6);
    border-bottom: 2px solid rgba(50, 50, 60, 0.9);
    border-radius: 3px;
    box-shadow: 
      inset 0 1px 2px rgba(255, 255, 255, 0.3),
      inset 0 -1px 2px rgba(0, 0, 0, 0.5),
      0 2px 4px rgba(0, 0, 0, 0.6),
      0 0 8px ${props => {
        const val = props.$value;
        if (val > 85) return 'rgba(251, 191, 36, 0.4)';
        if (val > 70) return 'rgba(34, 211, 238, 0.4)';
        return 'rgba(6, 182, 212, 0.4)';
      }};
    cursor: grab;
    z-index: 5;
  }
  
  &:active::after {
    cursor: grabbing;
    box-shadow: 
      inset 0 1px 2px rgba(255, 255, 255, 0.2),
      inset 0 -1px 2px rgba(0, 0, 0, 0.6),
      0 1px 2px rgba(0, 0, 0, 0.8),
      0 0 12px ${props => {
        const val = props.$value;
        if (val > 85) return 'rgba(251, 191, 36, 0.6)';
        if (val > 70) return 'rgba(34, 211, 238, 0.6)';
        return 'rgba(6, 182, 212, 0.6)';
      }};
  }
`;

const FaderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
  writing-mode: vertical-lr;
  direction: rtl;
  -webkit-appearance: none;
  appearance: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  
  &:active {
    cursor: grabbing;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 100%;
    cursor: grab;
  }
  
  &::-webkit-slider-thumb:active {
    cursor: grabbing;
  }
  
  &::-moz-range-thumb {
    width: 100%;
    height: 100%;
    cursor: grab;
    border: none;
    background: transparent;
  }
  
  &::-moz-range-thumb:active {
    cursor: grabbing;
  }
`;

const ValueDisplay = styled.div`
  background: linear-gradient(180deg, 
    rgba(10, 10, 15, 0.95) 0%,
    rgba(5, 5, 10, 0.95) 50%,
    rgba(0, 0, 5, 0.95) 100%
  );
  border: 2px solid rgba(30, 30, 35, 0.8);
  border-top: 1px solid rgba(50, 50, 55, 0.5);
  border-bottom: 2px solid rgba(5, 5, 10, 0.9);
  border-radius: 3px;
  padding: 4px 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.7rem;
  font-weight: 900;
  color: ${props => {
    const val = props.$value;
    if (val > 85) return '#fbbf24';
    if (val > 70) return '#22d3ee';
    return '#06b6d4';
  }};
  text-shadow: 
    0 0 6px ${props => {
      const val = props.$value;
      if (val > 85) return 'rgba(251, 191, 36, 0.8)';
      if (val > 70) return 'rgba(34, 211, 238, 0.8)';
      return 'rgba(6, 182, 212, 0.8)';
    }},
    0 1px 2px rgba(0, 0, 0, 0.9);
  text-align: center;
  min-width: 50px;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.9),
    inset 0 -1px 2px rgba(255, 255, 255, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
`;

const PeakMeter = styled.div`
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.$peak}%;
    background: ${props => {
      const val = props.$peak;
      if (val > 85) return '#ef4444';
      if (val > 70) return '#fbbf24';
      return '#22d3ee';
    }};
    transition: width 0.1s ease;
    box-shadow: 0 0 6px ${props => {
      const val = props.$peak;
      if (val > 85) return 'rgba(239, 68, 68, 0.8)';
      if (val > 70) return 'rgba(251, 191, 36, 0.6)';
      return 'rgba(34, 211, 238, 0.5)';
    }};
  }
`;

// Microfone Destacado
const MicSection = styled.div`
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
  border: 2px solid rgba(251, 191, 36, 0.5);
  border-radius: 10px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 140px;
  flex: 1;
  max-width: 180px;
  box-sizing: border-box;
  box-shadow: 
    0 8px 25px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
      transparent,
      rgba(251, 191, 36, 0.8),
      transparent
    );
  }
`;

const MicButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
  box-sizing: border-box;
`;

const MicTitle = styled.div`
  color: #fbbf24;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
`;

// BOTÃO PUSH-TO-TALK (segure para falar)
const PushToTalkButton = styled.button`
  width: 80px;
  height: 80px;
  min-width: 80px;
  max-width: 80px;
  min-height: 80px;
  max-height: 80px;
  border-radius: 50%;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: 3px solid ${props => props.$active ? '#ef4444' : 'rgba(6, 182, 212, 0.5)'};
  color: white;
  font-size: 1.8rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: ${props => props.$active 
    ? '0 0 40px rgba(239, 68, 68, 0.8), 0 8px 30px rgba(0, 0, 0, 0.4), inset 0 -4px 10px rgba(0, 0, 0, 0.3)'
    : '0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
  };
  transform: ${props => props.$active ? 'scale(0.95)' : 'scale(1)'};
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;

  &:hover:not(:active) {
    border-color: #22d3ee;
    box-shadow: 0 0 25px rgba(6, 182, 212, 0.5), 0 6px 20px rgba(0, 0, 0, 0.4);
  }

  &::before {
    content: '';
    position: absolute;
    width: 60%;
    height: 60%;
    border-radius: 50%;
    background: ${props => props.$active 
      ? 'radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%)'
      : 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)'
    };
    animation: ${props => props.$active ? pulse : 'none'} 0.5s infinite;
  }
`;

const PushToTalkContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  position: relative;

  &::before {
    content: 'SEGURE PARA FALAR';
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 0.6rem;
    font-weight: 800;
    color: #ef4444;
    letter-spacing: 1px;
    white-space: nowrap;
  }
`;

const PushToTalkLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${props => props.$active ? '#ef4444' : '#94a3b8'};
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => props.$active ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'};
`;

const MicButton = styled.button`
  width: 45px;
  height: 45px;
  min-width: 45px;
  max-width: 45px;
  min-height: 45px;
  max-height: 45px;
  border-radius: 50%;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: 2px solid ${props => props.$active ? '#fbbf24' : 'rgba(251, 191, 36, 0.4)'};
  color: white;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active 
    ? '0 0 25px rgba(251, 191, 36, 0.7), 0 6px 20px rgba(0, 0, 0, 0.4)'
    : '0 4px 15px rgba(0, 0, 0, 0.3)'
  };
  animation: ${props => props.$active ? pulse : 'none'} 2s infinite;
  text-transform: uppercase;
  letter-spacing: 1px;

  box-sizing: border-box;
  overflow: hidden;

  &:hover {
    box-shadow: ${props => props.$active 
      ? '0 0 35px rgba(251, 191, 36, 0.9), 0 8px 25px rgba(0, 0, 0, 0.5)'
      : '0 0 20px rgba(251, 191, 36, 0.5), 0 6px 20px rgba(0, 0, 0, 0.4)'
    };
    border-color: #fbbf24;
  }

  &:active {
    transform: none;
  }
`;

const MicVU = styled.div`
  width: 10px;
  height: 100px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 5px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.7);
`;

const MicVUFill = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.$level}%;
  background: linear-gradient(
    to top,
    #22d3ee 0%,
    #22d3ee 60%,
    #fbbf24 60%,
    #fbbf24 85%,
    #ef4444 85%,
    #ef4444 100%
  );
  transition: height 0.1s ease;
  box-shadow: 0 0 15px ${props => {
    const level = props.$level;
    if (level > 85) return 'rgba(239, 68, 68, 0.6)';
    if (level > 60) return 'rgba(251, 191, 36, 0.5)';
    return 'rgba(34, 211, 238, 0.4)';
  }};
`;

const MicStatus = styled.div`
  color: ${props => props.$active ? '#fbbf24' : '#64748b'};
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => props.$active ? '0 0 8px rgba(251, 191, 36, 0.5)' : 'none'};
`;

const MicVULEDContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 20px;
  height: 70px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  border: 1px solid rgba(251, 191, 36, 0.2);
  gap: 1.5px;
  box-sizing: border-box;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
`;

const MicVULED = styled.div`
  width: calc(100% - 2px);
  height: 4px;
  background: ${props => {
    const level = props.$level;
    if (level < 30) return 'rgba(16, 185, 129, 0.5)';
    if (level < 60) return 'rgba(245, 158, 11, 0.6)';
    if (level < 85) return 'rgba(251, 191, 36, 0.7)';
    return 'rgba(239, 68, 68, 0.9)';
  }};
  border-radius: 1px;
  box-shadow: ${props => {
    const level = props.$level;
    const opacity = level / 100;
    if (level < 30) return `0 0 3px rgba(16, 185, 129, ${0.4 + opacity * 0.4})`;
    if (level < 60) return `0 0 4px rgba(245, 158, 11, ${0.5 + opacity * 0.4})`;
    if (level < 85) return `0 0 5px rgba(251, 191, 36, ${0.6 + opacity * 0.4})`;
    return `0 0 6px rgba(239, 68, 68, ${0.7 + opacity * 0.4})`;
  }};
  transition: all 0.05s ease;
  opacity: ${props => props.$active && props.$level > 0 ? 1 : 0.2};
`;

const MicDeviceSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 2px;
  width: calc(100% - 4px);
  padding: 0;
  box-sizing: border-box;
  max-width: 100%;
  overflow: hidden;
  flex-shrink: 0;
`;

const MicDeviceLabel = styled.label`
  color: #cbd5e1;
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
`;

const MicDeviceSelect = styled.select`
  width: 100%;
  padding: 2px 3px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.8);
  color: #f1f5f9;
  font-size: 0.55rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  outline: none;
  max-width: 100%;
  height: 18px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover:not(:disabled) {
    border-color: rgba(251, 191, 36, 0.5);
    background: rgba(15, 23, 42, 0.9);
  }
  
  &:focus {
    border-color: #fbbf24;
    box-shadow: 0 0 6px rgba(251, 191, 36, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  option {
    background: rgba(15, 23, 42, 0.95);
    color: #f1f5f9;
    padding: 2px;
    font-size: 0.55rem;
    white-space: normal;
    word-wrap: break-word;
  }
`;

const MasterChannelContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
  border: 2px solid rgba(251, 191, 36, 0.5);
  border-radius: 10px;
  padding: 4px;
  min-width: 140px;
  flex: 1;
  max-width: 180px;
  box-sizing: border-box;
  box-shadow: 
    0 8px 25px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  height: 100%;
`;

const MasterDeviceSelector = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 0;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
  max-width: 100%;
  overflow: visible;
  flex-shrink: 0;
  position: relative;
  z-index: 10;
`;

const MasterDeviceLabel = styled.label`
  color: #cbd5e1;
  font-size: 0.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1;
`;

const RefreshDevicesButton = styled.button`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f1f5f9;
  width: 45px;
  height: 45px;
  min-width: 45px;
  max-width: 45px;
  min-height: 45px;
  max-height: 45px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 0;
  
  &:hover {
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(15, 23, 42, 0.9);
    transform: rotate(180deg);
  }
  
  &:active {
    transform: rotate(180deg) scale(0.95);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MasterDeviceSelectWrapper = styled.div`
  display: flex;
  gap: 2px;
  width: 100%;
  max-width: 100%;
  align-items: center;
  min-width: 0;
  overflow: hidden;
`;

const MasterDeviceSelect = styled.select`
  flex: 1;
  min-width: 0;
  max-width: calc(100% - 47px);
  padding: 2px 3px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.8);
  color: #f1f5f9;
  font-size: 0.55rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  outline: none;
  height: 18px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &:hover:not(:disabled) {
    border-color: rgba(239, 68, 68, 0.5);
    background: rgba(15, 23, 42, 0.9);
  }
  
  &:focus {
    border-color: #ef4444;
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  option {
    background: rgba(15, 23, 42, 0.95);
    color: #f1f5f9;
    padding: 2px;
    font-size: 0.55rem;
    white-space: normal;
    word-wrap: break-word;
  }
`;

// Auto DJ Styled Components
const AutoDJSection = styled.div`
  margin-top: 4px;
  padding: 4px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-top: 1px solid rgba(6, 182, 212, 0.2);
  border-bottom: 3px solid rgba(6, 182, 212, 0.4);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 210px;
  flex: 1;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -2px 4px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(6, 182, 212, 0.2);
`;

const AutoDJHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AutoDJTitle = styled.div`
  color: #f1f5f9;
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AutoDJStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 6px;
  border-radius: 15px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)'
  };
  border: 1px solid ${props => props.$active ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
  animation: ${props => props.$active ? pulse : 'none'} 2s infinite;
`;

const AutoDJControls = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
`;

const AutoDJControlButton = styled.button`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 2px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  width: 45px;
  height: 45px;
  min-width: 45px;
  max-width: 45px;
  min-height: 45px;
  max-height: 45px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
    border-color: #22d3ee;
    box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const AutoDJPlayPauseButton = styled(AutoDJControlButton)`
  width: 45px;
  height: 45px;
  min-width: 45px;
  max-width: 45px;
  min-height: 45px;
  max-height: 45px;
  font-size: 1.1rem;
  background: ${props => props.$playing 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
  };
  border-color: ${props => props.$playing ? '#22d3ee' : 'rgba(6, 182, 212, 0.4)'};
  box-shadow: ${props => props.$playing 
    ? '0 0 25px rgba(6, 182, 212, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3)'
    : '0 4px 15px rgba(0, 0, 0, 0.3)'
  };
`;

const CrossfadeIndicator = styled.div`
  text-align: center;
  padding: 2px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const NextTrackPreview = styled.div`
  padding: 2px 4px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%);
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.3);
`;

const NextTrackLabel = styled.div`
  font-size: 0.75rem;
  color: #22d3ee;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AutoDJSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const AutoDJSettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AutoDJSettingLabel = styled.label`
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AutoDJToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 45px;
  height: 24px;
  
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(100, 116, 139, 0.5);
    transition: 0.3s;
    border-radius: 24px;
    
    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }
  }
  
  input:checked + span {
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.5);
  }
  
  input:checked + span:before {
    transform: translateX(21px);
  }
  
  input:disabled + span {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AutoDJSlider = styled.input`
  width: 120px;
  height: 5px;
  border-radius: 3px;
  background: rgba(15, 23, 42, 0.8);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    box-shadow: 0 0 12px rgba(6, 182, 212, 0.6);
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 12px rgba(6, 182, 212, 0.6);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AutoDJStats = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`;

const AutoDJStatItem = styled.div`
  flex: 1;
  text-align: center;
  padding: 2px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.2);
`;

const AutoDJStatValue = styled.div`
  font-size: 1rem;
  font-weight: 900;
  color: #fbbf24;
  font-family: 'Courier New', monospace;
  margin-bottom: 3px;
`;

const AutoDJStatLabel = styled.div`
  font-size: 0.65rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

// EQ Compacto
const EQSection = styled.div`
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-top: 1px solid rgba(6, 182, 212, 0.2);
  border-bottom: 3px solid rgba(6, 182, 212, 0.4);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 4px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -2px 4px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(6, 182, 212, 0.2);
`;

const EQHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
`;

const EQTitle = styled.div`
  color: #22d3ee;
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const EQControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const EQRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;
  justify-content: center;
`;

const EQFader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 24px;
  flex: 1;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.8) 0%, 
    rgba(30, 41, 59, 0.8) 50%,
    rgba(15, 23, 42, 0.8) 100%
  );
  padding: 6px 4px;
  border-radius: 3px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.6),
    inset 0 -1px 2px rgba(255, 255, 255, 0.03),
    0 1px 2px rgba(6, 182, 212, 0.1);
`;

const EQFaderTrack = styled.div`
  width: 16px;
  height: 180px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.95) 20%,
    rgba(15, 23, 42, 0.95) 50%,
    rgba(30, 41, 59, 0.95) 80%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border-radius: 2px;
  position: relative;
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-left: 1px solid rgba(6, 182, 212, 0.2);
  border-right: 1px solid rgba(6, 182, 212, 0.4);
  box-shadow: 
    inset 0 3px 8px rgba(0, 0, 0, 0.9),
    inset 0 -1px 2px rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(6, 182, 212, 0.2);
  overflow: hidden;
  
  /* Marcadores de escala */
  &::before {
    content: '';
    position: absolute;
    left: -18px;
    top: 0;
    width: 15px;
    height: 100%;
    background: linear-gradient(180deg, 
      transparent 0%,
      rgba(100, 100, 110, 0.3) 10%,
      transparent 20%,
      rgba(100, 100, 110, 0.3) 30%,
      transparent 40%,
      rgba(100, 100, 110, 0.3) 50%,
      transparent 60%,
      rgba(100, 100, 110, 0.3) 70%,
      transparent 80%,
      rgba(100, 100, 110, 0.3) 90%,
      transparent 100%
    );
    pointer-events: none;
  }
  
  &:hover {
    border-color: rgba(6, 182, 212, 0.5);
    box-shadow: 
      inset 0 3px 8px rgba(0, 0, 0, 0.9),
      inset 0 -1px 2px rgba(255, 255, 255, 0.15),
      0 2px 4px rgba(6, 182, 212, 0.3);
  }
`;

const EQFaderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
  writing-mode: vertical-lr;
  direction: rtl;
  -webkit-appearance: none;
  appearance: none;
`;

const EQLabel = styled.div`
  font-size: 0.5rem;
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
`;

const EffectsSection = styled.div`
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-top: 1px solid rgba(139, 92, 246, 0.2);
  border-bottom: 3px solid rgba(139, 92, 246, 0.4);
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -2px 4px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(139, 92, 246, 0.2);
`;

const EffectsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const EffectsTitle = styled.div`
  color: #a78bfa;
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const EffectPanel = styled.div`
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 4px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EffectHeader = styled.div`
  display: flex;
  align-items: center;
`;

const EffectLabel = styled.label`
  font-size: 0.65rem;
  color: #c4b5fd;
  font-weight: 600;
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const EffectControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 18px;
`;

const EffectControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EffectControlLabel = styled.label`
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 500;
`;

const EffectSlider = styled.input`
  width: 100%;
  height: 4px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
    border: 1px solid rgba(139, 92, 246, 0.5);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
    border: 1px solid rgba(139, 92, 246, 0.5);
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  }
`;

const Fader = ({ label, color, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const startValueRef = useRef(value);
  const startYRef = useRef(0);
  const faderRef = useRef(null);
  
  const handleMouseDown = (e) => {
    if (faderRef.current) {
      const rect = faderRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const height = rect.height;
      const clickPercent = ((height - clickY) / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, clickPercent)));
      
      startValueRef.current = newValue;
      startYRef.current = e.clientY;
      onChange(newValue);
    }
    isDraggingRef.current = true;
    setIsDragging(true);
  };
  
  const handleMouseMove = (e) => {
    if (isDraggingRef.current && faderRef.current) {
      const rect = faderRef.current.getBoundingClientRect();
      const deltaY = startYRef.current - e.clientY;
      const height = rect.height;
      const deltaPercent = (deltaY / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, startValueRef.current + deltaPercent)));
      onChange(newValue);
    }
  };
  
  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
  
  const handleMouseDownWithMove = (e) => {
    handleMouseDown(e);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleChange = (e) => {
    if (!isDraggingRef.current) {
      const newValue = parseInt(e.target.value);
      startValueRef.current = newValue;
      onChange(newValue);
    }
  };
  
  return (
    <ChannelStrip>
      <ChannelLabel $color={color}>{label}</ChannelLabel>
      <PeakMeter $peak={value} />
      <FaderWrapper>
        <FaderInput
          ref={faderRef}
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={handleChange}
          onInput={handleChange}
          onMouseDown={handleMouseDownWithMove}
          onTouchStart={(e) => {
            if (faderRef.current) {
              const touch = e.touches[0];
              const rect = faderRef.current.getBoundingClientRect();
              const touchY = touch.clientY - rect.top;
              const height = rect.height;
              const touchPercent = ((height - touchY) / height) * 100;
              const newValue = Math.round(Math.max(0, Math.min(100, touchPercent)));
              startValueRef.current = newValue;
              startYRef.current = touch.clientY;
              onChange(newValue);
            }
            isDraggingRef.current = true;
            setIsDragging(true);
          }}
          onTouchMove={(e) => {
            if (isDraggingRef.current && faderRef.current) {
              const touch = e.touches[0];
              const rect = faderRef.current.getBoundingClientRect();
              const deltaY = startYRef.current - touch.clientY;
              const height = rect.height;
              const deltaPercent = (deltaY / height) * 100;
              const newValue = Math.max(0, Math.min(100, startValueRef.current + deltaPercent));
              onChange(newValue);
            }
          }}
          onTouchEnd={handleMouseUp}
          onTouchCancel={handleMouseUp}
        />
        <FaderTrack $isDragging={isDragging}>
          <FaderFill $value={value} $isDragging={isDragging} />
        </FaderTrack>
      </FaderWrapper>
      <ValueDisplay $value={value}>
        {value}%
      </ValueDisplay>
    </ChannelStrip>
  );
};

const MixerConsole = ({ 
  onMicStreamChange, 
  micGain = 0,
  // Audio props para VU Meter
  musicAudioRef = null,
  audioContext = null,
  mediaElementSource = null,
  // Props para expor controle do microfone
  onMicActiveChange = null,
  micToggleRef = null,
  // Auto DJ Props
  tracks = [],
  currentTrackId = null,
  isPlaying = false,
  autoDJ = false,
  setAutoDJ = () => {},
  shuffleMode = false,
  setShuffleMode = () => {},
  crossfadeDuration = 3,
  setCrossfadeDuration = () => {},
  playHistory = [],
  nextTrackPreview = null,
  isCrossfading = false,
  onPlayNext = () => {},
  onPlayPrevious = () => {},
  onTogglePlay = () => {},
  onPlayTrack = () => {},
  getNextTrack = () => null,
  // Jingle Audio Refs - para controlar o volume dos jingles
  jingleAudioRefs = null,
  // Socket para interação com chat e pedidos
  socket = null,
  // Lista de pedidos de música
  songRequests = [],
  // Callback para adicionar música à fila (para auto atendimento)
  onAddToQueue = null,
  // Callback para baixar música da internet
  onDownloadAndAddMusic = null,
  // Callback para rejeitar pedido
  onRejectRequest = null,
  // MediaStreamDestination para broadcast (opcional)
  mediaStreamDestination = null,
  // Hub (GainNode) para distribuir áudio - se fornecido, conectar a ele em vez de diretamente ao destination
  audioHub = null,
  // Callback para quando o mascote começar a falar
  onMascotStartSpeaking = null,
  // Callback para quando o mascote parar de falar
  onMascotStopSpeaking = null,
  // Callback para enviar comando de voz para ouvintes
  onVoiceCommand = null,
  // Callback para comandos de controle do DJ (transmissão, autoDJ, etc)
  onDJCommand = null,
  // Estado atual da transmissão
  isBroadcasting = false
}) => {
  const [channels, setChannels] = useState({
    master: 80,
    music: 75,
    mic: 0,
    fx: 65
  });


  const [eq, setEq] = useState({
    band31: 50,    // 31Hz
    band62: 50,    // 62Hz
    band125: 50,   // 125Hz
    band250: 50,   // 250Hz
    band500: 50,   // 500Hz
    band1k: 50,    // 1kHz
    band2k: 50,    // 2kHz
    band4k: 50,    // 4kHz
    band8k: 50,    // 8kHz
    band16k: 50    // 16kHz
  });

  // Efeitos profissionais
  const [effects, setEffects] = useState({
    compressor: {
      enabled: false,
      threshold: -24,    // dB
      ratio: 4,          // 4:1
      attack: 0.003,     // 3ms
      release: 0.25      // 250ms
    },
    reverb: {
      enabled: false,
      roomSize: 0.5,     // 0-1
      dampening: 0.5,    // 0-1
      wet: 0.3          // 0-1
    },
    delay: {
      enabled: false,
      time: 0.25,        // segundos
      feedback: 0.3,     // 0-1
      wet: 0.2          // 0-1
    }
  });

  const [eqEnabled, setEqEnabled] = useState(true);
  
  // VU Meter removido
  
  // Estados do Mascote
  const [mascotEnabled, setMascotEnabled] = useState(true);
  const [mascotMessage, setMascotMessage] = useState('');
  const [mascotMessagesHistory, setMascotMessagesHistory] = useState([]);
  const [isMascotTalking, setIsMascotTalking] = useState(false);
  const messagesScrollRef = useRef(null);
  
  const [mascotData, setMascotData] = useState(null);
  const [mascotLevel, setMascotLevel] = useState(1);
  const [mascotExperience, setMascotExperience] = useState(0);
  const [mascotExperienceToNextLevel, setMascotExperienceToNextLevel] = useState(100);
  const lastRequestIdRef = useRef(null);
  const lastMessageIdRef = useRef(null);
  const greetedUsersRef = useRef(new Set()); // Rastrear usuários já saudados
  const speechSynthesisRef = useRef(null);
  const originalMusicVolumeRef = useRef(null);
  const mascotAudioContextRef = useRef(null);
  const mascotMediaStreamDestinationRef = useRef(null);
  const mascotGainNodeRef = useRef(null);
  const isSpeakingRef = useRef(false);
  
  
  // ============================================
  // PUSH-TO-TALK STATES
  // ============================================
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [pushToTalkVuLevel, setPushToTalkVuLevel] = useState(0);
  const pushToTalkStreamRef = useRef(null);
  const pushToTalkAudioContextRef = useRef(null);
  const pushToTalkAnalyserRef = useRef(null);
  const pushToTalkAnimationRef = useRef(null);
  const pushToTalkGainNodeRef = useRef(null);
  const pushToTalkSourceRef = useRef(null);
  const pushToTalkRecognitionRef = useRef(null);
  const [lastVoiceCommand, setLastVoiceCommand] = useState('');
  
  // Função para iniciar push-to-talk
  const startPushToTalk = useCallback(async () => {
    if (isPushToTalkActive) return;
    
    try {
      console.log('🎤 Iniciando Push-to-Talk...');
      
      // Criar AudioContext
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      pushToTalkAudioContextRef.current = audioContext;
      
      // Criar analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      pushToTalkAnalyserRef.current = analyser;
      
      // Criar gain node
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 2.0; // Boost do microfone
      pushToTalkGainNodeRef.current = gainNode;
      
      // Solicitar acesso ao microfone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      pushToTalkStreamRef.current = stream;
      
      // Criar source do stream
      const source = audioContext.createMediaStreamSource(stream);
      pushToTalkSourceRef.current = source;
      
      // Conectar: source -> gainNode -> analyser
      source.connect(gainNode);
      gainNode.connect(analyser);
      
      // Criar destination para transmissão
      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);
      
      // Enviar stream para o callback
      if (onMicStreamChange) {
        onMicStreamChange(destination.stream);
      }
      
      // Iniciar reconhecimento de voz
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';
        
        recognition.onresult = (event) => {
          const last = event.results.length - 1;
          const command = event.results[last][0].transcript.toLowerCase().trim();
          
          if (event.results[last].isFinal) {
            console.log('🎤 Comando de voz detectado:', command);
            setLastVoiceCommand(command);
            
            // Verificar e executar comandos de controle do DJ
            if (onDJCommand) {
              // Ligar transmissão
              if (command.includes('ligar') && (command.includes('transmissão') || command.includes('transmissao'))) {
                console.log('🎙️ Comando: LIGAR TRANSMISSÃO');
                onDJCommand('start_broadcast');
              }
              // Parar transmissão
              else if ((command.includes('parar') || command.includes('desligar')) && (command.includes('transmissão') || command.includes('transmissao'))) {
                console.log('🎙️ Comando: PARAR TRANSMISSÃO');
                onDJCommand('stop_broadcast');
              }
              // Ligar AutoDJ
              else if (command.includes('ligar') && (command.includes('auto dj') || command.includes('autodj') || command.includes('auto-dj'))) {
                console.log('🎙️ Comando: LIGAR AUTO DJ');
                onDJCommand('enable_autodj');
              }
              // Desligar AutoDJ
              else if ((command.includes('desligar') || command.includes('parar')) && (command.includes('auto dj') || command.includes('autodj') || command.includes('auto-dj'))) {
                console.log('🎙️ Comando: DESLIGAR AUTO DJ');
                onDJCommand('disable_autodj');
              }
              // Ativar busca automática
              else if (command.includes('ativar') && command.includes('busca') && (command.includes('automática') || command.includes('automatica'))) {
                console.log('🎙️ Comando: ATIVAR BUSCA AUTOMÁTICA');
                onDJCommand('enable_auto_search');
              }
              // Desativar busca automática
              else if (command.includes('desativar') && command.includes('busca') && (command.includes('automática') || command.includes('automatica'))) {
                console.log('🎙️ Comando: DESATIVAR BUSCA AUTOMÁTICA');
                onDJCommand('disable_auto_search');
              }
              // Próxima música
              else if ((command.includes('próxima') || command.includes('proxima')) && command.includes('música')) {
                console.log('🎙️ Comando: PRÓXIMA MÚSICA');
                onDJCommand('next_track');
              }
              // Música anterior
              else if ((command.includes('anterior') || command.includes('volta')) && command.includes('música')) {
                console.log('🎙️ Comando: MÚSICA ANTERIOR');
                onDJCommand('previous_track');
              }
              // Play/Pause
              else if (command.includes('pausar') || command.includes('pause')) {
                console.log('🎙️ Comando: PAUSAR');
                onDJCommand('pause');
              }
              else if (command.includes('tocar') || command.includes('play') || command.includes('reproduzir')) {
                console.log('🎙️ Comando: TOCAR');
                onDJCommand('play');
              }
            }
            
            // Enviar comando via socket para os ouvintes
            if (socket && socket.connected) {
              socket.emit('dj:voice:command', {
                command: command,
                timestamp: Date.now()
              });
              console.log('📡 Comando de voz enviado para ouvintes:', command);
            }
            
            // Callback opcional
            if (onVoiceCommand) {
              onVoiceCommand(command);
            }
          }
        };
        
        recognition.onerror = (event) => {
          console.warn('⚠️ Erro no reconhecimento de voz:', event.error);
        };
        
        recognition.start();
        pushToTalkRecognitionRef.current = recognition;
        console.log('✅ Reconhecimento de voz iniciado');
      }
      
      // Animar VU Meter
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateVU = () => {
        if (!pushToTalkStreamRef.current) return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, (average / 255) * 100 * 2);
        setPushToTalkVuLevel(level);
        
        pushToTalkAnimationRef.current = requestAnimationFrame(updateVU);
      };
      
      updateVU();
      setIsPushToTalkActive(true);
      console.log('✅ Push-to-Talk ativado!');
      
    } catch (err) {
      console.error('❌ Erro ao iniciar Push-to-Talk:', err);
      alert('Erro ao acessar o microfone. Verifique as permissões.');
    }
  }, [isPushToTalkActive, socket, onMicStreamChange, onVoiceCommand, onDJCommand]);
  
  // Função para parar push-to-talk
  const stopPushToTalk = useCallback(() => {
    if (!isPushToTalkActive) return;
    
    console.log('🎤 Parando Push-to-Talk...');
    
    // Parar reconhecimento de voz
    if (pushToTalkRecognitionRef.current) {
      pushToTalkRecognitionRef.current.stop();
      pushToTalkRecognitionRef.current = null;
    }
    
    // Parar animação
    if (pushToTalkAnimationRef.current) {
      cancelAnimationFrame(pushToTalkAnimationRef.current);
      pushToTalkAnimationRef.current = null;
    }
    
    // Parar stream
    if (pushToTalkStreamRef.current) {
      pushToTalkStreamRef.current.getTracks().forEach(track => track.stop());
      pushToTalkStreamRef.current = null;
    }
    
    // Desconectar nodes
    if (pushToTalkSourceRef.current) {
      try { pushToTalkSourceRef.current.disconnect(); } catch (e) {}
      pushToTalkSourceRef.current = null;
    }
    
    if (pushToTalkGainNodeRef.current) {
      try { pushToTalkGainNodeRef.current.disconnect(); } catch (e) {}
      pushToTalkGainNodeRef.current = null;
    }
    
    // Fechar AudioContext
    if (pushToTalkAudioContextRef.current && pushToTalkAudioContextRef.current.state !== 'closed') {
      pushToTalkAudioContextRef.current.close();
      pushToTalkAudioContextRef.current = null;
    }
    
    // Notificar que o stream parou
    if (onMicStreamChange) {
      onMicStreamChange(null);
    }
    
    setPushToTalkVuLevel(0);
    setIsPushToTalkActive(false);
    console.log('✅ Push-to-Talk desativado!');
  }, [isPushToTalkActive, onMicStreamChange]);
  
  // Handlers para o botão push-to-talk (mouse e touch)
  const handlePushToTalkMouseDown = useCallback((e) => {
    e.preventDefault();
    startPushToTalk();
  }, [startPushToTalk]);
  
  const handlePushToTalkMouseUp = useCallback((e) => {
    e.preventDefault();
    stopPushToTalk();
  }, [stopPushToTalk]);
  
  const handlePushToTalkTouchStart = useCallback((e) => {
    e.preventDefault();
    startPushToTalk();
  }, [startPushToTalk]);
  
  const handlePushToTalkTouchEnd = useCallback((e) => {
    e.preventDefault();
    stopPushToTalk();
  }, [stopPushToTalk]);
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (isPushToTalkActive) {
        stopPushToTalk();
      }
    };
  }, []);
  
  const mascotMessages = useMemo(() => [
    'Olá! Como posso ajudar?',
    'Tocando suas músicas favoritas!',
    'Ajuste o som como preferir!',
    'Estou aqui para você!',
    'Que música você quer ouvir?',
    'Tudo funcionando perfeitamente!',
    'Pronto para começar!',
    'Vamos animar a festa!'
  ], []);
  
  // Função para criar voz robótica (AI Assistente)
  const createRobotVoice = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis não suportado neste navegador');
      return null;
    }
    
    const voices = window.speechSynthesis.getVoices();
    
    // Priorizar vozes masculinas graves ou sintéticas para som robótico
    // Vozes masculinas mais graves soam mais como androides
    let selectedVoice = voices.find(voice => 
      voice.lang.includes('pt') && 
      (voice.name.includes('Masculina') || 
       voice.name.includes('Male') || 
       voice.name.toLowerCase().includes('synthetic') ||
       voice.name.toLowerCase().includes('sintética') ||
       voice.name.toLowerCase().includes('robot') ||
       voice.name.toLowerCase().includes('robô'))
    );
    
    // Se não encontrar, procurar por qualquer voz masculina (vozes masculinas são mais graves)
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.includes('pt') && 
        (voice.name.toLowerCase().includes('male') || 
         voice.name.toLowerCase().includes('masculina') ||
         voice.name.toLowerCase().includes('man') ||
         voice.name.toLowerCase().includes('homem'))
      );
    }
    
    // Se ainda não encontrar, usar qualquer voz em português
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('pt'));
    }
    
    // Se ainda não encontrar, usar a primeira voz disponível
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
    
    return selectedVoice;
  }, []);
  
  // Função para fazer o robô falar com TTS
  const makeMascotSpeak = useCallback(async (text, shouldLowerMusic = true) => {
    if (isSpeakingRef.current) {
      // Se já está falando, cancelar a fala anterior e restaurar volume
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
        // Restaurar volume antes de iniciar nova fala
        if (musicAudioRef && musicAudioRef.current && originalMusicVolumeRef.current !== null) {
          musicAudioRef.current.volume = originalMusicVolumeRef.current;
          originalMusicVolumeRef.current = null;
        }
      }
    }
    
    if (!('speechSynthesis' in window)) {
      // Fallback: apenas mostrar mensagem visual
      setIsMascotTalking(true);
      setMascotMessage(text);
      setTimeout(() => {
        setIsMascotTalking(false);
      }, 3000);
      return;
    }
    
    isSpeakingRef.current = true;
    setIsMascotTalking(true);
    setMascotMessage(text);
    
    // Sempre reduzir volume da música quando o mascote falar
    if (shouldLowerMusic && musicAudioRef && musicAudioRef.current) {
      // Sempre salvar o volume atual antes de reduzir (atualizar caso já exista)
      originalMusicVolumeRef.current = musicAudioRef.current.volume;
      console.log('🔊 Volume original salvo:', originalMusicVolumeRef.current);
      
      // Reduzir volume da música para 30% do original
      const reducedVolume = originalMusicVolumeRef.current * 0.3;
      musicAudioRef.current.volume = reducedVolume;
      console.log('🔉 Volume reduzido para:', reducedVolume, '(original:', originalMusicVolumeRef.current, ')');
    }
    
    // Notificar que o mascote começou a falar
    if (onMascotStartSpeaking) {
      onMascotStartSpeaking();
    }
    
    // Aguardar vozes carregarem
    await new Promise((resolve) => {
      if (window.speechSynthesis.getVoices().length > 0) {
        resolve();
      } else {
        window.speechSynthesis.onvoiceschanged = resolve;
      }
    });
    
    const voice = createRobotVoice();
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      // Configurar voz androide/robótica (AI Assistente)
      utterance.lang = 'pt-BR';
      // Pitch ligeiramente mais baixo (0.8-1.0) para soar como robô mas ainda natural
      utterance.pitch = 0.8 + (Math.random() * 0.2); // Entre 0.8 e 1.0 (voz ligeiramente grave mas natural)
      // Velocidade normalizada para soar natural
      utterance.rate = 1.0 + (Math.random() * 0.1); // Entre 1.0 e 1.1 (velocidade normal a ligeiramente rápida)
      utterance.volume = 1.0; // Volume máximo
      
      // Usar o texto original sem processamento extra para manter naturalidade
      utterance.text = text;
      
      utterance.onstart = () => {
        console.log('🤖 AI Assistente começou a falar:', text);
      };
      
      // Função auxiliar para restaurar volume
      const restoreMusicVolume = () => {
        if (shouldLowerMusic && musicAudioRef && musicAudioRef.current && originalMusicVolumeRef.current !== null) {
          const restoredVolume = originalMusicVolumeRef.current;
          musicAudioRef.current.volume = restoredVolume;
          console.log('🔊 Volume restaurado automaticamente para:', restoredVolume);
          originalMusicVolumeRef.current = null;
        }
      };
      
      utterance.onend = () => {
        console.log('🤖 AI Assistente terminou de falar');
        isSpeakingRef.current = false;
        setIsMascotTalking(false);
        
        // Restaurar volume original da música automaticamente
        restoreMusicVolume();
        
        // Notificar que o mascote parou de falar
        if (onMascotStopSpeaking) {
          onMascotStopSpeaking();
        }
        
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('Erro no TTS:', error);
        isSpeakingRef.current = false;
        setIsMascotTalking(false);
        
        // Restaurar volume original da música mesmo em caso de erro
        if (shouldLowerMusic && musicAudioRef && musicAudioRef.current && originalMusicVolumeRef.current !== null) {
          const restoredVolume = originalMusicVolumeRef.current;
          musicAudioRef.current.volume = restoredVolume;
          console.log('🔊 Volume restaurado após erro:', restoredVolume);
          originalMusicVolumeRef.current = null;
        }
        
        if (onMascotStopSpeaking) {
          onMascotStopSpeaking();
        }
        
        resolve();
      };
      
      // Listener adicional para garantir restauração do volume caso onend não seja chamado
      utterance.onpause = () => {
        console.log('🤖 AI Assistente pausou de falar');
      };
      
      utterance.onresume = () => {
        console.log('🤖 AI Assistente retomou a falar');
      };
      
      speechSynthesisRef.current = utterance;
      
      // Sistema de verificação periódica para garantir restauração do volume
      // Isso garante que o volume seja restaurado mesmo se o evento onend não for chamado
      let volumeRestoreInterval = null;
      let lastSpeakingState = true;
      
      const checkAndRestoreVolume = () => {
        const isCurrentlySpeaking = window.speechSynthesis.speaking || window.speechSynthesis.pending;
        
        // Se estava falando e agora não está mais, restaurar volume
        if (lastSpeakingState && !isCurrentlySpeaking && isSpeakingRef.current) {
          console.log('🔊 Detecção automática: speechSynthesis parou - restaurando volume');
          isSpeakingRef.current = false;
          setIsMascotTalking(false);
          restoreMusicVolume();
          
          if (onMascotStopSpeaking) {
            onMascotStopSpeaking();
          }
          
          if (volumeRestoreInterval) {
            clearInterval(volumeRestoreInterval);
            volumeRestoreInterval = null;
          }
        }
        
        lastSpeakingState = isCurrentlySpeaking;
      };
      
      // Verificar periodicamente enquanto deveria estar falando
      volumeRestoreInterval = setInterval(checkAndRestoreVolume, 200); // Verificar a cada 200ms
      
      // Limpar intervalo quando terminar de falar
      const originalOnEnd = utterance.onend;
      utterance.onend = () => {
        if (volumeRestoreInterval) {
          clearInterval(volumeRestoreInterval);
          volumeRestoreInterval = null;
        }
        if (originalOnEnd) {
          originalOnEnd();
        }
      };
      
      const originalOnError = utterance.onerror;
      utterance.onerror = (error) => {
        if (volumeRestoreInterval) {
          clearInterval(volumeRestoreInterval);
          volumeRestoreInterval = null;
        }
        if (originalOnError) {
          originalOnError(error);
        }
      };
      
      // Limpeza de segurança após 60 segundos
      setTimeout(() => {
        if (volumeRestoreInterval) {
          clearInterval(volumeRestoreInterval);
          volumeRestoreInterval = null;
          // Forçar restauração se ainda não foi restaurado
          if (isSpeakingRef.current) {
            console.log('🔊 Timeout: forçando restauração do volume');
            isSpeakingRef.current = false;
            setIsMascotTalking(false);
            restoreMusicVolume();
            
            if (onMascotStopSpeaking) {
              onMascotStopSpeaking();
            }
          }
        }
      }, 60000); // 60 segundos de timeout
      
      window.speechSynthesis.speak(utterance);
    });
  }, [musicAudioRef, createRobotVoice, onMascotStartSpeaking, onMascotStopSpeaking]);
  
  // Função para fazer o robô falar (versão visual apenas)
  const makeMascotTalk = useCallback((message, duration = 3000) => {
    setIsMascotTalking(true);
    setMascotMessage(message);
    
    setTimeout(() => {
      setIsMascotTalking(false);
    }, duration);
  }, []);
  
  
  // Efeito para reagir a novos pedidos de música via songRequests prop
  useEffect(() => {
    if (!mascotEnabled || !songRequests || songRequests.length === 0) return;
    
    // Pegar o último pedido
    const lastRequest = songRequests[songRequests.length - 1];
    
    // Verificar se é um pedido novo
    if (lastRequest && lastRequest.id !== lastRequestIdRef.current) {
      lastRequestIdRef.current = lastRequest.id;
      
      // Processar pedido com filtro de profanidade
      const processRequest = async () => {
        try {
          const result = await mascotService.processRequest(lastRequest);
          
          if (result.blocked) {
            // Pedido bloqueado - mostrar mensagem educada
            makeMascotSpeak(result.politeMessage, true);
            if (result.mascot) {
              setMascotLevel(result.mascot.level);
            }
            return;
          }
          
          // Atualizar experiência se o mascote ganhou
          if (result.experience) {
            setMascotLevel(result.experience.newLevel);
            setMascotExperience(result.experience.experience);
            setMascotExperienceToNextLevel(result.experience.experienceToNextLevel);
            
            if (result.experience.leveledUp) {
              makeMascotSpeak(`Uau! Subi para o nível ${result.experience.newLevel}!`, true);
            }
          }
          
          // Fazer o robô falar com voz
          const userName = lastRequest.user || 'Ouvinte';
          const message = `Vou realizar seu desejo, ${userName}!`;
          makeMascotSpeak(message, true);
        } catch (error) {
          console.error('Erro ao processar pedido:', error);
          // Fallback: falar normalmente se houver erro
          const userName = lastRequest.user || 'Ouvinte';
          const message = `Vou realizar seu desejo, ${userName}!`;
          makeMascotSpeak(message, true);
        }
      };
      
      processRequest();
    }
  }, [mascotEnabled, songRequests, makeMascotSpeak]);
  
  // Efeito para escutar eventos de pedidos via socket (backup)
  useEffect(() => {
    if (!mascotEnabled || !socket || !socket.connected) return;
    
    const handleNewRequest = (request) => {
      console.log('Mascote: Novo pedido recebido via socket!', request);
      
      // Verificar se é um pedido novo
      if (request && request.id !== lastRequestIdRef.current) {
        lastRequestIdRef.current = request.id;
        
        // Fazer o robô falar com voz
        const userName = request.user || 'Ouvinte';
        const message = `Vou realizar seu desejo, ${userName}!`;
        makeMascotSpeak(message, true);
      }
    };
    
    socket.on('chat:request', handleNewRequest);
    
    return () => {
      if (socket) {
        socket.off('chat:request', handleNewRequest);
      }
    };
  }, [mascotEnabled, socket, makeMascotSpeak]);
  
  // Funções auxiliares para busca de músicas (reutilizadas do AutoRequestProcessor)
  const normalizeString = useCallback((str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .trim();
  }, []);

  const extractKeywords = useCallback((str) => {
    if (!str) return [];
    const normalized = normalizeString(str);
    return normalized.split(/\s+/).filter(word => word.length > 2);
  }, [normalizeString]);

  const calculateSimilarity = useCallback((str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    
    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 80;
    
    const words1 = extractKeywords(s1);
    const words2 = extractKeywords(s2);
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = (commonWords.length / Math.max(words1.length, words2.length)) * 100;
    
    return similarity;
  }, [normalizeString, extractKeywords]);

  // Função para buscar música na biblioteca (baseada no AutoRequestProcessor)
  const findTrackInLibrary = useCallback((songTitle, songArtist) => {
    if (!songTitle && !songArtist) return null;
    if (!tracks || tracks.length === 0) return null;
    
    const normalizedTitle = normalizeString(songTitle || '');
    const normalizedArtist = normalizeString(songArtist || '');
    const titleKeywords = extractKeywords(songTitle || '');
    const artistKeywords = extractKeywords(songArtist || '');
    
    const tracksWithScore = tracks.map(track => {
      const trackTitle = normalizeString(track.title || track.name || track.filename || '');
      const trackArtist = normalizeString(track.artist || '');
      const trackFilename = normalizeString(track.filename || track.name || '');
      
      let score = 0;
      
      // Busca exata
      if (normalizedTitle && trackTitle === normalizedTitle) score += 100;
      if (normalizedArtist && trackArtist === normalizedArtist) score += 100;
      
      // Busca exata combinada
      if (normalizedTitle && normalizedArtist) {
        const combined = `${trackTitle} ${trackArtist}`;
        const searchCombined = `${normalizedTitle} ${normalizedArtist}`;
        if (combined === searchCombined) score += 90;
      }
      
      // Título contém termo de busca
      if (normalizedTitle) {
        if (trackTitle.includes(normalizedTitle)) score += 70;
        if (normalizedTitle.includes(trackTitle)) score += 70;
      }
      
      // Artista contém termo de busca
      if (normalizedArtist && trackArtist) {
        if (trackArtist.includes(normalizedArtist)) score += 60;
        if (normalizedArtist.includes(trackArtist)) score += 60;
      }
      
      // Palavras-chave do título
      if (titleKeywords.length > 0) {
        const titleMatches = titleKeywords.filter(kw => trackTitle.includes(kw)).length;
        score += (titleMatches / titleKeywords.length) * 50;
      }
      
      // Palavras-chave do artista
      if (artistKeywords.length > 0 && trackArtist) {
        const artistMatches = artistKeywords.filter(kw => trackArtist.includes(kw)).length;
        score += (artistMatches / artistKeywords.length) * 40;
      }
      
      // Busca no filename
      if (normalizedTitle && trackFilename.includes(normalizedTitle)) score += 30;
      if (normalizedArtist && trackFilename.includes(normalizedArtist)) score += 20;
      
      // Similaridade calculada
      if (normalizedTitle) {
        const titleSim = calculateSimilarity(trackTitle, normalizedTitle);
        score += titleSim * 0.4;
      }
      if (normalizedArtist && trackArtist) {
        const artistSim = calculateSimilarity(trackArtist, normalizedArtist);
        score += artistSim * 0.3;
      }
      
      // Busca combinada
      if (normalizedTitle && normalizedArtist) {
        const combined = `${trackTitle} ${trackArtist}`;
        const searchCombined = `${normalizedTitle} ${normalizedArtist}`;
        if (combined.includes(searchCombined) || searchCombined.includes(combined)) {
          score += 50;
        }
      }
      
      return { track, score };
    });
    
    tracksWithScore.sort((a, b) => b.score - a.score);
    
    const bestMatch = tracksWithScore[0];
    if (bestMatch && bestMatch.score >= 30) {
      return bestMatch.track;
    }
    
    return null;
  }, [tracks, normalizeString, extractKeywords, calculateSimilarity]);

  // Função para detectar se uma mensagem contém um pedido de música
  const detectSongRequest = useCallback((text) => {
    if (!text || typeof text !== 'string') return null;
    
    const lowerText = text.toLowerCase().trim();
    
    // Palavras-chave que indicam pedido de música
    const requestKeywords = [
      'quero ouvir', 'quero escutar', 'toca', 'tocar', 'coloque', 'coloca',
      'ponha', 'ponha para tocar', 'toca pra mim', 'toca ai', 'toca essa',
      'pedido', 'pedir', 'pedindo', 'pede', 'quero a música', 'quero a musica',
      'quero música', 'quero musica', 'quero a', 'por favor', 'pf', 'pode tocar',
      'pode tocar', 'toca por favor', 'toca ai por favor', 'coloque por favor',
      'quero que toque', 'quero que coloque', 'toca a música', 'toca a musica',
      'coloca a música', 'coloca a musica', 'toca essa música', 'toca essa musica',
      'toque', 'tocando', 'tocar', 'música', 'musica', 'música de', 'musica de',
      'artista', 'cantor', 'cantora', 'banda', 'álbum', 'album'
    ];
    
    // Verificar se contém palavras-chave de pedido
    const hasRequestKeyword = requestKeywords.some(keyword => lowerText.includes(keyword));
    
    if (!hasRequestKeyword) return null;
    
    // Tentar extrair título e artista da mensagem
    // Padrões comuns: "toca Nome da Música", "toca Nome da Música - Artista", "quero ouvir Nome da Música"
    
    // Remover palavras de pedido para obter o nome da música
    let cleanedText = lowerText;
    requestKeywords.forEach(keyword => {
      cleanedText = cleanedText.replace(new RegExp(keyword, 'gi'), '');
    });
    
    // Remover pontuação excessiva
    cleanedText = cleanedText.replace(/[.,!?;:]+/g, ' ').trim();
    
    // Tentar identificar separador artista (por, de, -)
    let songTitle = '';
    let songArtist = '';
    
    // Procurar por separadores
    const separators = [' - ', ' de ', ' por ', ' do ', ' da ', ' dos ', ' das ', ' / '];
    let foundSeparator = false;
    
    for (const sep of separators) {
      if (cleanedText.includes(sep)) {
        const parts = cleanedText.split(sep);
        if (parts.length >= 2) {
          songTitle = parts[0].trim();
          songArtist = parts.slice(1).join(sep).trim();
          foundSeparator = true;
          break;
        }
      }
    }
    
    // Se não encontrou separador, o texto inteiro é o título
    if (!foundSeparator) {
      songTitle = cleanedText.trim();
    }
    
    // Limpar título e artista
    songTitle = songTitle.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').trim();
    songArtist = songArtist.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').trim();
    
    // Verificar se temos pelo menos um título válido
    if (!songTitle || songTitle.length < 2) {
      return null;
    }
    
    return { song: songTitle, artist: songArtist || null };
  }, []);

  // Função para detectar se uma mensagem é uma pergunta
  const isQuestion = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmedText = text.trim().toLowerCase();
    
    // Verificar se termina com interrogação
    if (trimmedText.endsWith('?')) return true;
    
    // Verificar palavras-chave de perguntas
    const questionKeywords = [
      'quanto', 'qual', 'quais', 'quando', 'onde', 'como', 'por que', 'porque',
      'quem', 'o que', 'que', 'qual é', 'quantos', 'quantas', 'quanto é',
      'qual a', 'qual o', 'como é', 'como funciona', 'pode me ajudar', 'você pode',
      'me ajuda', 'me diga', 'diga', 'fale', 'explique', 'calcula', 'calcule',
      'quanto vale', 'qual o resultado', 'qual resultado', 'quanto dá',
      'que horas', 'que hora', 'horário', 'que dia', 'qual a data', 'data hoje'
    ];
    
    return questionKeywords.some(keyword => trimmedText.includes(keyword));
  };

  // Função para calcular resposta de expressões matemáticas
  const calculateMathExpression = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    try {
      const lowerText = text.toLowerCase();
      
      // Remover palavras comuns e manter apenas a expressão matemática
      let expressionText = lowerText
        .replace(/quanto é|quanto|calcule|calcula|resultado|resolver|resolva|qual o resultado|qual resultado/gi, '')
        .trim();
      
      // Substituir palavras por operadores
      expressionText = expressionText
        .replace(/\s+mais\s+/g, ' + ')
        .replace(/\s+menos\s+/g, ' - ')
        .replace(/\s+vezes\s+|\s+x\s+/g, ' * ')
        .replace(/\s+dividido\s+|\s+divisão\s+|\s+\/\s+/g, ' / ')
        .replace(/\s+por\s+/g, ' / ');
      
      // Tentar encontrar expressões matemáticas comuns
      // Padrões como: "2 + 2", "5 * 3", "10 / 2", "2+2", etc.
      const mathPattern = /(\d+\.?\d*)\s*([+\-*/x×÷])\s*(\d+\.?\d*)/;
      const match = expressionText.match(mathPattern) || text.match(mathPattern);
      
      if (match) {
        const num1 = parseFloat(match[1].replace(',', '.'));
        let operator = match[2];
        const num2 = parseFloat(match[3].replace(',', '.'));
        
        // Normalizar operadores
        if (operator === 'x' || operator === '×') operator = '*';
        if (operator === '÷') operator = '/';
        
        let result;
        switch (operator) {
          case '+':
            result = num1 + num2;
            break;
          case '-':
            result = num1 - num2;
            break;
          case '*':
            result = num1 * num2;
            break;
          case '/':
            if (num2 === 0) return null;
            result = num1 / num2;
            break;
          default:
            return null;
        }
        
        // Arredondar para 2 casas decimais se necessário
        if (result % 1 !== 0) {
          result = Math.round(result * 100) / 100;
        }
        
        return { type: 'math', answer: result, expression: `${num1} ${operator} ${num2}` };
      }
      
      // Tentar encontrar múltiplas operações simples (ex: "2 + 2 + 2")
      const multiOpPattern = /(\d+\.?\d*)\s*([+\-*/])\s*(\d+\.?\d*)(?:\s*([+\-*/])\s*(\d+\.?\d*))?/;
      const multiMatch = expressionText.match(multiOpPattern) || text.match(multiOpPattern);
      
      if (multiMatch && multiMatch[4]) {
        // Calcular da esquerda para direita
        const num1 = parseFloat(multiMatch[1].replace(',', '.'));
        const op1 = multiMatch[2] === 'x' || multiMatch[2] === '×' ? '*' : multiMatch[2] === '÷' ? '/' : multiMatch[2];
        const num2 = parseFloat(multiMatch[3].replace(',', '.'));
        const op2 = multiMatch[4] === 'x' || multiMatch[4] === '×' ? '*' : multiMatch[4] === '÷' ? '/' : multiMatch[4];
        const num3 = parseFloat(multiMatch[5].replace(',', '.'));
        
        let firstResult;
        switch (op1) {
          case '+': firstResult = num1 + num2; break;
          case '-': firstResult = num1 - num2; break;
          case '*': firstResult = num1 * num2; break;
          case '/': firstResult = num2 !== 0 ? num1 / num2 : null; break;
          default: return null;
        }
        
        if (firstResult === null) return null;
        
        let finalResult;
        switch (op2) {
          case '+': finalResult = firstResult + num3; break;
          case '-': finalResult = firstResult - num3; break;
          case '*': finalResult = firstResult * num3; break;
          case '/': finalResult = num3 !== 0 ? firstResult / num3 : null; break;
          default: return null;
        }
        
        if (finalResult === null) return null;
        
        if (finalResult % 1 !== 0) {
          finalResult = Math.round(finalResult * 100) / 100;
        }
        
        return { type: 'math', answer: finalResult, expression: `${num1} ${op1} ${num2} ${op2} ${num3}` };
      }
    } catch (error) {
      // Ignorar erros de cálculo
      return null;
    }
    
    return null;
  };

  // Função para gerar resposta inteligente baseada na pergunta
  const generateAnswer = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    const lowerText = text.toLowerCase();
    
    // Perguntas sobre hora
    if (lowerText.includes('que horas') || lowerText.includes('que hora') || lowerText.includes('horário')) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}`;
      return { type: 'time', answer: `São ${timeStr} horas.` };
    }
    
    // Perguntas sobre data
    if (lowerText.includes('que dia') || lowerText.includes('qual a data') || lowerText.includes('data hoje')) {
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const weekdays = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
      const weekday = weekdays[now.getDay()];
      return { type: 'date', answer: `Hoje é ${weekday}, dia ${day}/${month}/${year}.` };
    }
    
    // Cálculos matemáticos
    const mathResult = calculateMathExpression(text);
    if (mathResult) {
      return mathResult;
    }
    
    // Perguntas simples e respostas genéricas
    if (lowerText.includes('olá') || lowerText.includes('oi') || lowerText.includes('ola')) {
      return { type: 'greeting', answer: 'Olá! Como posso ajudar você hoje?' };
    }
    
    if (lowerText.includes('tudo bem') || lowerText.includes('como vai') || lowerText.includes('como está')) {
      return { type: 'greeting', answer: 'Estou muito bem, obrigado por perguntar! E você?' };
    }
    
    if (lowerText.includes('obrigado') || lowerText.includes('obrigada') || lowerText.includes('valeu')) {
      return { type: 'greeting', answer: 'De nada! Fico feliz em ajudar!' };
    }
    
    // Perguntas sobre o sistema/rádio
    if (lowerText.includes('qual a música') || lowerText.includes('que música') || lowerText.includes('música atual')) {
      if (currentTrackId && tracks.length > 0) {
        const currentTrack = tracks.find(t => t.id === currentTrackId);
        if (currentTrack) {
          return { type: 'track', answer: `A música atual é: ${currentTrack.name}` };
        }
      }
      return { type: 'track', answer: 'No momento não há música tocando.' };
    }
    
    // Se é uma pergunta que não sabemos responder localmente, retornar null
    // para que o sistema busque na internet
    if (lowerText.includes('?') || isQuestion(text)) {
      return { type: 'search_online', answer: null };
    }
    
    return null;
  };

  // Efeito para escutar mensagens do chat e fazer o mascote ler e responder perguntas
  useEffect(() => {
    if (!mascotEnabled || !socket || !socket.connected) return;
    
    // Função auxiliar para processar mensagem normalmente
    const processMessageNormal = async (message) => {
        // Processar mensagem com filtro de profanidade
        try {
          const result = await mascotService.processMessage(message);
          
          if (result.blocked) {
            // Mensagem bloqueada - mostrar mensagem educada
            makeMascotSpeak(result.politeMessage, true);
            if (result.mascot) {
              setMascotLevel(result.mascot.level);
            }
            return;
          }
          
          // Atualizar experiência se o mascote ganhou
          if (result.experience) {
            setMascotLevel(result.experience.newLevel);
            setMascotExperience(result.experience.experience);
            setMascotExperienceToNextLevel(result.experience.experienceToNextLevel);
            
            if (result.experience.leveledUp) {
              makeMascotSpeak(`Uau! Subi para o nível ${result.experience.newLevel}!`, true);
            }
          }
          
          const textToRead = message.text || '';
        
        // Verificar se é um pedido de música antes de verificar perguntas
        if (textToRead.trim() && onAddToQueue && tracks.length > 0) {
          const songRequest = detectSongRequest(textToRead);
          
          if (songRequest) {
            console.log('🎵 Mascote detectou pedido de música no chat:', songRequest);
            
            // Buscar música na biblioteca
            const foundTrack = findTrackInLibrary(songRequest.song, songRequest.artist);
            
            if (foundTrack) {
              console.log('✅ Música encontrada pelo mascote:', foundTrack.name || foundTrack.title);
              
              // Adicionar à fila
              onAddToQueue(foundTrack, null);
              
              // Fazer o mascote falar confirmação
              const userName = message.user || 'Ouvinte';
              const confirmMessage = `Encontrei a música ${foundTrack.name || foundTrack.title}! Vou adicionar à fila para você, ${userName}!`;
              
              // Enviar resposta no chat
              if (socket && socket.connected) {
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const timeStr = `${hours}:${minutes}:${seconds}`;
                
                const responseMessage = {
                  id: Date.now() + Math.random(),
                  user: '🤖 AI Assistente',
                  time: timeStr,
                  timestamp: now.toISOString(),
                  text: confirmMessage,
                  self: false
                };
                
                socket.emit('chat:message', responseMessage);
                console.log('✅ Mascote confirmou pedido no chat:', confirmMessage);
              }
              
              // Fazer o mascote falar a confirmação
              makeMascotSpeak(confirmMessage, true);
              
              // Não ler a mensagem original se já processou o pedido
              return;
            } else {
              console.log('❌ Música não encontrada pelo mascote:', songRequest);
              
              // Tentar buscar na internet se onAddToQueue estiver disponível
              // (isso significa que temos acesso ao sistema de download)
              if (onAddToQueue) {
                const userName = message.user || 'Ouvinte';
                const searchingMessage = `Não encontrei na biblioteca, mas vou buscar ${songRequest.song}${songRequest.artist ? ` de ${songRequest.artist}` : ''} na internet para você, ${userName}!`;
                
                // Enviar mensagem no chat
                if (socket && socket.connected) {
                  const now = new Date();
                  const hours = String(now.getHours()).padStart(2, '0');
                  const minutes = String(now.getMinutes()).padStart(2, '0');
                  const seconds = String(now.getSeconds()).padStart(2, '0');
                  const timeStr = `${hours}:${minutes}:${seconds}`;
                  
                  const responseMessage = {
                    id: Date.now() + Math.random(),
                    user: '🤖 AI Assistente',
                    time: timeStr,
                    timestamp: now.toISOString(),
                    text: searchingMessage,
                    self: false
                  };
                  
                  socket.emit('chat:message', responseMessage);
                }
                
                // Fazer o mascote falar
                makeMascotSpeak(searchingMessage, true);
                
                // Tentar baixar da internet (será processado pelo AutoRequestProcessor)
                // Por enquanto, apenas informar que não encontrou
                // O AutoRequestProcessor tentará baixar automaticamente
                
                // Não ler a mensagem original se já processou o pedido
                return;
              } else {
                // Se não temos acesso ao sistema de download, apenas informar
                const userName = message.user || 'Ouvinte';
                const notFoundMessage = `Desculpe, ${userName}, não encontrei a música ${songRequest.song}${songRequest.artist ? ` de ${songRequest.artist}` : ''} na biblioteca.`;
                
                // Enviar resposta no chat
                if (socket && socket.connected) {
                  const now = new Date();
                  const hours = String(now.getHours()).padStart(2, '0');
                  const minutes = String(now.getMinutes()).padStart(2, '0');
                  const seconds = String(now.getSeconds()).padStart(2, '0');
                  const timeStr = `${hours}:${minutes}:${seconds}`;
                  
                  const responseMessage = {
                    id: Date.now() + Math.random(),
                    user: '🤖 AI Assistente',
                    time: timeStr,
                    timestamp: now.toISOString(),
                    text: notFoundMessage,
                    self: false
                  };
                  
                  socket.emit('chat:message', responseMessage);
                  console.log('✅ Mascote informou que não encontrou:', notFoundMessage);
                }
                
                // Fazer o mascote falar
                makeMascotSpeak(notFoundMessage, true);
                
                // Não ler a mensagem original se já processou o pedido
                return;
              }
            }
          }
        }
        
        // Verificar se é uma pergunta e tentar responder
        if (textToRead.trim() && isQuestion(textToRead)) {
          const answer = generateAnswer(textToRead);
          
          if (answer) {
            let responseText = '';
            
            if (answer.type === 'math') {
              responseText = `A resposta de ${answer.expression} é ${answer.answer}.`;
            } else if (answer.type === 'search_online') {
              // Buscar resposta na internet usando AI
              console.log('🔍 Buscando resposta na internet para:', textToRead);
              
              // Mostrar que está buscando
              makeMascotSpeak('Deixa eu pesquisar...', false);
              
              try {
                const searchResult = await aiSearchService.searchAnswer(textToRead);
                
                if (searchResult.success && searchResult.answer) {
                  responseText = searchResult.answer;
                  console.log('✅ Resposta encontrada online:', responseText);
                } else {
                  responseText = 'Desculpe, não consegui encontrar a resposta para essa pergunta.';
                  console.log('⚠️ Não foi possível buscar resposta online');
                }
              } catch (searchError) {
                console.error('❌ Erro ao buscar resposta:', searchError);
                responseText = 'Ops, tive um problema ao buscar a resposta. Tente novamente!';
              }
            } else {
              responseText = answer.answer;
            }
            
            // Enviar resposta no chat
            if (socket && socket.connected && responseText) {
              const now = new Date();
              const hours = String(now.getHours()).padStart(2, '0');
              const minutes = String(now.getMinutes()).padStart(2, '0');
              const seconds = String(now.getSeconds()).padStart(2, '0');
              const timeStr = `${hours}:${minutes}:${seconds}`;
              
              const responseMessage = {
                id: Date.now() + Math.random(), // Garantir ID único
                user: '🤖 AI Assistente',
                time: timeStr,
                timestamp: now.toISOString(),
                text: responseText,
                self: false
              };
              
              socket.emit('chat:message', responseMessage);
              console.log('✅ Mascote respondeu no chat:', responseText);
              
              // Enviar resposta do robô para os ouvintes falarem também
              socket.emit('robot:answer', {
                text: responseText,
                question: textToRead,
                timestamp: Date.now()
              });
              console.log('📡 Resposta do robô enviada para ouvintes:', responseText);
            }
            
            // Fazer o mascote falar a resposta
            if (responseText) {
              makeMascotSpeak(responseText, true);
            }
            
            // Não ler a mensagem original se já respondeu
            return;
          }
        }
        
        // Fazer o robô ler a mensagem do chat normalmente
          if (textToRead.trim()) {
            // Adicionar prefixo fofo
            const robotMessage = `${message.user} disse: ${textToRead}`;
            makeMascotSpeak(robotMessage, true);
          }
        } catch (error) {
          console.error('Erro ao processar mensagem:', error);
          // Fallback: ler mensagem normalmente se houver erro
          const textToRead = message.text || '';
          if (textToRead.trim()) {
            const robotMessage = `${message.user} disse: ${textToRead}`;
            makeMascotSpeak(robotMessage, true);
          }
        }
    };
    
    const handleChatMessage = async (message) => {
      // Ignorar mensagens do próprio DJ e do próprio mascote
      if (message.self || message.user === 'DJ' || message.user === '🤖 AI Assistente') return;
      
      // Verificar se é uma mensagem nova
      if (message && message.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = message.id;
        
        const userName = message.user || 'Ouvinte';
        
        // Verificar se é uma pessoa diferente e saudá-la
        if (!greetedUsersRef.current.has(userName)) {
          // Marcar como saudado
          greetedUsersRef.current.add(userName);
          
          // Saudação personalizada para nova pessoa
          const greeting = 'Sou seu amigo Robô, mim diz o que você deseja';
          
          // Enviar saudação no chat
          if (socket && socket.connected) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}:${seconds}`;
            
            const greetingMessage = {
              id: Date.now() + Math.random(),
              user: '🤖 AI Assistente',
              time: timeStr,
              timestamp: now.toISOString(),
              text: greeting,
              self: false
            };
            
            socket.emit('chat:message', greetingMessage);
            console.log('✅ Mascote saudou nova pessoa:', userName);
          }
          
          // Fazer o mascote falar a saudação
          makeMascotSpeak(greeting, true);
          
          // Aguardar um pouco antes de processar a mensagem original
          setTimeout(() => {
            // Continuar processamento normal da mensagem
            processMessageNormal(message);
          }, 2000); // 2 segundos de delay para dar tempo da saudação
          
          return; // Retornar aqui para não processar a mensagem imediatamente
        }
        
        // Processar mensagem normalmente se já foi saudado
        processMessageNormal(message);
      }
    };
    
    socket.on('chat:message', handleChatMessage);
    
    return () => {
      if (socket) {
        socket.off('chat:message', handleChatMessage);
      }
    };
  }, [mascotEnabled, socket, makeMascotSpeak, currentTrackId, tracks, onAddToQueue, findTrackInLibrary, detectSongRequest]);
  
  // Efeito para mudar mensagens do mascote (quando não há pedidos)
  useEffect(() => {
    if (!mascotEnabled) return;
    
    const interval = setInterval(() => {
      // Só mostrar mensagens automáticas se não estiver falando
      if (!isMascotTalking && !isSpeakingRef.current) {
        const randomMessage = mascotMessages[Math.floor(Math.random() * mascotMessages.length)];
        makeMascotSpeak(randomMessage, true); // Reduzir música para mensagens automáticas também
      }
    }, 15000); // Intervalo de 15 segundos (aumentado para não interferir com leitura do chat)
    
    return () => clearInterval(interval);
  }, [mascotEnabled, mascotMessages, makeMascotSpeak, isMascotTalking]);
  
  // Mensagem inicial
  useEffect(() => {
    if (mascotEnabled && !mascotMessage) {
      makeMascotSpeak('Bem vindo ao meu canal!', true);
    }
  }, [mascotEnabled, mascotMessage, makeMascotSpeak]);
  
  // Função para toggle do mascote
  const handleToggleMascot = useCallback(async () => {
    const newState = !mascotEnabled;
    
    if (!newState) {
      // Se desligando, cancelar qualquer fala em andamento
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      setIsMascotTalking(false);
      setMascotMessage('');
      // Restaurar volume da música se necessário
      if (musicAudioRef && musicAudioRef.current && originalMusicVolumeRef.current !== null) {
        musicAudioRef.current.volume = originalMusicVolumeRef.current;
        originalMusicVolumeRef.current = null;
      }
    }
    
    setMascotEnabled(newState);
    
    // Atualizar no banco de dados
    if (mascotData) {
      try {
        await mascotService.updateMascot(mascotData.id, { enabled: newState });
      } catch (error) {
        console.error('Erro ao atualizar estado do mascote:', error);
      }
    }
  }, [mascotEnabled, mascotData, musicAudioRef]);
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        window.speechSynthesis.cancel();
      }
      if (mascotAudioContextRef.current) {
        mascotAudioContextRef.current.close();
      }
      // Restaurar volume da música se necessário
      if (musicAudioRef && musicAudioRef.current && originalMusicVolumeRef.current !== null) {
        musicAudioRef.current.volume = originalMusicVolumeRef.current;
      }
    };
  }, [musicAudioRef]);
  const [isDraggingMic, setIsDraggingMic] = useState(false);
  const [isDraggingEQ, setIsDraggingEQ] = useState({
    band31: false,
    band62: false,
    band125: false,
    band250: false,
    band500: false,
    band1k: false,
    band2k: false,
    band4k: false,
    band8k: false,
    band16k: false
  });
  const [micActive, setMicActive] = useState(false);
  const [micVuLevel, setMicVuLevel] = useState(0);
  const [micLEDLevels, setMicLEDLevels] = useState(new Array(12).fill(0));
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState(null);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamDevices, setWebcamDevices] = useState([]);
  const [selectedWebcamDeviceId, setSelectedWebcamDeviceId] = useState(null);
  const webcamVideoRef = useRef(null);
  const webcamStreamRef = useRef(null);
  const animationRef = useRef(null);
  const micMediaStreamRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micAnimationRef = useRef(null);
  const micGainNodeRef = useRef(null);
  const micSourceRef = useRef(null);
  const micFaderRef = useRef(null);
  const micStartValueRef = useRef(0);
  const micStartYRef = useRef(0);
  
  // Função para buscar dispositivos (pode ser chamada manualmente)
  const enumerateDevices = useCallback(async () => {
      try {
        // Solicitar permissão primeiro (necessário para obter labels dos dispositivos)
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (permError) {
        console.warn('Permissão não concedida, tentando listar dispositivos sem labels:', permError);
      }
        
        // Listar todos os dispositivos
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        
        setAudioInputDevices(audioInputs);
        setAudioOutputDevices(audioOutputs);
        setWebcamDevices(videoInputs);
        
        // Se não houver dispositivo selecionado e houver dispositivos disponíveis, selecionar o primeiro
      setSelectedMicDeviceId(prev => {
        if (!prev && audioInputs.length > 0) {
          return audioInputs[0].deviceId;
        }
        return prev;
      });
      
      setSelectedOutputDeviceId(prev => {
        if (!prev && audioOutputs.length > 0) {
          return audioOutputs[0].deviceId;
        }
        return prev;
      });
      
      setSelectedWebcamDeviceId(prev => {
        if (!prev && videoInputs.length > 0) {
          return videoInputs[0].deviceId;
        }
        return prev;
      });
        
        console.log('🎤 Dispositivos de entrada encontrados:', audioInputs.length);
        console.log('🔊 Dispositivos de saída encontrados:', audioOutputs.length);
        console.log('📹 Dispositivos de vídeo encontrados:', videoInputs.length);
      
      // Log detalhado dos dispositivos de saída
      if (audioOutputs.length > 0) {
        console.log('🔊 Dispositivos de saída disponíveis:');
        audioOutputs.forEach((device, index) => {
          console.log(`  ${index + 1}. ${device.label || 'Sem nome'} (ID: ${device.deviceId.substring(0, 20)}...)`);
        });
      }
      } catch (error) {
        console.error('Erro ao enumerar dispositivos de áudio:', error);
    }
  }, []);
  
  // Buscar todos os dispositivos de entrada de áudio disponíveis
  useEffect(() => {
    enumerateDevices();
    
    // Escutar mudanças nos dispositivos (conexão/desconexão)
    navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);

  // Controlar volume do player de música com o fader MUSIC
  // Se o processamento de áudio estiver ativo, o volume é controlado pelo masterGainNode
  // Caso contrário, usa o volume do HTMLAudioElement
  useEffect(() => {
    const applyMusicVolume = () => {
      if (musicAudioRef && musicAudioRef.current) {
        // Se o processamento de áudio estiver ativo, não alterar o volume do HTMLAudioElement
        // (o volume será controlado pelo masterGainNode)
        if (eqEnabled && audioContextRef.current && audioSourceRef.current) {
          // Volume controlado pelo masterGainNode no useEffect de processamento
          return;
        }
        
        // Converter de 0-100 para 0-1 (volume do HTMLAudioElement)
        const volume = channels.music / 100;
        musicAudioRef.current.volume = volume;
      }
    };
    
    // Aplicar imediatamente
    applyMusicVolume();
    
    // Também verificar periodicamente para capturar mudanças no audioRef (ex: crossfade)
    const interval = setInterval(applyMusicVolume, 500);
    
    return () => clearInterval(interval);
  }, [channels.music, musicAudioRef, eqEnabled]);

  // Controlar volume dos jingles com o fader FX
  useEffect(() => {
    const applyJinglesVolume = () => {
      if (jingleAudioRefs && jingleAudioRefs.current) {
        // Converter de 0-100 para 0-1 (volume do HTMLAudioElement)
        const volume = channels.fx / 100;
        
        // Aplicar volume a todos os jingles ativos
        Object.values(jingleAudioRefs.current).forEach(audio => {
          if (audio && audio instanceof HTMLAudioElement) {
            audio.volume = volume;
          }
        });
      }
    };
    
    // Aplicar imediatamente
    applyJinglesVolume();
    
    // Também verificar periodicamente para capturar novos jingles criados
    const interval = setInterval(applyJinglesVolume, 500);
    
    return () => clearInterval(interval);
  }, [channels.fx, jingleAudioRefs]);

  // Inicializar e aplicar processamento de áudio profissional (EQ + Efeitos)
  useEffect(() => {
    if (!musicAudioRef || !musicAudioRef.current || !eqEnabled) {
      // Limpar processamento se não há áudio ou EQ desabilitado
      if (audioContextRef.current && audioSourceRef.current) {
        try {
          audioSourceRef.current.disconnect();
          audioSourceRef.current = null;
        } catch (e) {
          console.warn('Erro ao desconectar source:', e);
        }
      }
      return;
    }

    const initializeAudioProcessing = async () => {
      try {
        // CRÍTICO: Sempre usar o AudioContext passado como prop (AudioContext global)
        // Não criar um novo AudioContext, pois o hub foi criado no AudioContext global
        let audioContextToUse = audioContext; // Prop passado do DJPanel (AudioContext global)
        
        if (!audioContextToUse || audioContextToUse.state === 'closed') {
          console.warn('⚠️ AudioContext não foi passado ou está fechado - não podemos processar áudio');
          return;
        }
        
        // Sempre usar o AudioContext passado como prop
        audioContextRef.current = audioContextToUse;
        
        // Se o contexto estiver suspenso, retomar
        if (audioContextToUse.state === 'suspended') {
          await audioContextToUse.resume();
        }
        
        // Usar audioContextToUse diretamente
        const audioCtx = audioContextToUse;

        // Criar ou reutilizar MediaElementSource
        // CRÍTICO: Um HTMLAudioElement só pode ter UM MediaElementSource durante toda sua vida útil
        // CRÍTICO: Se o elemento de áudio mudou (crossfade), precisamos recriar o MediaElementSource
        const currentAudioElement = musicAudioRef?.current;
        
        // Verificar se o elemento de áudio mudou comparando com o último elemento conhecido
        const needsRecreate = audioSourceRef.current && 
                              lastAudioElementRef.current !== currentAudioElement &&
                              currentAudioElement !== null;
        
        if (!audioSourceRef.current || needsRecreate) {
          // Se o elemento mudou, limpar o MediaElementSource antigo
          if (needsRecreate && audioSourceRef.current) {
            try {
              audioSourceRef.current.disconnect();
              console.log('🔄 Limpando MediaElementSource antigo (elemento de áudio mudou após crossfade)');
            } catch (e) {
              // Ignorar erro
            }
            audioSourceRef.current = null;
          }
          
          // Se recebemos MediaElementSource como prop e o elemento não mudou, usar ele
          if (mediaElementSource && !needsRecreate) {
            audioSourceRef.current = mediaElementSource;
            lastAudioElementRef.current = currentAudioElement;
            console.log('✅ Reutilizando MediaElementSource passado como prop');
          } else if (currentAudioElement) {
            // Tentar criar novo apenas se não foi passado como prop
            try {
              audioSourceRef.current = audioCtx.createMediaElementSource(currentAudioElement);
              lastAudioElementRef.current = currentAudioElement;
              console.log('✅ MediaElementSource criado com sucesso para novo elemento');
            } catch (error) {
              // Se o elemento já está conectado, não podemos criar outro
              if (error.name === 'InvalidStateError' || 
                  (error.message && error.message.includes('already connected'))) {
                console.warn('⚠️ Elemento de áudio já está conectado. Aguardando MediaElementSource existente.');
                // Não definir audioSourceRef.current para evitar erros futuros
                return;
              }
              throw error; // Re-lançar outros erros
            }
          } else {
            console.warn('⚠️ musicAudioRef.current não está disponível');
            return;
          }
        } else if (audioSourceRef.current && lastAudioElementRef.current !== currentAudioElement) {
          // Atualizar referência mesmo se não precisar recriar
          lastAudioElementRef.current = currentAudioElement;
        }

        const source = audioSourceRef.current;

        // Limpar conexões anteriores do masterGain
        if (masterGainNodeRef.current) {
          try {
            masterGainNodeRef.current.disconnect();
          } catch (e) {}
        }

        // Criar master gain node (controla volume do fader MUSIC)
        const masterGain = audioCtx.createGain();
        const volume = channels.music / 100; // Volume do fader MUSIC
        masterGain.gain.value = volume;
        masterGainNodeRef.current = masterGain;
        
        // NOTA: A função connectMasterGain foi removida
        // O masterGain agora só conecta ao destination local (para o DJ ouvir)
        // O áudio para broadcast é conectado diretamente do currentNode ao hub (sem passar pelo masterGain)

        // Definir frequências das bandas EQ (10 bandas profissionais)
        const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        const eqBands = ['band31', 'band62', 'band125', 'band250', 'band500', 'band1k', 'band2k', 'band4k', 'band8k', 'band16k'];
        
        // Limpar nós EQ anteriores
        eqNodesRef.current.forEach(node => {
          try {
            node.disconnect();
          } catch (e) {}
        });
        eqNodesRef.current = [];

        // Criar nós de EQ para cada banda
        let currentNode = source;
        
        eqFrequencies.forEach((freq, index) => {
          const filter = audioCtx.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1.0;
          filter.gain.value = 0;
          
          eqNodesRef.current.push(filter);
          currentNode.connect(filter);
          currentNode = filter;
        });

        // Aplicar valores do EQ
        eqNodesRef.current.forEach((filter, index) => {
          const bandName = eqBands[index];
          const eqValue = eq[bandName] || 50;
          const gainDb = (eqValue - 50) * 0.6; // -30dB a +30dB
          filter.gain.value = gainDb;
        });

        // Compressor
        if (effects.compressor.enabled) {
          if (!compressorNodeRef.current) {
            compressorNodeRef.current = audioCtx.createDynamicsCompressor();
          }
          const compressor = compressorNodeRef.current;
          compressor.threshold.value = effects.compressor.threshold;
          compressor.ratio.value = effects.compressor.ratio;
          compressor.attack.value = effects.compressor.attack;
          compressor.release.value = effects.compressor.release;
          compressor.knee.value = 30;
          
          currentNode.connect(compressor);
          currentNode = compressor;
        } else if (compressorNodeRef.current) {
          try {
            compressorNodeRef.current.disconnect();
          } catch (e) {}
        }

        // Reverb (usando ConvolverNode)
        if (effects.reverb.enabled) {
          if (!reverbNodeRef.current) {
            reverbNodeRef.current = audioCtx.createConvolver();
            // Criar impulso de reverb simples
            const impulseLength = audioCtx.sampleRate * 2;
            const impulse = audioCtx.createBuffer(2, impulseLength, audioCtx.sampleRate);
            const impulseL = impulse.getChannelData(0);
            const impulseR = impulse.getChannelData(1);
            
            for (let i = 0; i < impulseLength; i++) {
              const n = impulseLength - i;
              impulseL[i] = (Math.random() * 2 - 1) * Math.pow(n / impulseLength, 2);
              impulseR[i] = (Math.random() * 2 - 1) * Math.pow(n / impulseLength, 2);
            }
            reverbNodeRef.current.buffer = impulse;
          }
          
          const reverbGain = audioCtx.createGain();
          reverbGain.gain.value = effects.reverb.wet;
          const dryGain = audioCtx.createGain();
          dryGain.gain.value = 1 - effects.reverb.wet;
          
          const reverbWetGain = audioCtx.createGain();
          reverbWetGain.gain.value = effects.reverb.wet;
          
          currentNode.connect(dryGain);
          currentNode.connect(reverbNodeRef.current);
          reverbNodeRef.current.connect(reverbWetGain);
          
          const merger = audioCtx.createChannelMerger(2);
          dryGain.connect(merger, 0, 0);
          reverbWetGain.connect(merger, 0, 1);
          currentNode = merger;
        } else if (reverbNodeRef.current) {
          try {
            reverbNodeRef.current.disconnect();
          } catch (e) {}
        }

        // Delay
        if (effects.delay.enabled) {
          if (!delayNodeRef.current) {
            delayNodeRef.current = audioCtx.createDelay(1.0);
          }
          const delay = delayNodeRef.current;
          delay.delayTime.value = effects.delay.time;
          
          const delayGain = audioCtx.createGain();
          delayGain.gain.value = effects.delay.feedback;
          
          const delayWetGain = audioCtx.createGain();
          delayWetGain.gain.value = effects.delay.wet;
          const delayDryGain = audioCtx.createGain();
          delayDryGain.gain.value = 1 - effects.delay.wet;
          
          currentNode.connect(delayDryGain);
          currentNode.connect(delay);
          delay.connect(delayGain);
          delayGain.connect(delay);
          delay.connect(delayWetGain);
          
          const merger = audioCtx.createChannelMerger(2);
          delayDryGain.connect(merger, 0, 0);
          delayWetGain.connect(merger, 0, 1);
          currentNode = merger;
        } else if (delayNodeRef.current) {
          try {
            delayNodeRef.current.disconnect();
          } catch (e) {}
        }

        // CRÍTICO: Criar duas saídas separadas:
        // 1. masterGain → hub → localVolumeGain → destination local (controlado pelo fader MUSIC e playerVolume - só para o DJ ouvir)
        // 2. currentNode → hub diretamente (sempre 100% - para broadcast)
        
        // CRÍTICO: NÃO conectar masterGain diretamente ao destination
        // O masterGain deve conectar ao hub, e o hub será conectado ao localVolumeGainNode no DJPanel
        // Isso garante que o volume do mixer do player funciona corretamente
        currentNode.connect(masterGain);
        
        // CRÍTICO: Conectar masterGain ao hub (não diretamente ao destination)
        // O hub será conectado ao localVolumeGainNode no DJPanel para controle de volume
        if (audioHub) {
          try {
            masterGain.connect(audioHub);
            console.log('✅ masterGain conectado ao hub (será conectado ao localVolumeGainNode no DJPanel)');
          } catch (e) {
            console.error('❌ Erro ao conectar masterGain ao hub:', e);
            // Fallback: conectar diretamente ao destination (não ideal, mas funciona)
            masterGain.connect(audioCtx.destination);
          }
        } else {
          // Se não há hub, conectar diretamente (fallback)
          masterGain.connect(audioCtx.destination);
        }
        
        // Conectar currentNode diretamente ao hub para broadcast (sempre 100%, não afetado pelo fader)
        if (audioHub) {
          try {
            // CRÍTICO: Verificar se o hub pertence ao mesmo AudioContext
            if (audioHub.context !== audioCtx) {
              console.error('❌ Hub pertence a um AudioContext diferente!');
              throw new Error('Hub pertence a AudioContext diferente');
            }
            
            // Conectar diretamente ao hub, SEM passar pelo masterGain
            currentNode.connect(audioHub);
            console.log('✅ Áudio conectado ao hub para broadcast (100% - não afetado pelo fader MUSIC)');
          } catch (e) {
            console.error('❌ Erro ao conectar ao hub:', e);
          }
        } else if (mediaStreamDestination) {
          // Fallback: conectar diretamente ao mediaStreamDestination
          try {
            if (mediaStreamDestination.context !== audioCtx) {
              console.error('❌ MediaStreamDestination pertence a um AudioContext diferente!');
              throw new Error('MediaStreamDestination pertence a AudioContext diferente');
            }
            
            currentNode.connect(mediaStreamDestination);
            console.log('✅ Áudio conectado ao mediaStreamDestination para WebRTC (100% - não afetado pelo fader MUSIC)');
          } catch (e) {
            console.warn('⚠️ Erro ao conectar ao mediaStreamDestination:', e);
          }
        }

        console.log('✅ Processamento de áudio profissional inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar processamento de áudio:', error);
      }
    };

    initializeAudioProcessing();
    
    return () => {
      // Cleanup será feito na próxima inicialização
    };
  }, [musicAudioRef, eqEnabled, eq, effects, channels.music, musicAudioRef?.current?.src, musicAudioRef?.current, audioHub, mediaStreamDestination]);
  
  // NOTA: Este useEffect foi removido porque o masterGain NÃO deve ser conectado ao hub
  // O hub deve receber o áudio diretamente do currentNode (antes do masterGain)
  // Isso garante que o volume do fader MUSIC não afete o broadcast

  // Atualizar valores do EQ em tempo real
  useEffect(() => {
    if (!eqEnabled || !eqNodesRef.current || eqNodesRef.current.length === 0) return;
    
    const eqBands = ['band31', 'band62', 'band125', 'band250', 'band500', 'band1k', 'band2k', 'band4k', 'band8k', 'band16k'];
    eqNodesRef.current.forEach((filter, index) => {
      const bandName = eqBands[index];
      const eqValue = eq[bandName] || 50;
      const gainDb = (eqValue - 50) * 0.6; // -30dB a +30dB
      filter.gain.value = gainDb;
    });
  }, [eq, eqEnabled]);

  // Atualizar volume do master gain quando o fader MUSIC mudar
  // NOTA: Isso só afeta a saída local (audioCtx.destination), NÃO o broadcast
  useEffect(() => {
    if (masterGainNodeRef.current) {
      const volume = channels.music / 100;
      masterGainNodeRef.current.gain.value = volume;
      console.log('🔊 Volume do masterGain atualizado para saída local:', volume, '(não afeta broadcast)');
    }
    
    // CRÍTICO: Garantir que o hub sempre está em 100% (não afetado pelo fader)
    // Isso é executado sempre que o fader MUSIC muda para garantir que o broadcast não é afetado
    if (audioHub) {
      const currentHubGain = audioHub.gain.value;
      if (currentHubGain !== 1.0) {
        console.warn('⚠️ Hub gain não estava em 100%! Corrigindo de', currentHubGain, 'para 1.0');
        audioHub.gain.value = 1.0;
      }
    }
  }, [channels.music, audioHub]);

  // Atualizar parâmetros do compressor
  useEffect(() => {
    if (compressorNodeRef.current && effects.compressor.enabled) {
      compressorNodeRef.current.threshold.value = effects.compressor.threshold;
      compressorNodeRef.current.ratio.value = effects.compressor.ratio;
      compressorNodeRef.current.attack.value = effects.compressor.attack;
      compressorNodeRef.current.release.value = effects.compressor.release;
    }
  }, [effects.compressor]);

  // Atualizar parâmetros do delay
  useEffect(() => {
    if (delayNodeRef.current && effects.delay.enabled) {
      delayNodeRef.current.delayTime.value = effects.delay.time;
    }
  }, [effects.delay.time, effects.delay.enabled]);

  // Aplicar ganho do microfone
  useEffect(() => {
    if (micGainNodeRef.current) {
      // Converter porcentagem (0-100) para ganho linear (0-2)
      const gainValue = channels.mic / 50; // 0-100% -> 0-2.0
      micGainNodeRef.current.gain.value = gainValue;
    }
  }, [channels.mic]);

  // Ref para rastrear mudanças de estado do microfone
  const prevMicActiveRef = useRef(micActive);
  
  // Gerenciar microfone - DESATIVADO
  useEffect(() => {
    // Função desativada - não faz nada
    return;
    
    // Só logar se houver mudança de estado
    const micStateChanged = prevMicActiveRef.current !== micActive;
    prevMicActiveRef.current = micActive;
    
    if (micActive) {
      if (micStateChanged) {
      console.log('🎤 Ativando microfone...');
      }
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      micAudioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      micAnalyserRef.current = analyser;

      // Criar GainNode para controlar o volume do microfone
      const gainNode = audioContext.createGain();
      const gainValue = channels.mic / 50; // 0-100% -> 0-2.0
      gainNode.gain.value = gainValue;
      micGainNodeRef.current = gainNode;

      // Configurar constraints com deviceId selecionado
      const constraints = {
        audio: selectedMicDeviceId 
          ? { deviceId: { exact: selectedMicDeviceId } }
          : true
      };
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          // Verificar se ainda está ativo (pode ter sido desativado durante a requisição)
          if (!micActive) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          micMediaStreamRef.current = stream;
          const source = audioContext.createMediaStreamSource(stream);
          micSourceRef.current = source;
          
          // Conectar: source -> gainNode -> analyser -> destination
          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination);
          
          // Criar um novo stream com o áudio processado para transmissão
          const destination = audioContext.createMediaStreamDestination();
          gainNode.connect(destination);
          
          if (onMicStreamChange) {
            onMicStreamChange(destination.stream);
          }

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateMicVU = () => {
            if (!micActive) {
              if (micAnimationRef.current) {
                cancelAnimationFrame(micAnimationRef.current);
                micAnimationRef.current = null;
              }
              return;
            }
            
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const level = Math.min(100, (average / 255) * 100 * 1.5);
            setMicVuLevel(level);
            
            // Atualizar LEDs do VU meter (12 LEDs)
            const ledCount = 12;
            const ledLevels = new Array(ledCount).fill(0);
            const levelPerLED = 100 / ledCount;
            
            for (let i = 0; i < ledCount; i++) {
              const ledThreshold = (i + 1) * levelPerLED;
              if (level >= ledThreshold) {
                ledLevels[i] = 100;
              } else if (level >= i * levelPerLED) {
                // Interpolação suave para o LED parcialmente ativo
                const partialLevel = ((level - (i * levelPerLED)) / levelPerLED) * 100;
                ledLevels[i] = Math.max(0, partialLevel);
              }
            }
            
            setMicLEDLevels(ledLevels);
            
            micAnimationRef.current = requestAnimationFrame(updateMicVU);
          };
          
          updateMicVU();
          console.log('✅ Microfone ativado com sucesso');
        })
        .catch(err => {
          console.error('❌ Erro ao acessar microfone:', err);
          setMicActive(false);
          if (onMicActiveChange) {
            onMicActiveChange(false);
          }
          
          let errorMessage = 'Não foi possível acessar o microfone.';
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage = 'Permissão de microfone negada. Por favor, permita o acesso ao microfone nas configurações do navegador.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage = 'Nenhum microfone encontrado. Verifique se há um microfone conectado.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage = 'O microfone está sendo usado por outro aplicativo.';
          }
          
          alert(errorMessage);
        });
    } else {
      // Desativar microfone - limpar todos os recursos
      if (micStateChanged) {
      console.log('🎤 Desativando microfone...');
      }
      
      if (micMediaStreamRef.current) {
        micMediaStreamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        micMediaStreamRef.current = null;
      }
      
      if (micSourceRef.current) {
        try {
          micSourceRef.current.disconnect();
        } catch (e) {
          console.warn('Aviso ao desconectar source:', e);
        }
        micSourceRef.current = null;
      }
      
      if (micGainNodeRef.current) {
        try {
          micGainNodeRef.current.disconnect();
        } catch (e) {
          console.warn('Aviso ao desconectar gain node:', e);
        }
        micGainNodeRef.current = null;
      }
      
      if (micAnalyserRef.current) {
        try {
          micAnalyserRef.current.disconnect();
        } catch (e) {
          console.warn('Aviso ao desconectar analyser:', e);
        }
        micAnalyserRef.current = null;
      }
      
      if (micAudioContextRef.current && micAudioContextRef.current.state !== 'closed') {
        micAudioContextRef.current.close().catch(err => {
          console.warn('Aviso ao fechar AudioContext:', err);
        });
        micAudioContextRef.current = null;
      }
      
      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current);
        micAnimationRef.current = null;
      }
      
      setMicVuLevel(0);
      setMicLEDLevels(new Array(12).fill(0));
      
      if (onMicStreamChange) {
        onMicStreamChange(null);
      }
      
      if (micStateChanged) {
      console.log('✅ Microfone desativado completamente');
      }
    }

    return () => {
      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current);
        micAnimationRef.current = null;
      }
    };
  }, [micActive, onMicStreamChange, channels.mic, selectedMicDeviceId]);

  const handleMicToggle = useCallback(async () => {
    // Função desativada - não faz nada
      return;
  }, []);

  // Expor handleMicToggle via ref
  useEffect(() => {
    if (micToggleRef) {
      micToggleRef.current = handleMicToggle;
    }
    return () => {
      if (micToggleRef) {
        micToggleRef.current = null;
      }
    };
  }, [micToggleRef, handleMicToggle]);
  
  const handleMicDeviceChange = (deviceId) => {
    setSelectedMicDeviceId(deviceId);
    // Se o microfone estiver ativo, reiniciar com o novo dispositivo
    if (micActive) {
      setMicActive(false);
      setTimeout(() => {
        setMicActive(true);
      }, 100);
    }
  };
  
  const handleOutputDeviceChange = (deviceId) => {
    setSelectedOutputDeviceId(deviceId);
    applyAudioOutput(deviceId);
  };
  
  // Função para aplicar saída de áudio a todos os elementos de áudio
  const applyAudioOutput = useCallback((deviceId) => {
    if (!deviceId) {
      return;
    }
    
    // Verificar suporte para setSinkId
    if (!('setSinkId' in HTMLAudioElement.prototype)) {
      console.warn('⚠️ setSinkId não suportado neste navegador. Use Chrome, Edge ou Opera para selecionar saída de áudio.');
      return;
    }
    
      // Aplicar a saída para todos os elementos de áudio na página
      const audioElements = document.querySelectorAll('audio');
      
      if (audioElements.length === 0) {
        return;
      }
      
    audioElements.forEach((audio) => {
        if (audio.setSinkId) {
        audio.setSinkId(deviceId).catch(err => {
          console.error('Erro ao definir saída de áudio:', err);
        });
    }
    });
  }, []);
  
  // Aplicar saída de áudio quando um dispositivo for selecionado
  useEffect(() => {
    if (selectedOutputDeviceId) {
      applyAudioOutput(selectedOutputDeviceId);
    }
  }, [selectedOutputDeviceId, applyAudioOutput]);

  // Gerenciar webcam
  useEffect(() => {
    if (webcamActive) {
      console.log('📹 Ativando webcam...');
      const constraints = {
        video: selectedWebcamDeviceId 
          ? { deviceId: { exact: selectedWebcamDeviceId } }
          : true
      };
      
      navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
          if (!webcamActive) {
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          
          webcamStreamRef.current = stream;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = stream;
            console.log('✅ Webcam ativada com sucesso');
          }
        })
        .catch(err => {
          console.error('❌ Erro ao acessar webcam:', err);
          setWebcamActive(false);
          
          let errorMessage = 'Não foi possível acessar a webcam.';
          
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            errorMessage = 'Permissão de webcam negada. Por favor, permita o acesso à webcam nas configurações do navegador.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            errorMessage = 'Nenhuma webcam encontrada. Verifique se há uma webcam conectada.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            errorMessage = 'A webcam está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a webcam.';
          } else if (err.name === 'OverconstrainedError') {
            errorMessage = 'A webcam selecionada não está disponível. Selecione outra webcam.';
          }
          
          alert(errorMessage);
        });
    } else {
      console.log('📹 Desativando webcam...');
      
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Track de webcam parado');
        });
        webcamStreamRef.current = null;
      }
      
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = null;
      }
      
      console.log('✅ Webcam desativada completamente');
    }

    return () => {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach(track => track.stop());
        webcamStreamRef.current = null;
      }
    };
  }, [webcamActive, selectedWebcamDeviceId]);

  const handleReset = () => {
    setChannels({ master: 80, music: 75, mic: 0, fx: 65 });
    setEq({ low: 50, lowMid: 50, mid: 50, highMid: 50, high: 50 });
    setEqEnabled(true);
  };

  const handleEQChange = (band, value) => {
    setEq(prev => ({ ...prev, [band]: value }));
  };

  const getEQValue = (value) => {
    return value - 50; // -50 a +50
  };
  
  const eqStartValueRef = useRef({});
  const eqStartYRef = useRef({});
  const eqFaderRefs = useRef({});
  const eqIsDraggingRef = useRef({});
  
  // Refs para processamento de áudio profissional
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const lastAudioElementRef = useRef(null); // Rastrear último elemento de áudio para detectar mudanças (crossfade)
  const eqNodesRef = useRef([]);
  const compressorNodeRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const masterGainNodeRef = useRef(null);
  const broadcastOutputNodeRef = useRef(null); // Nó de saída para broadcast (sempre conectado ao hub, não ao masterGain)
  
  const handleEQMouseDown = (band, e) => {
    const faderRef = eqFaderRefs.current[band];
    if (faderRef) {
      const rect = faderRef.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const height = rect.height;
      const clickPercent = ((height - clickY) / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, clickPercent)));
      
      eqStartValueRef.current[band] = newValue;
      eqStartYRef.current[band] = e.clientY;
      handleEQChange(band, newValue);
    }
    eqIsDraggingRef.current[band] = true;
    setIsDraggingEQ(prev => ({ ...prev, [band]: true }));
  };
  
  const handleEQMouseMove = (band, e) => {
    if (eqIsDraggingRef.current[band] && eqFaderRefs.current[band]) {
      const faderRef = eqFaderRefs.current[band];
      const rect = faderRef.getBoundingClientRect();
      const deltaY = eqStartYRef.current[band] - e.clientY;
      const height = rect.height;
      const deltaPercent = (deltaY / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, eqStartValueRef.current[band] + deltaPercent)));
      handleEQChange(band, newValue);
    }
  };
  
  const handleEQMouseUp = (band) => {
    eqIsDraggingRef.current[band] = false;
    setIsDraggingEQ(prev => ({ ...prev, [band]: false }));
  };
  
  const handleEQMouseDownWithMove = (band) => (e) => {
    handleEQMouseDown(band, e);
    const handleMouseMove = (e) => handleEQMouseMove(band, e);
    const handleMouseUp = () => {
      handleEQMouseUp(band);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Função auxiliar para renderizar um fader do EQ
  const renderEQFader = (bandName, frequency, label) => {
    const value = eq[bandName] || 50;
    const isDragging = isDraggingEQ[bandName] || false;

  return (
      <EQFader key={bandName}>
        <EQFaderTrack $isDragging={isDragging}>
                <EQFaderInput
            ref={(el) => { eqFaderRefs.current[bandName] = el; }}
                  type="range"
                  min="0"
                  max="100"
            value={value}
                  onChange={(e) => {
              if (!isDragging) {
                      const newValue = parseInt(e.target.value);
                eqStartValueRef.current[bandName] = newValue;
                handleEQChange(bandName, newValue);
                    }
                  }}
                  onInput={(e) => {
              if (!isDragging) {
                      const newValue = parseInt(e.target.value);
                eqStartValueRef.current[bandName] = newValue;
                handleEQChange(bandName, newValue);
                    }
                  }}
            onMouseDown={handleEQMouseDownWithMove(bandName)}
            {...createEQTouchHandlers(bandName)}
                />
                <div style={{
                  position: 'absolute',
            bottom: `${value}%`,
                  left: 0,
                  right: 0,
            height: `${Math.abs(getEQValue(value))}%`,
            background: getEQValue(value) > 0 
                    ? 'linear-gradient(180deg, rgba(34, 211, 238, 0.4) 0%, rgba(34, 211, 238, 0.2) 100%)'
                    : 'linear-gradient(0deg, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.2) 100%)',
                  borderRadius: '2px',
                  transition: 'none',
                  willChange: 'height, bottom',
                }} />
                {/* Knob do EQ */}
                <div style={{
                  position: 'absolute',
            bottom: `calc(${value}% - 8px)`,
                  left: '-2px',
                  right: '-2px',
                  width: 'calc(100% + 4px)',
                  height: '16px',
                  background: 'linear-gradient(180deg, rgba(180, 180, 190, 0.9) 0%, rgba(140, 140, 150, 0.9) 30%, rgba(100, 100, 110, 0.9) 50%, rgba(140, 140, 150, 0.9) 70%, rgba(180, 180, 190, 0.9) 100%)',
                  border: '1px solid rgba(60, 60, 70, 0.8)',
                  borderTop: '1px solid rgba(200, 200, 210, 0.6)',
                  borderBottom: '2px solid rgba(50, 50, 60, 0.9)',
                  borderRadius: '3px',
                  boxShadow: `
                    inset 0 1px 2px rgba(255, 255, 255, 0.3),
                    inset 0 -1px 2px rgba(0, 0, 0, 0.5),
                    0 2px 4px rgba(0, 0, 0, 0.6),
              0 0 8px ${getEQValue(value) > 0 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(251, 191, 36, 0.4)'}
                  `,
                  cursor: 'grab',
                  zIndex: 5,
                  transition: 'none',
                  willChange: 'bottom',
                }} />
                {/* Linha central */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: '1px',
                  background: 'rgba(100, 100, 110, 0.5)',
                  transform: 'translateY(-50%)',
                  zIndex: 1
                }} />
              </EQFaderTrack>
        <EQLabel>{label}</EQLabel>
            </EQFader>
    );
  };
  
  const createEQTouchHandlers = (band) => ({
    onTouchStart: (e) => {
      const faderRef = eqFaderRefs.current[band];
      if (faderRef) {
        const touch = e.touches[0];
        const rect = faderRef.getBoundingClientRect();
        const touchY = touch.clientY - rect.top;
        const height = rect.height;
        const touchPercent = ((height - touchY) / height) * 100;
        const newValue = Math.round(Math.max(0, Math.min(100, touchPercent)));
        eqStartValueRef.current[band] = newValue;
        eqStartYRef.current[band] = touch.clientY;
        handleEQChange(band, newValue);
      }
      eqIsDraggingRef.current[band] = true;
      setIsDraggingEQ(prev => ({ ...prev, [band]: true }));
    },
    onTouchMove: (e) => {
      if (eqIsDraggingRef.current[band] && eqFaderRefs.current[band]) {
        const touch = e.touches[0];
        const faderRef = eqFaderRefs.current[band];
        const rect = faderRef.getBoundingClientRect();
        const deltaY = eqStartYRef.current[band] - touch.clientY;
        const height = rect.height;
        const deltaPercent = (deltaY / height) * 100;
        const newValue = Math.round(Math.max(0, Math.min(100, eqStartValueRef.current[band] + deltaPercent)));
        handleEQChange(band, newValue);
      }
    },
    onTouchEnd: () => {
      eqIsDraggingRef.current[band] = false;
      setIsDraggingEQ(prev => ({ ...prev, [band]: false }));
    },
    onTouchCancel: () => {
      eqIsDraggingRef.current[band] = false;
      setIsDraggingEQ(prev => ({ ...prev, [band]: false }));
    }
  });

  return (
    <Container>
      <Header>
        <Title>
          <span>🤖</span>
          {mascotData?.name || 'AI ASSISTENTE'}
          {mascotLevel > 1 && (
            <span style={{marginLeft: '8px', fontSize: '0.7rem', color: '#fbbf24'}}>
              Nível {mascotLevel}
            </span>
          )}
          <StatusIndicator>
            <StatusDot $color="#22d3ee" />
            <StatusDot $color="#06b6d4" />
            <StatusDot $color="#fbbf24" />
          </StatusIndicator>
        </Title>
        <Controls>
          {/* Botão Ligar/Desligar Robô */}
          <IconButton 
            onClick={handleToggleMascot} 
            title={mascotEnabled ? "Desligar AI Assistente" : "Ligar AI Assistente"}
            style={{
              background: mascotEnabled 
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.8) 0%, rgba(249, 115, 22, 0.8) 100%)'
                : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
              borderColor: mascotEnabled ? '#fbbf24' : 'rgba(6, 182, 212, 0.4)',
              color: mascotEnabled ? '#0f172a' : '#22d3ee',
              boxShadow: mascotEnabled 
                ? '0 0 20px rgba(251, 191, 36, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3)'
                : '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            {mascotEnabled ? '🤖' : '⚫'}
          </IconButton>
          
          {/* Botão Push-to-Talk para Comandos de Voz */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <IconButton
              onMouseDown={handlePushToTalkMouseDown}
              onMouseUp={handlePushToTalkMouseUp}
              onMouseLeave={handlePushToTalkMouseUp}
              onTouchStart={handlePushToTalkTouchStart}
              onTouchEnd={handlePushToTalkTouchEnd}
              onTouchCancel={handlePushToTalkTouchEnd}
              title={`Segure para falar (Comandos: ligar/parar transmissão, ligar/desligar autodj, próxima/anterior música)${lastVoiceCommand ? `\nÚltimo: ${lastVoiceCommand}` : ''}`}
              style={{
                background: isPushToTalkActive 
                  ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)'
                  : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)',
                borderColor: isPushToTalkActive ? '#ef4444' : 'rgba(6, 182, 212, 0.4)',
                color: isPushToTalkActive ? '#ffffff' : '#22d3ee',
                boxShadow: isPushToTalkActive 
                  ? '0 0 20px rgba(239, 68, 68, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3)'
                  : '0 2px 8px rgba(0, 0, 0, 0.3)',
                animation: isPushToTalkActive ? 'pulse 1s infinite' : 'none'
              }}
            >
              🎤
            </IconButton>
            
            {/* Mini VU Meter */}
            <div style={{
              width: '6px',
              height: '30px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '3px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column-reverse'
            }}>
              <div style={{
                width: '100%',
                height: `${pushToTalkVuLevel}%`,
                background: pushToTalkVuLevel > 80 
                  ? 'linear-gradient(0deg, #ef4444, #dc2626)'
                  : pushToTalkVuLevel > 50 
                    ? 'linear-gradient(0deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(0deg, #22d3ee, #06b6d4)',
                borderRadius: '3px',
                transition: 'height 0.05s ease'
              }} />
            </div>
          </div>
          
          <IconButton onClick={handleReset} title="Reset All">↺</IconButton>
        </Controls>
      </Header>

      <MixerLayout>
        {/* Display Tecnológico do Robô AI */}
        <div style={{ flex: '1 1 0', minWidth: 0 }}>
          <RobotDisplayContainer>
            <RobotDisplayHeader>
              <RobotDisplayTitle>
                <span>🤖</span> ASSISTENTE AI
              </RobotDisplayTitle>
              <RobotStatusIndicator $active={mascotEnabled}>
                <span>{mascotEnabled ? '●' : '○'}</span>
                {mascotEnabled ? 'ATIVO' : 'INATIVO'}
              </RobotStatusIndicator>
            </RobotDisplayHeader>
            
            <RobotViewport>
              <CircuitPattern />
              
              {/* Balão de fala do robô */}
              {mascotMessage && mascotEnabled && (
                <RobotSpeechBubble>
                  {mascotMessage}
                </RobotSpeechBubble>
              )}
              
              {/* Robô Animado */}
              <RobotContainer style={{ opacity: mascotEnabled ? 1 : 0.4 }}>
                <RobotAntenna $left />
                <RobotAntenna $left={false} />
                <RobotHead $talking={isMascotTalking && mascotEnabled}>
                  <RobotEye $left />
                  <RobotEye $left={false} />
                  <RobotSpeaker $talking={isMascotTalking && mascotEnabled} />
                </RobotHead>
                <RobotBody />
                <RobotArm $front $left />
                <RobotArm $front $left={false} />
              </RobotContainer>
              
              {/* Overlay de dados */}
              <DataOverlay>
                <span>SYS: {mascotEnabled ? 'OK' : 'OFF'}</span>
                <span>AI: {isMascotTalking ? 'FALANDO' : 'PRONTO'}</span>
                <span>LVL: {mascotLevel}</span>
              </DataOverlay>
            </RobotViewport>
            
            {/* Último comando reconhecido */}
            {lastVoiceCommand && (
              <div style={{
                marginTop: '8px',
                padding: '6px 10px',
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.55rem',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '2px'
                }}>
                  ÚLTIMO COMANDO
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#22d3ee',
                  fontWeight: '600'
                }}>
                  "{lastVoiceCommand}"
                </div>
              </div>
            )}
          </RobotDisplayContainer>
        </div>

        {/* Atendimento Automático de Pedidos */}
        <div style={{
          flex: '1 1 0',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          height: '300%',
          minHeight: '300%',
          alignSelf: 'stretch'
        }}>
          <AutoRequestProcessor
            tracks={tracks}
            requests={songRequests}
            socket={socket}
            onDownloadAndAddMusic={onDownloadAndAddMusic}
            onAddToQueue={onAddToQueue}
            onRejectRequest={onRejectRequest}
          />
        </div>
      </MixerLayout>
    </Container>
  );
};

export default MixerConsole;
