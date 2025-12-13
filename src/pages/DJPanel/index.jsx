import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import styled, { keyframes, css } from 'styled-components';
import io from 'socket.io-client';
import LeftPlaylistPanel from '../../components/LeftPlaylistPanel';
import MixerConsole from '../../components/MixerConsole';
import MixerControls from '../../components/MixerControls';
import SmartChannelButtons from '../../components/SmartChannelButtons';
import VignettePanel from '../../components/VignettePanel';
import ChatPanel from '../../components/ChatPanel';
import WebcamPanel from '../../components/WebcamPanel';
import ConnectionStatusLED from '../../components/ConnectionStatusLED';
import { pulse, gradientShift, glow } from '../../styles/animations';

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
  0% { transform: translateX(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateX(100%); opacity: 0; }
`;

const robotBounce = keyframes`
  0%, 100% { transform: translateY(0px) scaleY(1); }
  50% { transform: translateY(-8px) scaleY(0.95); }
`;

// Animações para os botões de jingle
const jingleGlow = keyframes`
  0%, 100% { 
    box-shadow: 
      0 0 20px rgba(6, 182, 212, 0.6),
      0 6px 25px rgba(6, 182, 212, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  50% { 
    box-shadow: 
      0 0 35px rgba(34, 211, 238, 0.9),
      0 0 50px rgba(6, 182, 212, 0.6),
      0 8px 30px rgba(6, 182, 212, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
`;

const jinglePulse = keyframes`
  0%, 100% { 
    transform: scale(1);
    filter: brightness(1);
  }
  50% { 
    transform: scale(1.05);
    filter: brightness(1.3);
  }
`;

const jingleGradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const jingleShimmer = keyframes`
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
`;

const talk = keyframes`
  0%, 100% { transform: scaleY(1); }
  25% { transform: scaleY(0.3); }
  50% { transform: scaleY(1.2); }
  75% { transform: scaleY(0.5); }
`;

const bubblePop = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

// Animações 3D para o nome da rádio
const radioName3DRotate = keyframes`
  0%, 100% {
    transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px);
  }
  25% {
    transform: perspective(1000px) rotateX(2deg) rotateY(-2deg) translateZ(5px);
  }
  50% {
    transform: perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(10px);
  }
  75% {
    transform: perspective(1000px) rotateX(-2deg) rotateY(2deg) translateZ(5px);
  }
`;

const radioNameGradient = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const radioNameDepth = keyframes`
  0%, 100% {
    text-shadow: 
      2px 2px 0px rgba(0, 0, 0, 0.3),
      4px 4px 0px rgba(0, 0, 0, 0.2),
      6px 6px 10px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(6, 182, 212, 0.3);
  }
  50% {
    text-shadow: 
      3px 3px 0px rgba(0, 0, 0, 0.4),
      6px 6px 0px rgba(0, 0, 0, 0.3),
      9px 9px 15px rgba(0, 0, 0, 0.5),
      0 0 25px rgba(6, 182, 212, 0.4);
  }
`;

// Função helper para gerar IDs verdadeiramente únicos
let globalIdCounter = 0;
const generateUniqueTrackId = () => {
  globalIdCounter++;
  
  // Tentar usar crypto.randomUUID() se disponível (mais seguro)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `track_${crypto.randomUUID()}_${globalIdCounter}_${Date.now()}_${performance.now()}`;
  }
  
  // Fallback: usar múltiplos fatores de aleatoriedade
  const timestamp = Date.now();
  const perfNow = performance.now();
  const rand1 = Math.random().toString(36).substr(2, 15);
  const rand2 = Math.random().toString(36).substr(2, 15);
  const rand3 = Math.random().toString(36).substr(2, 15);
  const rand4 = Math.random().toString(36).substr(2, 15);
  
  return `track_${timestamp}_${Math.floor(perfNow * 1000000)}_${globalIdCounter}_${rand1}_${rand2}_${rand3}_${rand4}`;
};

// Container Principal
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  color: #fff;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(251, 191, 36, 0.08) 0%, transparent 50%);
    pointer-events: none;
  }
`;

// Header Profissional para Web Radio
// Componentes do Segundo Robô
const RobotMascotContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  min-height: 250px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-top: auto;
  margin-bottom: 0;
`;

const RobotToggleButton = styled.button`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: ${props => props.$active 
    ? '1px solid rgba(6, 182, 212, 0.5)'
    : '1px solid rgba(6, 182, 212, 0.3)'
  };
  color: white;
  padding: 4px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  box-shadow: ${props => props.$active 
    ? '0 2px 8px rgba(6, 182, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };
  margin-bottom: 8px;
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;

  &:hover {
    box-shadow: ${props => props.$active 
      ? '0 4px 12px rgba(6, 182, 212, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
      : '0 3px 8px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    };
    transform: translateY(-1px) scale(1.05);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }
`;

const RobotSpeechBubble = styled.div`
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.95) 0%, rgba(34, 211, 238, 0.95) 100%);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  max-width: 250px;
  box-shadow: 
    0 4px 20px rgba(6, 182, 212, 0.4),
    0 0 30px rgba(34, 211, 238, 0.3);
  position: relative;
  ${css`animation: ${bubblePop} 0.3s ease-out;`}
  
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

const RobotContainer2 = styled.div`
  position: relative;
  width: 168px;
  height: 192px;
  margin-top: 10px;
  ${css`animation: ${robotFloat} 3s ease-in-out infinite;`}
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    ${css`animation: ${robotPulse} 1.5s ease-in-out infinite;`}
  }
`;

const RobotAntenna2 = styled.div`
  position: absolute;
  top: -36px;
  left: ${props => props.$left ? '52px' : '96px'};
  width: 4px;
  height: 40px;
  z-index: 5;
  background: linear-gradient(180deg, 
    #06b6d4 0%,
    #22d3ee 50%,
    #67e8f9 100%
  );
  border-radius: 4px;
  box-shadow: 
    0 0 15px rgba(6, 182, 212, 0.8),
    0 0 30px rgba(34, 211, 238, 0.6),
    inset 0 0 10px rgba(103, 232, 249, 0.5);
  transform-origin: bottom center;
  ${css`animation: ${antennaPulse} 2s ease-in-out infinite;`}
  animation-delay: ${props => props.$left ? '0s' : '0.3s'};
  
  &::before {
    content: '';
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background: radial-gradient(circle, #67e8f9 0%, #22d3ee 50%, #06b6d4 100%);
    border-radius: 50%;
    box-shadow: 
      0 0 20px rgba(103, 232, 249, 1),
      0 0 40px rgba(34, 211, 238, 0.8),
      inset 0 0 10px rgba(255, 255, 255, 0.5);
    ${css`animation: ${ledBlink} 1.5s ease-in-out infinite;`}
  }
`;

const RobotHead2 = styled.div`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 112px;
  height: 108px;
  background: linear-gradient(135deg, 
    #1e293b 0%,
    #334155 25%,
    #475569 50%,
    #334155 75%,
    #1e293b 100%
  );
  border-radius: 10px 10px 14px 14px;
  border: 2px solid #06b6d4;
  box-shadow: 
    0 0 30px rgba(6, 182, 212, 0.6),
    0 10px 40px rgba(0, 0, 0, 0.8),
    0 4px 12px rgba(0, 0, 0, 0.5),
    inset 0 -10px 25px rgba(0, 0, 0, 0.4),
    inset 0 8px 20px rgba(6, 182, 212, 0.2),
    inset -4px -4px 12px rgba(0, 0, 0, 0.3),
    inset 4px 4px 8px rgba(103, 232, 249, 0.3);
  ${props => props.$talking ? css`animation: ${robotBounce} 0.5s ease-in-out infinite;` : css`animation: none;`}
  position: relative;
  z-index: 3;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(103, 232, 249, 0.3) 50%,
      transparent 100%
    );
    ${props => props.$talking ? css`animation: ${scanLine} 2s linear infinite;` : css`animation: none;`}
  }
`;

const RobotEye2 = styled.div`
  position: absolute;
  top: 30px;
  left: ${props => props.$left ? '30px' : '72px'};
  width: 24px;
  height: 24px;
  background: radial-gradient(circle, 
    #06b6d4 0%,
    #0ea5e9 40%,
    #0284c7 70%,
    #0369a1 100%
  );
  border-radius: 50%;
  border: 1px solid #67e8f9;
  box-shadow: 
    0 0 20px rgba(6, 182, 212, 1),
    0 0 40px rgba(34, 211, 238, 0.8),
    0 0 60px rgba(103, 232, 249, 0.5),
    inset 0 0 15px rgba(103, 232, 249, 0.8),
    inset 0 0 30px rgba(255, 255, 255, 0.3);
  ${css`animation: ${ledBlink} 3s infinite;`}
  z-index: 2;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 14px;
    height: 14px;
    background: radial-gradient(circle, 
      #ffffff 0%,
      #67e8f9 50%,
      #22d3ee 100%
    );
    border-radius: 50%;
    box-shadow: 
      0 0 15px rgba(255, 255, 255, 1),
      0 0 30px rgba(103, 232, 249, 0.8);
    z-index: 1;
  }
`;

const RobotSensor2 = styled.div`
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 16px;
  background: radial-gradient(circle, 
    #06b6d4 0%,
    #0ea5e9 30%,
    #0284c7 60%,
    #0369a1 100%
  );
  border-radius: 50%;
  border: 1px solid #67e8f9;
  box-shadow: 
    0 0 15px rgba(6, 182, 212, 0.8),
    0 0 30px rgba(34, 211, 238, 0.6),
    inset 0 0 10px rgba(103, 232, 249, 0.6);
  z-index: 2;
  ${css`animation: ${pulse} 2s ease-in-out infinite;`}
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: #67e8f9;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(103, 232, 249, 1);
  }
`;

const RobotSpeaker2 = styled.div`
  position: absolute;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  width: ${props => props.$talking ? '48px' : '36px'};
  height: ${props => props.$talking ? '18px' : '14px'};
  background: linear-gradient(180deg, 
    #0f172a 0%,
    #1e293b 50%,
    #0f172a 100%
  );
  border: 2px solid #06b6d4;
  border-radius: 4px;
  box-shadow: 
    0 0 15px rgba(6, 182, 212, 0.6),
    inset 0 0 10px rgba(0, 0, 0, 0.8),
    inset 0 2px 4px rgba(34, 211, 238, 0.2);
  z-index: 2;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      repeating-linear-gradient(0deg, 
        transparent 0px,
        transparent 3px,
        rgba(6, 182, 212, 0.3) 3px,
        rgba(6, 182, 212, 0.3) 6px
      );
  }
  
  ${props => props.$talking ? css`animation: ${talk} 0.4s ease-in-out infinite;` : css`animation: none;`}
`;

const RobotBody2 = styled.div`
  position: absolute;
  top: 102px;
  left: 50%;
  transform: translateX(-50%);
  width: 98px;
  height: 78px;
  background: linear-gradient(135deg, 
    #1e293b 0%,
    #334155 25%,
    #475569 50%,
    #334155 75%,
    #1e293b 100%
  );
  border-radius: 6px 6px 10px 10px;
  border: 2px solid #06b6d4;
  box-shadow: 
    0 0 25px rgba(6, 182, 212, 0.5),
    0 8px 30px rgba(0, 0, 0, 0.6),
    0 3px 10px rgba(0, 0, 0, 0.4),
    inset 0 -6px 18px rgba(0, 0, 0, 0.4),
    inset 0 5px 15px rgba(6, 182, 212, 0.2),
    inset -3px -3px 10px rgba(0, 0, 0, 0.3),
    inset 3px 3px 8px rgba(103, 232, 249, 0.2);
  position: relative;
`;

const RobotArm2 = styled.div`
  position: absolute;
  top: ${props => props.$front ? '156px' : '162px'};
  left: ${props => props.$left ? '24px' : '114px'};
  width: 18px;
  height: 40px;
  background: linear-gradient(180deg, 
    #334155 0%,
    #475569 50%,
    #334155 100%
  );
  border-radius: 4px 4px 6px 6px;
  border: 2px solid #06b6d4;
  box-shadow: 
    0 0 15px rgba(6, 182, 212, 0.4),
    0 5px 15px rgba(0, 0, 0, 0.5),
    0 2px 6px rgba(0, 0, 0, 0.3),
    inset 0 -4px 10px rgba(0, 0, 0, 0.3),
    inset 0 3px 8px rgba(34, 211, 238, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background: radial-gradient(circle, 
      #475569 0%,
      #334155 50%,
      #1e293b 100%
    );
    border-radius: 50%;
    border: 2px solid #06b6d4;
    box-shadow: 
      0 0 10px rgba(6, 182, 212, 0.5),
      inset 0 0 8px rgba(0, 0, 0, 0.5);
  }
`;

const RobotAccessory2 = styled.div`
  position: absolute;
  top: -146px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11.88rem;
  z-index: 4;
  ${css`animation: ${pulse} 2s infinite;`}
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

// Componentes dos Jingles
const JinglesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
`;

const JinglesTitle = styled.div`
  color: #f1f5f9;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  padding: 0 4px;
`;

const JinglesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px;
  width: 100%;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

// Modal para editar nome do jingle
const JingleEditModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const JingleEditContainer = styled.div`
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 40px rgba(6, 182, 212, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #06b6d4, #22d3ee, #67e8f9, transparent);
    ${css`animation: ${gradientShift} 3s linear infinite;`}
  }
`;

const JingleEditTitle = styled.div`
  color: #f1f5f9;
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const JingleEditInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(15, 23, 42, 0.8);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(34, 211, 238, 0.7);
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;

const JingleEditActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const TopHeader = styled.header`
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 2px solid rgba(6, 182, 212, 0.3);
  box-shadow: 
    0 4px 30px rgba(0, 0, 0, 0.8),
    0 0 40px rgba(6, 182, 212, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  flex-shrink: 0;
  position: relative;
  z-index: 100;
  gap: 20px;
  flex-wrap: nowrap;
  box-sizing: border-box;
  width: 100%;
`;

const BrandArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 200px;
  max-width: 300px;
  flex-shrink: 0;
  position: relative;
  cursor: pointer;
  padding: 8px 12px;
  box-sizing: border-box;
  
  &:hover .edit-icon {
    opacity: 1;
  }
`;

const EditIcon = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  background: rgba(6, 182, 212, 0.2);
  border: 1px solid rgba(6, 182, 212, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.7rem;
  color: #22d3ee;
  cursor: pointer;
  z-index: 10;
  
  &:hover {
    background: rgba(6, 182, 212, 0.3);
    border-color: #22d3ee;
  }
`;

const BannerImage = styled.img`
  max-width: 100%;
  max-height: 60px;
  object-fit: contain;
  border-radius: 4px;
  margin-bottom: 4px;
`;

const LogoText = styled.h1`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 900;
  letter-spacing: 4px;
  position: relative;
  background: linear-gradient(
    135deg,
    #06b6d4 0%,
    #22d3ee 30%,
    #fbbf24 60%,
    #22d3ee 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  ${css`
  animation: 
    ${radioNameGradient} 4s ease-in-out infinite,
    ${radioName3DRotate} 6s ease-in-out infinite,
    ${radioNameDepth} 3s ease-in-out infinite;
  `}
  cursor: pointer;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
  z-index: 1;
  
  /* Camada de profundidade 3D - sombra traseira */
  &::before {
    content: attr(data-text);
    position: absolute;
    left: 0;
    top: 0;
    background: linear-gradient(
      135deg,
      rgba(6, 182, 212, 0.2) 0%,
      rgba(34, 211, 238, 0.15) 50%,
      rgba(251, 191, 36, 0.1) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    z-index: -1;
    transform: translateZ(-20px) translateY(4px) translateX(4px);
    filter: blur(2px);
    opacity: 0.6;
  }
  
  /* Camada de profundidade 3D - sombra intermediária */
  &::after {
    content: attr(data-text);
    position: absolute;
    left: 0;
    top: 0;
    background: linear-gradient(
      135deg,
      rgba(6, 182, 212, 0.3) 0%,
      rgba(34, 211, 238, 0.25) 50%,
      rgba(251, 191, 36, 0.2) 100%
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    z-index: -1;
    transform: translateZ(-10px) translateY(2px) translateX(2px);
    filter: blur(1px);
    opacity: 0.7;
  }
  
  &:hover {
    transform: perspective(1000px) rotateX(-5deg) rotateY(5deg) translateZ(15px) scale(1.05);
    animation-duration: 2s, 4s, 2s;
  }
`;

const SubLogoText = styled.span`
  font-size: 0.75rem;
  color: #cbd5e1;
  letter-spacing: 2px;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.9;
`;

const OnAirIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 10px;
  min-width: 120px;
  max-width: 140px;
  flex-shrink: 0;
  padding: 8px 12px;
  box-sizing: border-box;
  height: 100%;
`;

const OnAirBadge = styled.div`
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  background: ${props => props.$live 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)'
    : 'linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)'
  };
  color: white;
  box-shadow: ${props => props.$live 
    ? '0 4px 20px rgba(239, 68, 68, 0.5), 0 2px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
  };
  ${props => props.$live ? css`animation: ${pulse} 2s infinite;` : css`animation: none;`}
  border: 2px solid ${props => props.$live ? 'rgba(239, 68, 68, 0.6)' : 'rgba(100, 116, 139, 0.4)'};
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Indicador de status */
  &::before {
    content: '';
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.$live ? '#fff' : '#cbd5e1'};
    box-shadow: ${props => props.$live 
      ? '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(239, 68, 68, 0.6)'
      : '0 0 5px rgba(203, 213, 225, 0.5)'
    };
    ${props => props.$live ? css`animation: ${pulse} 1.5s infinite;` : css`animation: none;`}
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$live 
      ? '0 6px 25px rgba(239, 68, 68, 0.6), 0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
      : '0 6px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
    };
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ListenerCount = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
`;

const ListenerNumber = styled.span`
  color: #22d3ee;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
`;

const CurrentTrackInfo = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 16px;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
`;

const NowPlaying = styled.div`
  font-size: 0.7rem;
  color: #06b6d4;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 800;
  ${css`animation: ${glow} 3s infinite;`}
  margin: 0;
  padding: 0;
  line-height: 1;
`;

const TrackTitle = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  margin: 0;
  padding: 0;
  line-height: 1.1;
`;

const TrackArtist = styled.div`
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
  margin: 0;
  padding: 0;
  line-height: 1;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 4px;
  position: relative;
  overflow: visible;
  cursor: pointer;
  transition: height 0.2s ease;
  border: 1px solid rgba(6, 182, 212, 0.2);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  
  &:hover {
    height: 10px;
    border-color: rgba(6, 182, 212, 0.4);
  }
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%);
  background-size: 200% 100%;
  width: ${props => props.$percent}%;
  border-radius: 4px;
  ${css`animation: ${gradientShift} 3s linear infinite;`}
  box-shadow: 
    0 0 15px rgba(6, 182, 212, 0.8),
    0 0 8px rgba(34, 211, 238, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  pointer-events: none;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 12px;
    height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 100%);
    border-radius: 0 4px 4px 0;
  }
`;

const ProgressSlider = styled.input`
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 24px;
  transform: translateY(-50%);
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 10;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    box-shadow: 
      0 0 15px rgba(6, 182, 212, 1),
      0 0 8px rgba(34, 211, 238, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.5);
    transition: all 0.2s ease;
    margin-top: -6px;
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.4);
    box-shadow: 
      0 0 25px rgba(6, 182, 212, 1.2),
      0 0 15px rgba(34, 211, 238, 1),
      0 2px 6px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.8);
  }
  
  &::-webkit-slider-thumb:active {
    transform: scale(1.5);
    box-shadow: 
      0 0 30px rgba(6, 182, 212, 1.5),
      0 0 20px rgba(34, 211, 238, 1.2),
      0 2px 8px rgba(0, 0, 0, 0.5);
  }
  
  &::-moz-range-track {
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    border: none;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-shadow: 
      0 0 15px rgba(6, 182, 212, 1),
      0 0 8px rgba(34, 211, 238, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  &::-moz-range-thumb:hover {
    transform: scale(1.4);
    box-shadow: 
      0 0 25px rgba(6, 182, 212, 1.2),
      0 0 15px rgba(34, 211, 238, 1),
      0 2px 6px rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 255, 255, 0.8);
  }
  
  &::-moz-range-thumb:active {
    transform: scale(1.5);
    box-shadow: 
      0 0 30px rgba(6, 182, 212, 1.5),
      0 0 20px rgba(34, 211, 238, 1.2),
      0 2px 8px rgba(0, 0, 0, 0.5);
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &:hover + ${ProgressFill} {
    box-shadow: 
      0 0 20px rgba(6, 182, 212, 1),
      0 0 12px rgba(34, 211, 238, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`;

const VolumeControl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex-shrink: 0;
  height: 36px;
  width: auto;
  position: relative;
  margin-top: -20px;
  align-self: flex-start;
`;

const VolumeProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 3px;
  height: ${props => (props.$percent / 100) * 36}px;
  background: linear-gradient(
    to top,
    #06b6d4 0%,
    #22d3ee 50%,
    #67e8f9 100%
  );
  border-radius: 2px;
  transition: height 0.1s ease;
  pointer-events: none;
  box-shadow: 0 0 6px rgba(6, 182, 212, 0.6);
  z-index: 1;
`;

const VolumeButton = styled.button`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  color: #22d3ee;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.6),
    0 0 15px rgba(6, 182, 212, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  margin: 0;
  padding: 0;
  flex-shrink: 0;
  
  &:hover {
    border-color: rgba(34, 211, 238, 0.7);
    box-shadow: 
      0 6px 25px rgba(0, 0, 0, 0.7),
      0 0 20px rgba(6, 182, 212, 0.6),
      inset 0 1px 2px rgba(255, 255, 255, 0.15),
      inset 0 -1px 2px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }
`;

const VolumeSlider = styled.input`
  width: 4px;
  height: 36px;
  border-radius: 3px;
  background: rgba(15, 23, 42, 0.8);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  border: 1px solid rgba(6, 182, 212, 0.3);
  writing-mode: vertical-lr;
  direction: rtl;
  flex-shrink: 0;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 0 8px rgba(6, 182, 212, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 
      0 0 15px rgba(6, 182, 212, 1),
      0 2px 6px rgba(0, 0, 0, 0.4);
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    border: 2px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 0 10px rgba(6, 182, 212, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  &::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 
      0 0 15px rgba(6, 182, 212, 1),
      0 2px 6px rgba(0, 0, 0, 0.4);
  }
`;

const VolumeValue = styled.span`
  color: #22d3ee;
  font-size: 0.75rem;
  font-weight: 700;
  min-width: 35px;
  text-align: right;
  font-family: 'Courier New', monospace;
`;

const TimeDisplay = styled.div`
  font-size: 0.65rem;
  font-family: 'Courier New', monospace;
  color: #94a3b8;
  font-weight: 700;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  padding: 0 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  line-height: 1;
  
  &::before {
    content: '⏱';
    margin-right: 4px;
    opacity: 0.7;
  }
`;

const DJConnectionStatus = styled.div`
  width: 220px;
  height: 60px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
  border: 2px solid ${props => props.$connected ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.4)'};
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  box-shadow: 
    inset 0 2px 8px rgba(0, 0, 0, 0.5),
    0 4px 20px ${props => props.$connected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)'};
  flex-shrink: 0;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.$connected 
      ? 'linear-gradient(90deg, #10b981, #34d399, #10b981)'
      : 'linear-gradient(90deg, #ef4444, #f87171, #ef4444)'
    };
    background-size: 200% 100%;
    ${css`animation: ${gradientShift} 2s linear infinite;`}
  }
`;

const DJStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
`;

const DJStatusIndicator = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$connected ? '#10b981' : '#ef4444'};
  box-shadow: ${props => props.$connected 
    ? '0 0 10px rgba(16, 185, 129, 0.8), 0 0 20px rgba(16, 185, 129, 0.4)'
    : '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.4)'
  };
  ${props => props.$connected ? css`animation: ${pulse} 2s infinite;` : css`animation: none;`}
  flex-shrink: 0;
`;

const DJStatusText = styled.div`
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${props => props.$connected ? '#10b981' : '#ef4444'};
  flex: 1;
`;

const DJListenerInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 600;
`;

const DJListenerCount = styled.span`
  color: #22d3ee;
  font-weight: 800;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
`;

const BroadcastStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 100px;
  max-width: 120px;
  align-items: flex-end;
  flex-shrink: 0;
  padding: 8px 12px;
  box-sizing: border-box;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.7rem;
`;

const StatLabel = styled.span`
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
`;

const StatValue = styled.span`
  color: ${props => props.$color || '#22d3ee'};
  font-weight: 900;
  font-family: 'Courier New', monospace;
  text-shadow: 0 0 10px ${props => props.$color ? `rgba(${props.$color}, 0.5)` : 'rgba(34, 211, 238, 0.5)'};
`;

// Botão Luminoso de Status
const LuminousStatusButton = styled.div`
  position: relative;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 16px;
  padding: 16px 20px;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(6, 182, 212, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(6, 182, 212, 0.2),
      transparent
    );
    ${css`animation: ${gradientShift} 3s ease infinite;`}
  }
  
  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(
      135deg,
      rgba(6, 182, 212, 0.8),
      rgba(34, 211, 238, 0.8),
      rgba(6, 182, 212, 0.8)
    );
    background-size: 200% 200%;
    border-radius: 16px;
    z-index: -1;
    ${css`animation: ${gradientShift} 4s ease infinite;`}
    opacity: 0.6;
    filter: blur(8px);
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.7),
      0 0 60px rgba(6, 182, 212, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    border-color: rgba(34, 211, 238, 0.8);
  }
`;

const LuminousStatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const LuminousStatLabel = styled.span`
  color: #94a3b8;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const LuminousStatValue = styled.span`
  color: ${props => props.$color || '#22d3ee'};
  font-size: 0.85rem;
  font-weight: 900;
  font-family: 'Courier New', 'Consolas', monospace;
  text-shadow: 
    0 0 10px ${props => {
      if (props.$color === '#10b981') return 'rgba(16, 185, 129, 0.8)';
      if (props.$color === '#ef4444') return 'rgba(239, 68, 68, 0.8)';
      return 'rgba(34, 211, 238, 0.8)';
    }},
    0 0 20px ${props => {
      if (props.$color === '#10b981') return 'rgba(16, 185, 129, 0.4)';
      if (props.$color === '#ef4444') return 'rgba(239, 68, 68, 0.4)';
      return 'rgba(34, 211, 238, 0.4)';
    }};
  ${props => props.$pulse ? css`animation: ${pulse} 2s ease-in-out infinite;` : css`animation: none;`}
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  padding: 8px 12px;
  box-sizing: border-box;
`;

// Menu Dropdown do Header
const HeaderMenuButton = styled.button`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  color: #22d3ee;
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
    border-color: rgba(34, 211, 238, 0.7);
    box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const HeaderMenuDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.8),
    0 0 40px rgba(6, 182, 212, 0.3);
  min-width: 200px;
  padding: 8px;
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
  gap: 4px;
  z-index: 10000;
  pointer-events: ${props => props.$show ? 'auto' : 'none'};
  
  &::before {
    content: '';
    position: absolute;
    top: -6px;
    right: 20px;
    width: 12px;
    height: 12px;
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
    border-left: 2px solid rgba(6, 182, 212, 0.5);
    border-top: 2px solid rgba(6, 182, 212, 0.5);
    transform: rotate(45deg);
  }
`;

const HeaderMenuItem = styled.button`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.2) 100%)'
    : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(6, 182, 212, 0.5)' : 'transparent'};
  color: ${props => props.$active ? '#22d3ee' : '#cbd5e1'};
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  width: 100%;
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(34, 211, 238, 0.3) 100%)'
      : 'rgba(6, 182, 212, 0.1)'};
    color: ${props => props.$active ? '#22d3ee' : '#ffffff'};
    border-color: ${props => props.$active ? 'rgba(6, 182, 212, 0.7)' : 'rgba(6, 182, 212, 0.3)'};
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  ${props => props.$danger && `
    color: #ef4444;
    
    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
  `}
  
`;

const fadeInModal = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const OffAirBtn = styled.button`
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid ${props => props.$live ? 'rgba(239, 68, 68, 0.5)' : 'rgba(6, 182, 212, 0.3)'};
  background: ${props => props.$live 
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
  };
  color: ${props => props.$live ? '#ef4444' : '#22d3ee'};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$live 
    ? '0 4px 15px rgba(239, 68, 68, 0.3)'
    : '0 4px 15px rgba(6, 182, 212, 0.2)'
  };

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$live 
      ? '0 6px 20px rgba(239, 68, 68, 0.5)'
      : '0 6px 20px rgba(6, 182, 212, 0.4)'
    };
  }
`;

const ActionBtn = styled.button`
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid rgba(6, 182, 212, 0.3);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%);
  color: #22d3ee;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);

  box-sizing: border-box;
  overflow: hidden;

  &:hover {
    box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
    border-color: rgba(6, 182, 212, 0.5);
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
  }
`;

// Modal de Configurações da Rádio
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(6, 182, 212, 0.3);
`;

const ModalTitle = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #f1f5f9;
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #22d3ee;
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileInputLabel = styled.label`
  display: block;
  padding: 12px;
  border: 2px dashed rgba(6, 182, 212, 0.5);
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.85rem;
  
  &:hover {
    border-color: #22d3ee;
    background: rgba(6, 182, 212, 0.2);
  }
`;

const PreviewBanner = styled.img`
  max-width: 100%;
  max-height: 150px;
  margin-top: 1rem;
  border-radius: 8px;
  border: 2px solid rgba(6, 182, 212, 0.3);
  object-fit: contain;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
`;

const SaveButton = styled.button`
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  color: white;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
  box-sizing: border-box;
  
  &:hover {
    box-shadow: 0 6px 25px rgba(6, 182, 212, 0.6);
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px 24px;
  border: 2px solid rgba(100, 116, 139, 0.5);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.6);
  color: #94a3b8;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:hover {
    border-color: #64748b;
    background: rgba(30, 41, 59, 0.8);
  }
`;

const RemoveBannerButton = styled.button`
  width: 100%;
  padding: 8px;
  margin-top: 0.5rem;
  border: 2px solid rgba(239, 68, 68, 0.5);
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
  }
`;

// Modal de Notícias
const NewsModalContent = styled(ModalContent)`
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
`;

const NewsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const NewsTitle = styled(ModalTitle)`
  margin: 0;
  font-size: 1.3rem;
`;

const RefreshButton = styled.button`
  padding: 8px 16px;
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  box-sizing: border-box;
  
  &:hover:not(:disabled) {
    background: rgba(6, 182, 212, 0.2);
    border-color: #22d3ee;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NewsList = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 8px;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(6, 182, 212, 0.5);
    border-radius: 4px;
    
    &:hover {
      background: rgba(6, 182, 212, 0.7);
    }
  }
`;

const NewsItem = styled.div`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
  
  &:hover {
    border-color: rgba(6, 182, 212, 0.6);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.2);
    transform: translateY(-2px);
  }
`;

const NewsItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 12px;
`;

const NewsItemTitle = styled.h3`
  margin: 0;
  color: #f1f5f9;
  font-size: 1rem;
  font-weight: 700;
  flex: 1;
  line-height: 1.4;
`;

const NewsItemSource = styled.span`
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
`;

const NewsItemDescription = styled.div`
  margin: 8px 0 0 0;
  color: #cbd5e1;
  font-size: 0.85rem;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NewsItemDate = styled.div`
  margin-top: 8px;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
`;

const LoadingText = styled.div`
  text-align: center;
  color: #22d3ee;
  font-size: 1rem;
  font-weight: 600;
  padding: 2rem;
`;

const EmptyNewsText = styled.div`
  text-align: center;
  color: #64748b;
  font-size: 0.9rem;
  padding: 2rem;
`;

// Modal de Artigo Individual
const ArticleModalContent = styled(ModalContent)`
  max-width: 95vw;
  max-height: 95vh;
  width: 95vw;
  height: 95vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
`;

const ArticleHeader = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border-bottom: 2px solid rgba(6, 182, 212, 0.5);
  padding: 1.5rem;
  flex-shrink: 0;
`;

const ArticleHeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ArticleSourceBadge = styled.span`
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ArticleDate = styled.div`
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
`;

const ArticleTitle = styled.h2`
  margin: 0;
  color: #f1f5f9;
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1.4;
  margin-bottom: 1rem;
`;

const CloseArticleButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 8px 16px;
  border: 2px solid rgba(100, 116, 139, 0.5);
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.8);
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  box-sizing: border-box;
  
  &:hover {
    border-color: #64748b;
    background: rgba(30, 41, 59, 1);
    color: #f1f5f9;
  }
`;

const ArticleContent = styled.div`
  flex: 1;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.5);
  position: relative;
`;

const ArticleIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  background: white;
`;

const ArticleFooter = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border-top: 2px solid rgba(6, 182, 212, 0.5);
  padding: 1rem 1.5rem;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
`;

const ArticleLinkButton = styled.a`
  padding: 10px 20px;
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 8px;
  background: rgba(6, 182, 212, 0.1);
  color: #22d3ee;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(6, 182, 212, 0.2);
    border-color: #22d3ee;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
  }
`;

// Grid Principal
// Menu de Abas
const TabMenuContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 99;
  background: transparent;
  padding: 12px 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const TabMenu = styled.div`
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 20px rgba(6, 182, 212, 0.1);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #06b6d4, #22d3ee, transparent);
    border-radius: 16px 16px 0 0;
    opacity: 0.6;
  }
`;

const TabButton = styled.button`
  position: relative;
  padding: 10px 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  border-radius: 12px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.2) 100%)'
    : 'transparent'};
  color: ${props => props.$active ? '#ffffff' : '#94a3b8'};
  min-width: 120px;
  text-align: center;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.35) 0%, rgba(34, 211, 238, 0.3) 100%)'
      : 'rgba(6, 182, 212, 0.1)'};
    color: ${props => props.$active ? '#ffffff' : '#cbd5e1'};
    transform: translateY(-1px);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%) scaleX(${props => props.$active ? 1 : 0});
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #06b6d4, #22d3ee, transparent);
    border-radius: 2px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.6);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  span {
    display: inline-block;
    transition: transform 0.2s ease;
  }
  
  &:hover span {
    transform: scale(1.1);
  }
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'flex' : 'none'};
  flex-direction: column;
  width: 100%;
  flex: 1;
  overflow: hidden;
`;

const FullScreenContainer = styled.div`
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  flex: 1;
  overflow: hidden;
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  flex: 1;
  overflow: hidden;
  gap: 0;
  align-items: stretch;
`;

// Coluna Esquerda (Webcam + Biblioteca)
const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 280px;
`;

// Coluna Central
const CenterColumn = styled.div`
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
`;

const DashboardRow = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: stretch;
  width: 100%;
`;

// Auto DJ Components
const AutoDJCard = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(6, 182, 212, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #06b6d4, #22d3ee, #67e8f9, transparent);
    ${css`animation: ${gradientShift} 3s linear infinite;`}
  }
`;

const AutoDJHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const AutoDJTitle = styled.h3`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 900;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const AutoDJStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)'
  };
  border: 2px solid ${props => props.$active ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
  ${props => props.$active ? css`animation: ${pulse} 2s infinite;` : css`animation: none;`}
`;

const AutoDJControls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  justify-content: center;
  flex-wrap: wrap;
`;

const ControlButton = styled.button`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 2px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
    border-color: #22d3ee;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PlayPauseButton = styled(ControlButton)`
  width: 36px;
  height: 36px;
  font-size: 0.9rem;
  margin: 0;
  padding: 0;
  background: ${props => props.$playing 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%)'
    : 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
  };
  border: ${props => props.$playing 
    ? '2px solid rgba(34, 211, 238, 0.6)' 
    : '2px solid rgba(6, 182, 212, 0.5)'
  };
  box-shadow: ${props => props.$playing 
    ? '0 0 30px rgba(6, 182, 212, 0.9), 0 6px 25px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.3)'
    : '0 6px 25px rgba(0, 0, 0, 0.6), 0 0 20px rgba(6, 182, 212, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.1), inset 0 -1px 2px rgba(0, 0, 0, 0.2)'
  };
  flex-shrink: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${props => props.$playing 
      ? '0 0 40px rgba(6, 182, 212, 1.1), 0 8px 30px rgba(0, 0, 0, 0.7), inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.4)'
      : '0 8px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(6, 182, 212, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.3)'
    };
    border-color: ${props => props.$playing ? 'rgba(34, 211, 238, 0.8)' : 'rgba(6, 182, 212, 0.7)'};
  }
  
  &:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }
`;

const PlayerContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 4px 8px;
  flex-wrap: nowrap;
  box-sizing: border-box;
`;

const ControlsBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  margin: 0;
  padding: 0;
`;

const ProgressWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  position: relative;
  flex: 1 1 auto;
  min-width: 150px;
  max-width: 100%;
  height: auto;
  justify-content: center;
  margin: 0;
  padding: 0;
`;

const ProfessionalProgressContainer = styled.div`
  width: 100%;
  height: 5px;
  position: relative;
  background: rgba(15, 23, 42, 0.8);
  border-radius: 3px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  overflow: hidden;
  cursor: pointer;
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.6),
    0 1px 1px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
`;

const Waveform = styled.svg`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
`;

// Componente para renderizar path SVG com estilos
const WaveformPathComponent = ({ d, color, shadow, fill, strokeWidth = 2 }) => (
  <path
    d={d}
    fill={fill || 'none'}
    stroke={color || '#06b6d4'}
    strokeWidth={strokeWidth}
    style={{
      filter: `drop-shadow(0 0 4px ${shadow || 'rgba(6, 182, 212, 0.6)'})`,
      transition: 'all 0.1s ease',
      opacity: 0.9
    }}
  />
);

const ProfessionalProgressFill = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: ${props => props.$percent || 0}%;
  height: 100%;
  background: linear-gradient(90deg, 
    #06b6d4 0%, 
    #22d3ee 50%, 
    #67e8f9 100%
  );
  background-size: 200% 100%;
  ${css`animation: ${gradientShift} 2s linear infinite;`}
  pointer-events: none;
  border-radius: 3px 0 0 3px;
  box-shadow: 
    0 0 10px rgba(6, 182, 212, 0.6),
    0 0 6px rgba(34, 211, 238, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 15px;
    height: 100%;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 100%);
    border-radius: 0 4px 4px 0;
  }
`;

const ProfessionalProgressSlider = styled.input`
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 10px;
  transform: translateY(-50%);
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 10;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  
  &::-webkit-slider-runnable-track {
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
  }
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    box-shadow: 
      0 0 10px rgba(6, 182, 212, 1),
      0 0 6px rgba(34, 211, 238, 0.8),
      0 1px 3px rgba(0, 0, 0, 0.4);
    border: 1.5px solid rgba(255, 255, 255, 0.6);
    transition: all 0.2s ease;
    margin-top: -2.5px;
  }
  
  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 
      0 0 25px rgba(6, 182, 212, 1.2),
      0 0 12px rgba(34, 211, 238, 1),
      0 2px 6px rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.9);
  }
  
  &::-moz-range-track {
    width: 100%;
    height: 100%;
    background: transparent;
    cursor: pointer;
    border: none;
  }
  
  &::-moz-range-thumb {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    border: 1.5px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      0 0 10px rgba(6, 182, 212, 1),
      0 0 6px rgba(34, 211, 238, 0.8),
      0 1px 3px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
  }
  
  &::-moz-range-thumb:hover {
    transform: scale(1.2);
    box-shadow: 
      0 0 25px rgba(6, 182, 212, 1.2),
      0 0 12px rgba(34, 211, 238, 1),
      0 2px 6px rgba(0, 0, 0, 0.5);
  }
`;

const PlayerButton = styled.button`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  color: #22d3ee;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  margin: 0;
  padding: 0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 6px 25px rgba(0, 0, 0, 0.6),
    0 0 20px rgba(6, 182, 212, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(6, 182, 212, 0.2);
    transition: width 0.3s ease, height 0.3s ease;
  }
  
  box-sizing: border-box;
  overflow: hidden;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
    border-color: rgba(34, 211, 238, 0.7);
    box-shadow: 
      0 8px 30px rgba(0, 0, 0, 0.7),
      0 0 25px rgba(6, 182, 212, 0.6),
      inset 0 1px 2px rgba(255, 255, 255, 0.15),
      inset 0 -1px 2px rgba(0, 0, 0, 0.3);
    
    &::before {
      width: 100%;
      height: 100%;
    }
  }
  
  &:active:not(:disabled) {
    transform: none;
    box-shadow: 
      0 4px 20px rgba(0, 0, 0, 0.5),
      0 0 15px rgba(6, 182, 212, 0.4),
      inset 0 1px 2px rgba(255, 255, 255, 0.1),
      inset 0 -1px 2px rgba(0, 0, 0, 0.25);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    box-shadow: 
      0 2px 10px rgba(0, 0, 0, 0.3),
      inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const AutoDJSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(6, 182, 212, 0.2);
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SettingLabel = styled.label`
  color: #cbd5e1;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  
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
    border-radius: 26px;
    
    &:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
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
    transform: translateX(24px);
  }
`;

const Slider = styled.input`
  width: 150px;
  height: 6px;
  border-radius: 3px;
  background: rgba(15, 23, 42, 0.8);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.6);
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4, #22d3ee);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.6);
  }
`;

const NextTrackPreview = styled.div`
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%);
  border-radius: 12px;
  border: 1px solid rgba(6, 182, 212, 0.3);
`;

const NextTrackLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-weight: 700;
  margin-bottom: 8px;
`;

// Componentes para Transmissão de Tela
const ScreenShareContainer = styled.div`
  margin-top: 16px;
  width: 100%;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05), 
    inset 0 -2px 4px rgba(0, 0, 0, 0.8), 
    0 4px 12px rgba(6, 182, 212, 0.2),
    0 0 30px rgba(6, 182, 212, 0.1);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, #06b6d4, #22d3ee, #67e8f9, transparent);
    ${css`animation: ${gradientShift} 3s linear infinite;`}
  }
`;

const ScreenShareHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ScreenShareTitle = styled.div`
  color: #f1f5f9;
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ScreenShareStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 15px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)'};
  border: 1px solid ${props => props.$active ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
`;

const ScreenPreview = styled.div`
  width: 100%;
  height: 100%;
  flex: 1;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 0;
  border: none;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  box-shadow: none;
`;

const ScreenVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
  display: block;
  position: relative;
  z-index: 1;
`;

const ScreenPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
`;

const ScreenControls = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

// Modal de Seleção de Tela
const ScreenOptionsModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const ScreenOptionsContainer = styled.div`
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 20px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.8),
    0 0 40px rgba(6, 182, 212, 0.3);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, transparent, #06b6d4, #22d3ee, #67e8f9, transparent);
    ${css`animation: ${gradientShift} 3s linear infinite;`}
  }
`;

const ScreenOptionsTitle = styled.h2`
  margin: 0 0 24px 0;
  color: #f1f5f9;
  font-size: 1.5rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ScreenOptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const ScreenOptionButton = styled.button`
  background: ${props => props.$selected 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(34, 211, 238, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'};
  border: 2px solid ${props => props.$selected ? 'rgba(6, 182, 212, 0.8)' : 'rgba(6, 182, 212, 0.3)'};
  color: ${props => props.$selected ? '#22d3ee' : '#cbd5e1'};
  padding: 24px 16px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: ${props => props.$selected 
    ? '0 8px 24px rgba(6, 182, 212, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.3)'};
  
  &:hover {
    background: ${props => props.$selected 
      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.4) 0%, rgba(34, 211, 238, 0.3) 100%)'
      : 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%)'};
    border-color: rgba(6, 182, 212, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  span:first-child {
    font-size: 2.5rem;
  }
`;

const ScreenOptionDescription = styled.div`
  font-size: 0.7rem;
  color: ${props => props.$selected ? '#67e8f9' : '#94a3b8'};
  text-align: center;
  line-height: 1.4;
`;

const ScreenOptionsActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ScreenOptionsButton = styled.button`
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    border-color: #06b6d4;
    color: white;
    box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
    
    &:hover {
      background: linear-gradient(135deg, #22d3ee 0%, #67e8f9 100%);
      box-shadow: 0 6px 20px rgba(6, 182, 212, 0.6);
      transform: translateY(-2px);
    }
  ` : `
    background: transparent;
    border-color: rgba(100, 116, 139, 0.5);
    color: #94a3b8;
    
    &:hover {
      border-color: rgba(6, 182, 212, 0.5);
      color: #cbd5e1;
      background: rgba(6, 182, 212, 0.1);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
`;

const ScreenButton = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    border-color: #22d3ee;
    color: white;
    box-shadow: 
      0 0 25px rgba(6, 182, 212, 0.6),
      0 4px 15px rgba(0, 0, 0, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
      box-shadow: 
        0 0 35px rgba(6, 182, 212, 0.8),
        0 6px 20px rgba(0, 0, 0, 0.4);
      transform: translateY(-2px);
    }
  ` : `
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-color: rgba(6, 182, 212, 0.4);
    color: #22d3ee;
    
    &:hover {
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
      border-color: rgba(34, 211, 238, 0.6);
      box-shadow: 
        0 0 20px rgba(6, 182, 212, 0.4),
        0 4px 15px rgba(0, 0, 0, 0.3);
      transform: translateY(-2px);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const JingleButton = styled.button`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  width: 100%;
  border: ${props => props.$hasAudio 
    ? '2px solid rgba(6, 182, 212, 0.6)'
    : '1px solid rgba(6, 182, 212, 0.3)'
  };
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  background: ${props => props.$hasAudio 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #06b6d4 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  background-size: ${props => props.$hasAudio ? '200% 200%' : '100% 100%'};
  color: white;
  box-shadow: ${props => props.$hasAudio 
    ? '0 4px 15px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };
  overflow: hidden;
  transform-style: preserve-3d;
  
  /* Efeito shimmer no fundo */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 70%
    );
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
    transition: transform 0.6s ease;
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    box-shadow: ${props => props.$hasAudio 
      ? '0 8px 30px rgba(6, 182, 212, 0.8), 0 0 35px rgba(34, 211, 238, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
      : '0 4px 15px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    };
    border-color: ${props => props.$hasAudio ? 'rgba(34, 211, 238, 0.9)' : '#22d3ee'};
    transform: translateY(-3px) scale(1.02);
    
    &::before {
      transform: translateX(200%) translateY(200%) rotate(45deg);
    }
    
    ${props => props.$hasAudio && `
      background-position: 100% 50%;
    `}
  }

  &:active {
    transform: translateY(-1px) scale(0.98);
    box-shadow: ${props => props.$hasAudio 
      ? '0 4px 15px rgba(6, 182, 212, 0.6), 0 0 25px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
      : '0 2px 6px rgba(0, 0, 0, 0.5), inset 0 1px 2px rgba(0, 0, 0, 0.3)'
    };
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
    
    &:hover {
      transform: none;
      box-shadow: ${props => props.$hasAudio 
        ? '0 4px 15px rgba(6, 182, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
      };
      
      &::before {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
      }
    }
  }
  
  ${props => props.$playing && css`
    ${css`animation: ${jinglePulse} 0.8s ease-in-out infinite, ${jingleGradientShift} 3s ease infinite;`}
    border-color: rgba(34, 211, 238, 1) !important;
    box-shadow: 
      0 0 35px rgba(34, 211, 238, 0.9),
      0 0 50px rgba(6, 182, 212, 0.6),
      0 8px 30px rgba(6, 182, 212, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.3) !important;
    transform: scale(1.02);
    
    &::before {
      ${css`animation: ${jingleShimmer} 2s ease-in-out infinite;`}
    }
  `}
`;

const JingleIcon = styled.div`
  font-size: 1.1rem;
  margin-bottom: 2px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
  
  ${props => props.$playing && css`
    ${css`animation: ${jinglePulse} 0.8s ease-in-out infinite;`}
    filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.8)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.6));
  `}
`;

const JingleLabel = styled.div`
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.7),
    0 0 8px rgba(6, 182, 212, ${props => props.$playing ? '0.6' : '0.2'});
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  
  ${props => props.$playing && `
    text-shadow: 
      0 1px 2px rgba(0, 0, 0, 0.7),
      0 0 12px rgba(34, 211, 238, 0.9),
      0 0 20px rgba(6, 182, 212, 0.6);
  `}
`;

const JingleAddButton = styled.button`
  position: absolute;
  top: 3px;
  right: 3px;
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 900;
  z-index: 1000;
  pointer-events: auto !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  pointer-events: auto !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-1px) scale(1.1);
    box-shadow: 
      0 3px 6px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }
`;

const JingleAudioIndicator = styled.div`
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
  ${css`animation: ${pulse} 2s ease-in-out infinite;`}
`;

const NextTrackName = styled.div`
  font-size: 0.9rem;
  color: #22d3ee;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AutoDJStatsRow = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 15px;
  flex-wrap: wrap;
`;

const AutoDJStatItem = styled.div`
  flex: 1;
  min-width: 100px;
  text-align: center;
  padding: 12px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
  border-radius: 10px;
  border: 1px solid rgba(6, 182, 212, 0.2);
`;

const AutoDJStatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 900;
  color: #fbbf24;
  font-family: 'Courier New', monospace;
  margin-bottom: 4px;
`;

const AutoDJStatLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
`;

const DJPanel = () => {
  const { user, logout } = useAuth();
  const [tracks, setTracks] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [listenerCount, setListenerCount] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [spectrumData, setSpectrumData] = useState(new Array(32).fill(0));
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [webrtcConnectionStatus, setWebrtcConnectionStatus] = useState('waiting'); // waiting, connecting, connected, error
  const [activeWebrtcConnections, setActiveWebrtcConnections] = useState(0);
  const [songRequests, setSongRequests] = useState([]);
  const [playerVolume, setPlayerVolume] = useState(() => {
    const saved = localStorage.getItem('playerVolume');
    return saved ? parseInt(saved) : 75;
  });
  
  // Estados para botões inteligentes
  const [channels, setChannels] = useState({
    master: 80,
    music: 75,
    fx: 65,
    mic: 0
  });
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState(null);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState(null);
  const [micActive, setMicActive] = useState(false);
  const mixerConsoleMicToggleRef = useRef(null);
  
  // Estados para transmissão de tela
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const screenVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [showScreenOptions, setShowScreenOptions] = useState(false);
  const [selectedScreenType, setSelectedScreenType] = useState('monitor'); // monitor, window, browser
  
  // Estado para controle de abas (HOME e TELA INTEIRA)
  const [activeTab, setActiveTab] = useState('HOME');
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  
  // Estados do segundo robô (independente)
  const [mascotEnabled2, setMascotEnabled2] = useState(true);
  const [mascotMessage2, setMascotMessage2] = useState('');
  const [isMascotTalking2, setIsMascotTalking2] = useState(false);
  const speechSynthesisRef2 = useRef(null);
  const originalMusicVolumeRef2 = useRef(null);
  const isSpeakingRef2 = useRef(false);
  
  // Função para criar voz do segundo robô
  const createRobotVoice2 = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis não suportado neste navegador');
      return null;
    }
    
    const voices = window.speechSynthesis.getVoices();
    
    // Priorizar vozes masculinas graves ou sintéticas para som robótico
    let selectedVoice = voices.find(voice => 
      voice.lang.includes('pt') && 
      (voice.name.includes('Masculina') || 
       voice.name.includes('Male') || 
       voice.name.toLowerCase().includes('synthetic') ||
       voice.name.toLowerCase().includes('sintética') ||
       voice.name.toLowerCase().includes('robot') ||
       voice.name.toLowerCase().includes('robô'))
    );
    
    // Se não encontrar, procurar por qualquer voz masculina
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => 
        voice.lang.includes('pt') && 
        (voice.name.toLowerCase().includes('male') || 
         voice.name.toLowerCase().includes('masculina') ||
         voice.name.toLowerCase().includes('man') ||
         voice.name.toLowerCase().includes('homem'))
      );
    }
    
    // Fallback: qualquer voz em português
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.includes('pt'));
    }
    
    // Último fallback: voz padrão
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
    
    return selectedVoice || null;
  }, []);
  
  // Função para fazer o segundo robô falar
  const makeMascotSpeak2 = useCallback(async (text, shouldLowerMusic = false) => {
    if (!mascotEnabled2 || !text || isSpeakingRef2.current) {
      return;
    }
    
    // Cancelar fala anterior se estiver falando
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    if (speechSynthesisRef2.current) {
      window.speechSynthesis.cancel();
      speechSynthesisRef2.current = null;
    }
    
    if (!('speechSynthesis' in window)) {
      setIsMascotTalking2(true);
      setMascotMessage2(text);
      setTimeout(() => {
        setIsMascotTalking2(false);
      }, 3000);
      return;
    }
    
    isSpeakingRef2.current = true;
    setIsMascotTalking2(true);
    setMascotMessage2(text);
    
    // Aguardar vozes carregarem
    await new Promise((resolve) => {
      if (window.speechSynthesis.getVoices().length > 0) {
        resolve();
      } else {
        window.speechSynthesis.onvoiceschanged = resolve;
      }
    });
    
    const voice = createRobotVoice2();
    
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = 'pt-BR';
      utterance.pitch = 0.8 + (Math.random() * 0.2);
      utterance.rate = 1.0 + (Math.random() * 0.1);
      utterance.volume = 1.0;
      utterance.text = text;
      
      utterance.onstart = () => {
        console.log('🤖 Segundo Robô começou a falar:', text);
      };
      
      utterance.onend = () => {
        console.log('🤖 Segundo Robô terminou de falar');
        isSpeakingRef2.current = false;
        setIsMascotTalking2(false);
        resolve();
      };
      
      utterance.onerror = (error) => {
        console.error('Erro no TTS do segundo robô:', error);
        isSpeakingRef2.current = false;
        setIsMascotTalking2(false);
        resolve();
      };
      
      speechSynthesisRef2.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, [mascotEnabled2, createRobotVoice2]);
  
  // Falas automáticas do segundo robô
  const robotAutoPhrases = [
    "Seja bem vindo ao meu canal",
    "Mim siga e curte meus videos"
  ];
  
  // Frase para falar a cada 10 minutos
  const robotPeriodicPhrase = "Dá tep,tep,tep na tela";
  
  const lastAutoPhraseIndexRef = useRef(-1);
  const hasWelcomedRef = useRef(false);
  const periodicPhraseIntervalRef = useRef(null);
  
  // Função para selecionar uma frase automática aleatória (sem repetir a última)
  const getRandomAutoPhrase = useCallback(() => {
    if (robotAutoPhrases.length === 0) return null;
    if (robotAutoPhrases.length === 1) return robotAutoPhrases[0];
    
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * robotAutoPhrases.length);
    } while (randomIndex === lastAutoPhraseIndexRef.current);
    
    lastAutoPhraseIndexRef.current = randomIndex;
    return robotAutoPhrases[randomIndex];
  }, []);
  
  // Fazer o robô falar automaticamente quando a aba "TELA INTEIRA" for ativada
  useEffect(() => {
    if (activeTab === 'TELA INTEIRA' && mascotEnabled2 && !hasWelcomedRef.current) {
      // Aguardar um pouco para garantir que a aba está carregada
      const welcomeTimer = setTimeout(() => {
        const phrase = getRandomAutoPhrase();
        if (phrase) {
          makeMascotSpeak2(phrase);
          hasWelcomedRef.current = true;
        }
      }, 1000); // 1 segundo após mudar para a aba
      
      return () => clearTimeout(welcomeTimer);
    }
    
    // Resetar o welcome quando sair da aba
    if (activeTab !== 'TELA INTEIRA') {
      hasWelcomedRef.current = false;
    }
  }, [activeTab, mascotEnabled2, makeMascotSpeak2, getRandomAutoPhrase]);
  
  // Fazer o robô falar a frase periódica a cada 10 minutos quando estiver na aba "TELA INTEIRA"
  useEffect(() => {
    if (activeTab === 'TELA INTEIRA' && mascotEnabled2) {
      // Limpar intervalo anterior se existir
      if (periodicPhraseIntervalRef.current) {
        clearInterval(periodicPhraseIntervalRef.current);
      }
      
      // Aguardar 10 minutos antes da primeira fala periódica
      const firstPeriodicTimer = setTimeout(() => {
        if (activeTab === 'TELA INTEIRA' && mascotEnabled2) {
          makeMascotSpeak2(robotPeriodicPhrase);
        }
      }, 10 * 60 * 1000); // 10 minutos em milissegundos
      
      // Configurar intervalo para repetir a cada 10 minutos
      periodicPhraseIntervalRef.current = setInterval(() => {
        if (activeTab === 'TELA INTEIRA' && mascotEnabled2 && !isSpeakingRef2.current) {
          makeMascotSpeak2(robotPeriodicPhrase);
        }
      }, 10 * 60 * 1000); // 10 minutos em milissegundos
      
      return () => {
        clearTimeout(firstPeriodicTimer);
        if (periodicPhraseIntervalRef.current) {
          clearInterval(periodicPhraseIntervalRef.current);
          periodicPhraseIntervalRef.current = null;
        }
      };
    } else {
      // Limpar intervalo quando sair da aba
      if (periodicPhraseIntervalRef.current) {
        clearInterval(periodicPhraseIntervalRef.current);
        periodicPhraseIntervalRef.current = null;
      }
    }
  }, [activeTab, mascotEnabled2, makeMascotSpeak2, robotPeriodicPhrase]);
  
  // Estados dos jingles (8 botões) - igual ao sistema do MixerConsole
  const [jingles, setJingles] = useState(() => {
    const saved = localStorage.getItem('screenJingles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(j => ({
          ...j,
          audioFile: null // File objects não podem ser serializados
        }));
      } catch (e) {
        console.error('Erro ao carregar jingles do localStorage:', e);
      }
    }
    return Array(8).fill(null).map((_, i) => ({
      id: `jingle-${i + 1}`,
      name: `Jingle ${i + 1}`,
      audioUrl: null,
      audioFile: null
    }));
  });
  
  // Carregar áudios quando os jingles mudarem
  useEffect(() => {
    jingles.forEach(jingle => {
      if (jingle.audioUrl && !jingleAudioRefs.current[jingle.id]) {
        try {
          const audio = new Audio(jingle.audioUrl);
          audio.volume = channels.fx / 100;
          audio.preload = 'auto';
          jingleAudioRefs.current[jingle.id] = audio;
          
          audio.addEventListener('ended', () => {
            setPlayingJingles(prev => ({ ...prev, [jingle.id]: false }));
          });
          
          audio.addEventListener('error', (e) => {
            console.error(`Erro ao carregar áudio do jingle ${jingle.id}:`, e);
            setPlayingJingles(prev => ({ ...prev, [jingle.id]: false }));
          });
          
          audio.addEventListener('canplaythrough', () => {
            console.log(`✅ Áudio do jingle ${jingle.id} carregado e pronto`);
          });
        } catch (error) {
          console.error(`Erro ao criar elemento de áudio para jingle ${jingle.id}:`, error);
        }
      }
    });
    
    // Limpar referências de áudios que não existem mais
    Object.keys(jingleAudioRefs.current).forEach(jingleId => {
      const exists = jingles.some(j => j.id === jingleId && j.audioUrl);
      if (!exists) {
        const audio = jingleAudioRefs.current[jingleId];
        if (audio) {
          audio.pause();
          audio.src = '';
          audio.load();
          delete jingleAudioRefs.current[jingleId];
        }
      }
    });
  }, [jingles, channels.fx]);
  const jingleAudioRefs = useRef({});
  const jingleFileInputRefs = useRef({});
  
  // Estado para modal de edição de jingle
  const [editingJingle, setEditingJingle] = useState(null);
  const [editingJingleName, setEditingJingleName] = useState('');
  const [editingJingleFile, setEditingJingleFile] = useState(null);
  
  // Configurações da Rádio (nome e banner)
  const [radioName, setRadioName] = useState(() => {
    const saved = localStorage.getItem('radioName');
    return saved || 'Gilmar TIKTOK';
  });
  const [radioBanner, setRadioBanner] = useState(() => {
    const saved = localStorage.getItem('radioBanner');
    return saved || null;
  });
  const [showRadioSettings, setShowRadioSettings] = useState(false);
  
  // Hora Certa - Sistema automático
  const [horaCertaActive, setHoraCertaActive] = useState(() => {
    const saved = localStorage.getItem('horaCertaActive');
    return saved === 'true' || true; // Ativo por padrão
  });
  const horaCertaIntervalRef = useRef(null);
  const lastAnnouncedHourRef = useRef(null);
  const [currentlyPlayingJingle, setCurrentlyPlayingJingle] = useState(null);
  
  // Função para obter hora de Brasília (UTC-3)
  const getBrasiliaTime = () => {
    const now = new Date();
    // Brasília está em UTC-3, então subtraímos 3 horas
    const brasiliaOffset = -3 * 60; // -3 horas em minutos
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utc + (brasiliaOffset * 60000));
    return brasiliaTime;
  };
  
  // Função para formatar hora em português
  const formatHourForSpeech = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    let hourText = '';
    if (hours === 0 || hours === 24) {
      hourText = 'meia-noite';
    } else if (hours === 12) {
      hourText = 'meio-dia';
    } else if (hours === 1) {
      hourText = 'uma hora';
    } else if (hours < 12) {
      hourText = `${hours} horas`;
    } else {
      hourText = `${hours} horas`;
    }
    
    let minuteText = '';
    if (minutes === 0) {
      minuteText = 'em ponto';
    } else if (minutes === 1) {
      minuteText = 'e um minuto';
    } else if (minutes < 10) {
      minuteText = `e zero ${minutes} minutos`;
    } else {
      minuteText = `e ${minutes} minutos`;
    }
    
    return `São ${hourText} ${minuteText} em Brasília.`;
  };
  
  // Função para tocar saudação de boas-vindas com voz masculina
  const playBoasVindas = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('⚠️ Web Speech API não suportada neste navegador');
      return;
    }
    
    const textToSpeak = 'Seja bem vindo a nossa página. Se inscreva em nosso canal e curta bastante, obrigado!';
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Configurar para voz masculina (português brasileiro)
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Velocidade um pouco mais lenta
    utterance.pitch = 0.8; // Tom mais grave (masculino)
    utterance.volume = 1.0;
    
    // Tentar encontrar uma voz masculina
    const voices = speechSynthesis.getVoices();
    const maleVoice = voices.find(voice => 
      voice.lang.startsWith('pt') && 
      (voice.name.toLowerCase().includes('male') || 
       voice.name.toLowerCase().includes('masculino') ||
       voice.name.toLowerCase().includes('joão') ||
       voice.name.toLowerCase().includes('felipe'))
    ) || voices.find(voice => voice.lang.startsWith('pt-BR'));
    
    if (maleVoice) {
      utterance.voice = maleVoice;
      console.log('🎙️ Usando voz:', maleVoice.name);
    }
    
    // Reduzir volume da música atual temporariamente se estiver tocando
    let wasPlaying = false;
    let savedVolume = 1;
    if (audioRef.current && isPlaying) {
      wasPlaying = true;
      savedVolume = audioRef.current.volume;
      audioRef.current.volume = 0.3; // Reduzir volume da música
    }
    
    // Configurar eventos
    utterance.onend = () => {
      if (wasPlaying && audioRef.current) {
        audioRef.current.volume = savedVolume;
      }
      console.log('✅ Saudação de boas-vindas anunciada');
    };
    
    utterance.onerror = (error) => {
      if (wasPlaying && audioRef.current) {
        audioRef.current.volume = savedVolume;
      }
      console.error('❌ Erro ao anunciar boas-vindas:', error);
    };
    
    speechSynthesis.speak(utterance);
    console.log('👋 Tocando saudação de boas-vindas:', textToSpeak);
  }, [isPlaying]);
  
  // Função para tocar Hora Certa com voz masculina e transmitir via WebRTC
  const playHoraCerta = useCallback(async (manual = false) => {
    if (!horaCertaActive && !manual) return;
    
    const brasiliaTime = getBrasiliaTime();
    const currentHour = brasiliaTime.getHours();
    const currentMinute = brasiliaTime.getMinutes();
    
    // Se não for manual, só tocar na hora cheia (minuto 0)
    if (!manual && currentMinute !== 0) return;
    
    // Evitar tocar múltiplas vezes na mesma hora (apenas para automático)
    if (!manual && lastAnnouncedHourRef.current === currentHour) return;
    
    if (!manual) {
      lastAnnouncedHourRef.current = currentHour;
    }
    setCurrentlyPlayingJingle('f5');
    
    // Usar Web Speech API
    if ('speechSynthesis' in window) {
      const textToSpeak = formatHourForSpeech(brasiliaTime);
      
      // Reduzir volume da música atual temporariamente se estiver tocando
      let wasPlaying = false;
      let savedVolume = 1;
      if (audioRef.current && isPlaying) {
        wasPlaying = true;
        savedVolume = audioRef.current.volume;
        audioRef.current.volume = 0.3; // Reduzir volume da música
      }
      
      // Tentar integrar com o player/broadcast
      let horaCertaSource = null;
      let horaCertaGain = null;
      
      if (isBroadcasting && broadcastAudioContextRef.current && broadcastDestinationRef.current) {
        try {
          const audioContext = broadcastAudioContextRef.current;
          const destination = broadcastDestinationRef.current;
          
          // Criar um OscillatorNode temporário para gerar um tom (placeholder)
          // Na prática, vamos usar SpeechSynthesis e tentar capturar via getUserMedia
          // ou criar um elemento de áudio que seja capturado
          
          // Criar um elemento de áudio temporário
          const tempAudio = new Audio();
          horaCertaAudioRef.current = tempAudio;
          
          // Tentar usar MediaRecorder para capturar o áudio do sistema
          // Nota: Isso requer permissão e pode não funcionar em todos os navegadores
          // Vamos usar uma abordagem mais simples: criar um MediaStream que capture o áudio
          
          // Por enquanto, vamos usar SpeechSynthesis normalmente
          // e tentar adicionar ao stream de broadcast através de um workaround
          
          console.log('🎙️ Hora Certa será transmitida via WebRTC');
        } catch (error) {
          console.warn('⚠️ Não foi possível integrar Hora Certa ao broadcast:', error);
        }
      }
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Configurar para voz masculina (português brasileiro)
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9; // Velocidade um pouco mais lenta
      utterance.pitch = 0.8; // Tom mais grave (masculino)
      utterance.volume = 1.0;
      
      // Tentar encontrar uma voz masculina
      const voices = speechSynthesis.getVoices();
      const maleVoice = voices.find(voice => 
        voice.lang.startsWith('pt') && 
        (voice.name.toLowerCase().includes('male') || 
         voice.name.toLowerCase().includes('masculino') ||
         voice.name.toLowerCase().includes('joão') ||
         voice.name.toLowerCase().includes('felipe'))
      ) || voices.find(voice => voice.lang.startsWith('pt-BR'));
      
      if (maleVoice) {
        utterance.voice = maleVoice;
        console.log('🎙️ Usando voz:', maleVoice.name);
      }
      
      // Configurar eventos antes de falar
      utterance.onend = () => {
        if (wasPlaying && audioRef.current) {
          audioRef.current.volume = savedVolume;
        }
        
        console.log('✅ Hora Certa anunciada');
        setTimeout(() => {
          setCurrentlyPlayingJingle(null);
          if (horaCertaAudioRef.current) {
            horaCertaAudioRef.current = null;
          }
        }, 500);
      };
      
      utterance.onerror = (error) => {
        if (wasPlaying && audioRef.current) {
          audioRef.current.volume = savedVolume;
        }
        console.error('❌ Erro ao anunciar Hora Certa:', error);
        setCurrentlyPlayingJingle(null);
        if (horaCertaAudioRef.current) {
          horaCertaAudioRef.current = null;
        }
      };
      
      // Integrar com o player/broadcast para transmitir via WebRTC
      // Nota: SpeechSynthesis não fornece um stream diretamente
      // Vamos usar uma abordagem que conecta o áudio ao stream de broadcast
      
      if (isBroadcasting && broadcastAudioContextRef.current && broadcastDestinationRef.current) {
        try {
          const audioContext = broadcastAudioContextRef.current;
          const destination = broadcastDestinationRef.current;
          
          // Criar um elemento de áudio temporário
          const tempAudio = new Audio();
          horaCertaAudioRef.current = tempAudio;
          
          // Tentar capturar o áudio do sistema para transmitir
          // Isso requer permissão de microfone e pode capturar o áudio da síntese
          navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          }).then(stream => {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0 && broadcastStreamRef.current) {
              // Adicionar tracks ao stream de broadcast
              audioTracks.forEach(track => {
                try {
                  broadcastStreamRef.current.addTrack(track);
                  
                  // Atualizar todas as peer connections
                  Object.values(peerConnectionsRef.current).forEach(pc => {
                    try {
                      pc.addTrack(track, broadcastStreamRef.current);
                    } catch (e) {
                      console.warn('Erro ao adicionar track à peer connection:', e);
                    }
                  });
                  
                  console.log('🎙️ Áudio da Hora Certa adicionado ao broadcast');
                } catch (e) {
                  console.warn('Erro ao adicionar track ao stream:', e);
                }
              });
              
              // Modificar o evento onend para remover tracks após o anúncio
              const originalOnEnd = utterance.onend;
              utterance.onend = () => {
                if (originalOnEnd) originalOnEnd();
                
                // Remover tracks do stream
                audioTracks.forEach(track => {
                  track.stop();
                  try {
                    if (broadcastStreamRef.current) {
                      broadcastStreamRef.current.removeTrack(track);
                    }
                  } catch (e) {
                    console.warn('Erro ao remover track:', e);
                  }
                });
              };
            }
          }).catch(error => {
            console.warn('⚠️ Não foi possível capturar áudio do sistema para Hora Certa:', error);
            console.log('ℹ️ Hora Certa será ouvida apenas localmente');
          });
        } catch (error) {
          console.warn('⚠️ Erro ao configurar Hora Certa para broadcast:', error);
        }
      }
      
      speechSynthesis.speak(utterance);
      console.log('🕐 Tocando Hora Certa:', textToSpeak, manual ? '(manual)' : '(automático)');
    } else {
      console.warn('⚠️ Web Speech API não suportada neste navegador');
      setCurrentlyPlayingJingle(null);
    }
  }, [horaCertaActive, isPlaying, isBroadcasting]);
  
  // Salvar estado de ativação no localStorage
  useEffect(() => {
    localStorage.setItem('horaCertaActive', horaCertaActive.toString());
  }, [horaCertaActive]);
  
  // Configurar intervalo para verificar hora cheia
  useEffect(() => {
    if (horaCertaActive) {
      // Verificar a cada minuto
      horaCertaIntervalRef.current = setInterval(() => {
        const brasiliaTime = getBrasiliaTime();
        const currentMinute = brasiliaTime.getMinutes();
        const currentHour = brasiliaTime.getHours();
        
        // Tocar na hora cheia (minuto 0)
        if (currentMinute === 0) {
          // Verificar se já não foi anunciado nesta hora
          if (lastAnnouncedHourRef.current !== currentHour) {
            playHoraCerta();
          }
        } else {
          // Resetar quando não for mais hora cheia
          lastAnnouncedHourRef.current = null;
        }
      }, 60000); // Verificar a cada minuto
      
      // Verificar imediatamente ao ativar
      const brasiliaTime = getBrasiliaTime();
      if (brasiliaTime.getMinutes() === 0) {
        const currentHour = brasiliaTime.getHours();
        if (lastAnnouncedHourRef.current !== currentHour) {
          setTimeout(() => {
            playHoraCerta();
          }, 2000);
        }
      }
      
      return () => {
        if (horaCertaIntervalRef.current) {
          clearInterval(horaCertaIntervalRef.current);
        }
      };
    } else {
      if (horaCertaIntervalRef.current) {
        clearInterval(horaCertaIntervalRef.current);
        horaCertaIntervalRef.current = null;
      }
      lastAnnouncedHourRef.current = null;
    }
  }, [horaCertaActive, playHoraCerta]);
  
  // Carregar vozes quando disponíveis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      // Carregar vozes disponíveis
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log('🎙️ Vozes disponíveis:', voices.filter(v => v.lang.startsWith('pt')));
      };
      
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }, []);
  
  // Estado para modal de notícias
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsArticles, setNewsArticles] = useState([]);
  const [loadingNews, setLoadingNews] = useState(false);
  
  // Estado para armazenar MP3s dos jingles
  const [jingleAudios, setJingleAudios] = useState(() => {
    const saved = localStorage.getItem('jingleAudios');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Função para buscar notícias
  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    setNewsArticles([]);
    
    try {
      // Lista de fontes de notícias com RSS feeds
      const newsSources = [
        {
          name: 'G1',
          url: 'https://g1.globo.com/rss/g1/',
          api: 'https://api.rss2json.com/v1/api.json?rss_url=https://g1.globo.com/rss/g1/'
        },
        {
          name: 'BBC Brasil',
          url: 'https://www.bbc.com/portuguese',
          api: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.bbc.com/portuguese/index.xml'
        },
        {
          name: 'UOL',
          url: 'https://www.uol.com.br',
          api: 'https://api.rss2json.com/v1/api.json?rss_url=https://rss.uol.com.br/feed/noticias.xml'
        },
        {
          name: 'Folha de S.Paulo',
          url: 'https://www.folha.uol.com.br',
          api: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.folha.uol.com.br/emcimadahora/rss091.xml'
        },
        {
          name: 'Estadão',
          url: 'https://www.estadao.com.br',
          api: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.estadao.com.br/rss/todas'
        },
        {
          name: 'R7',
          url: 'https://www.r7.com',
          api: 'https://api.rss2json.com/v1/api.json?rss_url=https://noticias.r7.com/feed.xml'
        }
      ];
      
      // Buscar notícias de cada fonte
      const allArticles = [];
      
      for (const source of newsSources) {
        try {
          const response = await fetch(source.api);
          const data = await response.json();
          
          if (data.status === 'ok' && data.items) {
            data.items.slice(0, 3).forEach(item => {
              allArticles.push({
                title: item.title,
                link: item.link,
                description: item.description || item.content || '',
                source: source.name,
                pubDate: item.pubDate || new Date().toISOString()
              });
            });
          }
        } catch (error) {
          console.warn(`Erro ao buscar notícias de ${source.name}:`, error);
          // Adicionar notícia placeholder se a API falhar
          allArticles.push({
            title: `Notícias de ${source.name}`,
            link: source.url,
            description: 'Clique para acessar as últimas notícias',
            source: source.name,
            pubDate: new Date().toISOString()
          });
        }
      }
      
      // Ordenar por data (mais recentes primeiro)
      allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
      
      setNewsArticles(allArticles);
      console.log('📰 Notícias carregadas:', allArticles.length);
    } catch (error) {
      console.error('Erro ao buscar notícias:', error);
      // Adicionar notícias placeholder em caso de erro
      setNewsArticles([
        {
          title: 'G1 - Últimas Notícias',
          link: 'https://g1.globo.com',
          description: 'Acesse o G1 para ver as últimas notícias',
          source: 'G1',
          pubDate: new Date().toISOString()
        },
        {
          title: 'BBC Brasil',
          link: 'https://www.bbc.com/portuguese',
          description: 'Acesse a BBC Brasil para ver as últimas notícias',
          source: 'BBC Brasil',
          pubDate: new Date().toISOString()
        },
        {
          title: 'UOL Notícias',
          link: 'https://www.uol.com.br',
          description: 'Acesse o UOL para ver as últimas notícias',
          source: 'UOL',
          pubDate: new Date().toISOString()
        }
      ]);
    } finally {
      setLoadingNews(false);
    }
  }, []);
  
  // Estado para efeito de aplausos
  const [applauseActive, setApplauseActive] = useState(false);
  const applauseAudioRef = useRef(null);
  const applauseIntervalRef = useRef(null);
  
  // Função para gerar som de aplausos realista usando Web Audio API
  const generateApplauseSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const duration = 3.0; // 3 segundos
      const sampleRate = audioContext.sampleRate;
      const buffer = audioContext.createBuffer(2, duration * sampleRate, sampleRate); // Estéreo
      const leftChannel = buffer.getChannelData(0);
      const rightChannel = buffer.getChannelData(1);
      
      // Criar múltiplas camadas de aplausos para realismo
      const numLayers = 8; // 8 pessoas diferentes batendo palmas
      
      for (let layer = 0; layer < numLayers; layer++) {
        const layerDelay = Math.random() * 0.1; // Delay aleatório entre camadas
        const layerStart = Math.floor(layerDelay * sampleRate);
        const clapsPerSecond = 2 + Math.random() * 3; // 2-5 claps por segundo
        const numClaps = Math.floor((duration - layerDelay) * clapsPerSecond);
        
        for (let i = 0; i < numClaps; i++) {
          const clapTime = layerDelay + (i / clapsPerSecond) + (Math.random() * 0.1 - 0.05);
          const clapIndex = Math.floor(clapTime * sampleRate);
          
          // Duração do clap (mais curto e agudo)
          const clapDuration = Math.floor((0.005 + Math.random() * 0.01) * sampleRate);
          
          // Frequência característica de palmas (200-800 Hz)
          const frequency = 200 + Math.random() * 600;
          const phase = Math.random() * Math.PI * 2;
          
          for (let j = 0; j < clapDuration && clapIndex + j < leftChannel.length; j++) {
            const t = j / sampleRate;
            const envelope = Math.exp(-t * 50); // Decaimento rápido
            const noise = (Math.random() * 2 - 1) * 0.4;
            const tone = Math.sin(2 * Math.PI * frequency * t + phase) * 0.3;
            const sample = (noise + tone) * envelope * (0.3 + Math.random() * 0.4);
            
            // Panorâmica estéreo aleatória
            const pan = Math.random() * 2 - 1; // -1 (esquerda) a 1 (direita)
            const leftGain = pan < 0 ? 1 : 1 - pan;
            const rightGain = pan > 0 ? 1 : 1 + pan;
            
            leftChannel[clapIndex + j] += sample * leftGain;
            rightChannel[clapIndex + j] += sample * rightGain;
          }
        }
      }
      
      // Adicionar reverberação simples
      const reverbDelay = Math.floor(0.03 * sampleRate); // 30ms
      const reverbGain = 0.2;
      for (let i = reverbDelay; i < leftChannel.length; i++) {
        leftChannel[i] += leftChannel[i - reverbDelay] * reverbGain;
        rightChannel[i] += rightChannel[i - reverbDelay] * reverbGain;
      }
      
      // Normalizar
      let max = 0;
      for (let i = 0; i < leftChannel.length; i++) {
        const maxSample = Math.max(Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
        if (maxSample > max) max = maxSample;
      }
      if (max > 0) {
        const normalizeFactor = 0.85 / max;
        for (let i = 0; i < leftChannel.length; i++) {
          leftChannel[i] *= normalizeFactor;
          rightChannel[i] *= normalizeFactor;
        }
      }
      
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      
      // Conectar com master gain para controle de volume
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7; // Volume moderado
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      source.start();
      
      return audioContext;
    } catch (error) {
      console.warn('Erro ao gerar som de aplausos:', error);
      return null;
    }
  }, []);
  
  // Função para tocar efeito de aplausos realista
  const playApplause = useCallback(() => {
    if (applauseActive) return; // Evitar múltiplas execuções simultâneas
    
    setApplauseActive(true);
    setCurrentlyPlayingJingle('f1');
    
    // Gerar som de aplausos realista
    const audioContext = generateApplauseSound();
    
    // Criar container para efeitos visuais
    const applauseContainer = document.createElement('div');
    applauseContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    `;
    document.body.appendChild(applauseContainer);
    
    // Criar múltiplas mãos batendo palmas (mais realista)
    const numHands = 20;
    const hands = [];
    
    // Adicionar animação CSS se não existir
    if (!document.getElementById('applause-animation-style')) {
      const style = document.createElement('style');
      style.id = 'applause-animation-style';
      style.textContent = `
        @keyframes applauseHand {
          0% {
            transform: translateY(0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
          5% {
            transform: translateY(-5px) scale(1.1) rotate(-5deg);
            opacity: 1;
          }
          10% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          15% {
            transform: translateY(-3px) scale(1.05) rotate(3deg);
            opacity: 1;
          }
          20% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          30% {
            transform: translateY(-10px) scale(0.95) rotate(-8deg);
            opacity: 0.9;
          }
          50% {
            transform: translateY(-30px) scale(0.85) rotate(15deg);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-150px) scale(0.3) rotate(45deg);
            opacity: 0;
          }
        }
        @keyframes applausePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Criar ondas de aplausos (efeito de propagação)
    for (let wave = 0; wave < 3; wave++) {
      setTimeout(() => {
        for (let i = 0; i < numHands; i++) {
          const hand = document.createElement('div');
          hand.innerHTML = '👏';
          const startX = 10 + Math.random() * 80;
          const startY = 20 + Math.random() * 60;
          const delay = Math.random() * 0.3;
          
          hand.style.cssText = `
            position: absolute;
            font-size: ${24 + Math.random() * 16}px;
            left: ${startX}%;
            top: ${startY}%;
            opacity: 0;
            transform: translateY(0) scale(0.8);
            animation: applauseHand ${2 + Math.random()}s ease-out ${delay}s forwards;
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
          `;
          applauseContainer.appendChild(hand);
          hands.push(hand);
        }
      }, wave * 200); // Ondas com 200ms de intervalo
    }
    
    // Adicionar efeito de brilho pulsante no centro
    const glowEffect = document.createElement('div');
    glowEffect.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      animation: applausePulse 0.5s ease-in-out 3;
      pointer-events: none;
    `;
    applauseContainer.appendChild(glowEffect);
    
    // Limpar após animação
    setTimeout(() => {
      hands.forEach(h => h.remove());
      glowEffect.remove();
      applauseContainer.remove();
      setApplauseActive(false);
      setCurrentlyPlayingJingle(null);
      if (audioContext) {
        setTimeout(() => {
          audioContext.close();
        }, 100);
      }
    }, 3500);
    
    console.log('👏 Efeito de aplausos realista ativado!');
  }, [applauseActive, generateApplauseSound]);
  
  // Função para adicionar MP3 a um jingle específico
  const handleAddJingleToSlot = useCallback((jingleId, file) => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const audioUrl = reader.result;
      setJingleAudios(prev => {
        const updated = { ...prev, [jingleId]: audioUrl };
        localStorage.setItem('jingleAudios', JSON.stringify(updated));
        return updated;
      });
      console.log(`✅ MP3 adicionado ao jingle ${jingleId}:`, file.name);
    };
    reader.onerror = () => {
      console.error('Erro ao ler arquivo de áudio');
      alert('Erro ao carregar o arquivo de áudio');
    };
    reader.readAsDataURL(file);
  }, []);
  
  // Função para tocar MP3 de um jingle
  const playJingleAudio = useCallback((jingleId, audioUrl) => {
    if (!audioUrl) return null;
    
    // Parar qualquer áudio anterior deste jingle
    if (jingleAudioRefs.current[jingleId]) {
      jingleAudioRefs.current[jingleId].pause();
      jingleAudioRefs.current[jingleId].currentTime = 0;
    }
    
    // Criar novo elemento de áudio
    const audio = new Audio(audioUrl);
    // Volume será controlado pelo fader FX do MixerConsole
    jingleAudioRefs.current[jingleId] = audio;
    
    audio.onended = () => {
      setCurrentlyPlayingJingle(null);
      delete jingleAudioRefs.current[jingleId];
    };
    
    audio.onerror = () => {
      console.error('Erro ao tocar áudio do jingle:', jingleId);
      setCurrentlyPlayingJingle(null);
      delete jingleAudioRefs.current[jingleId];
    };
    
    audio.play().catch(error => {
      console.error('Erro ao reproduzir áudio:', error);
      setCurrentlyPlayingJingle(null);
    });
    
    return audio;
  }, []);
  
  // Handler para tocar jingles
  const handlePlayJingle = useCallback((jingleId) => {
    // Verificar se há MP3 customizado para este jingle
    const customAudio = jingleAudios[jingleId];
    
    if (customAudio) {
      // Tocar MP3 customizado
      setCurrentlyPlayingJingle(jingleId);
      playJingleAudio(jingleId, customAudio);
      return;
    }
    
    // Se não houver MP3 customizado, usar efeitos padrão
    if (jingleId === 'f1') {
      // Applause - tocar efeito de aplausos
      playApplause();
    } else if (jingleId === 'f3') {
      // Boas Vindas - tocar saudação
      setCurrentlyPlayingJingle(jingleId);
      playBoasVindas();
      setTimeout(() => {
        setCurrentlyPlayingJingle(null);
      }, 3000);
    } else if (jingleId === 'f5') {
      // Hora Certa - tocar manualmente (forçar execução)
      playHoraCerta(true);
    } else if (jingleId === 'f6') {
      // News - abrir modal de notícias
      setCurrentlyPlayingJingle(jingleId);
      setShowNewsModal(true);
      fetchNews();
      
      // Resetar estado após um tempo
      setTimeout(() => {
        setCurrentlyPlayingJingle(null);
      }, 1000);
    } else {
      // Outros jingles (implementar se necessário)
      console.log('Tocando jingle:', jingleId);
      setCurrentlyPlayingJingle(jingleId);
      // Aqui você pode adicionar lógica para tocar outros jingles
      setTimeout(() => {
        setCurrentlyPlayingJingle(null);
      }, 3000);
    }
  }, [playHoraCerta, fetchNews, playApplause, playBoasVindas, jingleAudios, playJingleAudio]);
  
  // Sistema de Fila de Reprodução
  const [playQueue, setPlayQueue] = useState([]);
  const playQueueRef = useRef([]);
  
  // Mapeamento entre trackId e requestId para remover pedidos quando a música tocar
  const trackToRequestMapRef = useRef(new Map());
  
  // Atualizar ref quando a fila mudar
  useEffect(() => {
    playQueueRef.current = playQueue;
  }, [playQueue]);
  
  // Auto DJ States
  const [autoDJ, setAutoDJ] = useState(false);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(3); // segundos
  const [playHistory, setPlayHistory] = useState([]);
  const [nextTrackPreview, setNextTrackPreview] = useState(null);
  const [isCrossfading, setIsCrossfading] = useState(false);
  
  const audioRef = useRef(null);
  const socketRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const audioContextRefForSpectrum = useRef(null);
  const mediaSourceCreationAttemptedRef = useRef(false);
  const broadcastStartTimeRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const broadcastAudioContextRef = useRef(null);
  const broadcastDestinationRef = useRef(null);
  const broadcastStreamRef = useRef(null);
  const broadcastGainNodeRef = useRef(null); // Ref para rastrear o gain node do broadcast
  const micStreamRef = useRef(null);
  const horaCertaAudioRef = useRef(null);
  const nextAudioRef = useRef(null); // Para crossfade
  const isManualPlayRef = useRef(false);
  const crossfadeTimeoutRef = useRef(null);
  const playTrackRef = useRef(null); // Ref para playTrack
  const isTransitioningRef = useRef(false); // Flag para evitar múltiplas transições
  const isSeekingRef = useRef(false); // Flag para quando o usuário está arrastando a barra
  const errorReportedTracksRef = useRef(new Set()); // Rastrear músicas que já tiveram erro reportado
  
  // Refs para streaming direto
  const streamingMediaRecorderRef = useRef(null);
  const streamingAudioContextRef = useRef(null);
  const streamingDestinationRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Limpar duplicatas do estado de tracks baseado em ID, nome e tamanho
  // Função para buscar e baixar música da internet
  const downloadMusicFromInternet = useCallback(async (songTitle, artist, requestId) => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
      
      console.log('🌐 Buscando música na internet:', { songTitle, artist });
      
      // Primeiro, buscar no YouTube
      let searchResponse;
      let searchResult;
      
      try {
        searchResponse = await fetch(`${apiBase}/api/music/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            song: songTitle,
            artist: artist
          })
        });
        
        // Verificar se a resposta é JSON válido
        const contentType = searchResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          searchResult = await searchResponse.json();
        } else {
          const text = await searchResponse.text();
          console.error('❌ Resposta não é JSON:', text.substring(0, 200));
          return { 
            success: false, 
            message: 'Erro ao buscar música. Servidor retornou resposta inválida.' 
          };
        }
      } catch (error) {
        console.error('❌ Erro na requisição de busca:', error);
        return { 
          success: false, 
          message: 'Erro ao conectar com o servidor. Verifique se o servidor está rodando.' 
        };
      }
      
      if (!searchResult || !searchResult.success || !searchResult.video) {
        console.log('❌ Nenhum vídeo encontrado na internet');
        return { 
          success: false, 
          message: searchResult?.message || 'Nenhuma música encontrada na internet' 
        };
      }
      
      console.log('✅ Vídeo encontrado:', searchResult.video.title);
      
      // Baixar o áudio
      let downloadResponse;
      
      try {
        downloadResponse = await fetch(`${apiBase}/api/music/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            song: songTitle,
            artist: artist,
            videoUrl: searchResult.video.url
          })
        });
        
        // Verificar se a resposta é um arquivo de áudio ou JSON de erro
        const contentType = downloadResponse.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          // Resposta é JSON (erro)
          const errorResult = await downloadResponse.json();
          console.error('❌ Erro ao baixar música:', errorResult);
          return { 
            success: false, 
            message: errorResult.message || 'Erro ao baixar música da internet',
            requiresInstallation: errorResult.requiresInstallation || false
          };
        }
        
        if (!downloadResponse.ok) {
          console.error('❌ Erro HTTP:', downloadResponse.status, downloadResponse.statusText);
          return { 
            success: false, 
            message: `Erro ao baixar música (${downloadResponse.status})` 
          };
        }
      } catch (error) {
        console.error('❌ Erro na requisição de download:', error);
        return { 
          success: false, 
          message: 'Erro ao conectar com o servidor. Verifique se o servidor está rodando.' 
        };
      }
      
      // Converter resposta para Blob
      let audioBlob;
      try {
        audioBlob = await downloadResponse.blob();
        
        // Verificar se o blob é válido
        if (!audioBlob || audioBlob.size === 0) {
          return { 
            success: false, 
            message: 'Arquivo baixado está vazio ou inválido' 
          };
        }
      } catch (error) {
        console.error('❌ Erro ao converter resposta para Blob:', error);
        return { 
          success: false, 
          message: 'Erro ao processar arquivo baixado' 
        };
      }
      
      // Criar File object a partir do Blob
      const audioFile = new File(
        [audioBlob],
        `${songTitle}${artist ? ` - ${artist}` : ''}.mp3`,
        { type: 'audio/mpeg' }
      );
      
      // Criar blob URL para o arquivo
      const blobUrl = URL.createObjectURL(audioFile);
      
      // Gerar ID único para a track
      const trackId = generateUniqueTrackId();
      
      // Criar track object
      const newTrack = {
        id: trackId,
        name: `${songTitle}${artist ? ` - ${artist}` : ''}`,
        title: songTitle,
        artist: artist || '',
        file: audioFile,
        url: blobUrl,
        playlistIds: [],
        downloadedFromInternet: true,
        videoId: searchResult.video.id,
        videoUrl: searchResult.video.url
      };
      
      // Adicionar à biblioteca
      setTracks(prev => [...prev, newTrack]);
      
      console.log('✅ Música adicionada à biblioteca:', newTrack.name);
      
      // Adicionar à fila automaticamente
      setPlayQueue(prev => {
        const alreadyInQueue = prev.some(t => t.id === newTrack.id);
        if (alreadyInQueue) {
          return prev;
        }
        return [...prev, newTrack];
      });
      
      // Mapear trackId -> requestId
      if (requestId) {
        trackToRequestMapRef.current.set(newTrack.id, requestId);
      }
      
      // Se não está tocando e Auto DJ está ativo, iniciar reprodução após um delay
      if (!isPlaying && autoDJ) {
        setTimeout(() => {
          if (playTrackRef.current) {
            playTrackRef.current(newTrack.id, false);
          }
        }, 500);
      }
      
      return {
        success: true,
        track: newTrack,
        message: 'Música baixada e adicionada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao baixar música da internet:', error);
      return {
        success: false,
        message: error.message || 'Erro ao baixar música da internet'
      };
    }
  }, [generateUniqueTrackId, setTracks, setPlayQueue, isPlaying, autoDJ]);

  // Funções para transmissão de tela
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      screenStreamRef.current = null;
    }
    
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = null;
    }
    
    setScreenStream(null);
    setIsScreenSharing(false);
    console.log('🛑 Compartilhamento de tela parado');
  }, []);
  
  const startScreenShare = useCallback(async (screenType = 'monitor') => {
    try {
      // Configurações baseadas no tipo de tela selecionado
      const videoConstraints = {
        cursor: 'always',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      };
      
      // Adicionar displaySurface baseado no tipo
      if (screenType === 'monitor') {
        videoConstraints.displaySurface = 'monitor';
      } else if (screenType === 'window') {
        videoConstraints.displaySurface = 'window';
      } else if (screenType === 'browser') {
        videoConstraints.displaySurface = 'browser';
      }
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: videoConstraints,
        audio: false
      });
      
      screenStreamRef.current = stream;
      setShowScreenOptions(false);
      
      // Primeiro atualizar os estados
      setScreenStream(stream);
      setIsScreenSharing(true);
      
      console.log('📹 Stream obtido:', stream);
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      
      // Aguardar um pouco para garantir que o componente seja renderizado
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Atribuir o stream ao elemento de vídeo
      if (screenVideoRef.current) {
        console.log('📹 Atribuindo stream ao elemento de vídeo...');
        screenVideoRef.current.srcObject = stream;
        
        // Tentar reproduzir o vídeo
        try {
          await screenVideoRef.current.play();
          console.log('✅ Vídeo iniciado com sucesso');
        } catch (playError) {
          console.warn('⚠️ Erro ao reproduzir vídeo:', playError);
          // Tentar novamente após um pequeno delay
          setTimeout(async () => {
            if (screenVideoRef.current && screenVideoRef.current.srcObject) {
              try {
                await screenVideoRef.current.play();
                console.log('✅ Vídeo iniciado no segundo tentativa');
              } catch (e) {
                console.error('❌ Erro ao reproduzir vídeo na segunda tentativa:', e);
              }
            }
          }, 300);
        }
        
        // Adicionar event listeners para debug
        screenVideoRef.current.onloadedmetadata = () => {
          console.log('✅ Metadata do vídeo carregado');
          console.log('📹 Dimensões:', screenVideoRef.current.videoWidth, 'x', screenVideoRef.current.videoHeight);
        };
        
        screenVideoRef.current.oncanplay = () => {
          console.log('✅ Vídeo pode ser reproduzido');
        };
        
        screenVideoRef.current.onerror = (e) => {
          console.error('❌ Erro no elemento de vídeo:', e);
          console.error('❌ Erro details:', screenVideoRef.current?.error);
        };
        
        screenVideoRef.current.onplaying = () => {
          console.log('▶️ Vídeo está reproduzindo');
        };
      } else {
        console.error('❌ screenVideoRef.current não está disponível');
      }
      
      // Quando o usuário para de compartilhar via botão do navegador
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          console.log('📹 Track de vídeo terminou');
          stopScreenShare();
        });
      }
      
      console.log('✅ Tela compartilhada com sucesso:', screenType);
    } catch (error) {
      console.error('❌ Erro ao compartilhar tela:', error);
      setShowScreenOptions(false);
      if (error.name === 'NotAllowedError') {
        alert('Permissão para compartilhar tela foi negada. Por favor, permita o acesso e tente novamente.');
      } else {
        alert('Erro ao compartilhar tela: ' + error.message);
      }
    }
  }, [stopScreenShare]);
  
  // Fechar menu do header ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHeaderMenu && !event.target.closest('[data-header-menu]')) {
        setShowHeaderMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHeaderMenu]);

  
  // Garantir que o stream seja atribuído ao elemento de vídeo quando disponível
  useEffect(() => {
    if (screenStream && screenVideoRef.current && isScreenSharing) {
      console.log('📹 Atribuindo stream ao elemento de vídeo...');
      screenVideoRef.current.srcObject = screenStream;
      
      const playVideo = async () => {
        try {
          await screenVideoRef.current.play();
          console.log('✅ Vídeo iniciado via useEffect');
        } catch (error) {
          console.warn('⚠️ Erro ao reproduzir vídeo no useEffect:', error);
        }
      };
      
      playVideo();
    }
  }, [screenStream, isScreenSharing]);
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, [stopScreenShare]);

  // Função de limpeza profunda das tracks
  const performDeepCleanup = useCallback(() => {
    console.log('🧹 Iniciando limpeza profunda das tracks...');
    const startCount = tracks.length;
    
    setTracks(prevTracks => {
      const validTracks = [];
      const seenFiles = new Map(); // Para detectar duplicatas
      const seenIds = new Set(); // Para garantir IDs únicos
      let fixedCount = 0;
      let removedCount = 0;
      let duplicateCount = 0;
      
      prevTracks.forEach((track, index) => {
        // Validar track básica
        if (!track || typeof track !== 'object') {
          console.warn(`⚠️ Track inválida removida (índice ${index}): não é objeto`);
          removedCount++;
          return;
        }
        
        // Validar ID
        if (!track.id || typeof track.id !== 'string') {
          console.warn(`⚠️ Track sem ID válido removida:`, track.name || 'sem nome');
          removedCount++;
          return;
        }
        
        // Verificar ID duplicado
        if (seenIds.has(track.id)) {
          console.warn(`⚠️ Track com ID duplicado removida:`, track.name || track.id);
          duplicateCount++;
          removedCount++;
          return;
        }
        seenIds.add(track.id);
        
        // Validar nome
        if (!track.name || typeof track.name !== 'string' || track.name.trim() === '') {
          console.warn(`⚠️ Track sem nome válido removida:`, track.id);
          removedCount++;
          return;
        }
        
        // Criar chave única para detectar duplicatas
        const fileKey = track.file 
          ? `${track.name}_${track.file.size}_${track.file.lastModified || 0}`
          : `${track.name}_${track.url || 'no-url'}`;
        
        // Verificar duplicata por arquivo
        if (seenFiles.has(fileKey)) {
          console.warn(`⚠️ Track duplicada removida:`, track.name);
          duplicateCount++;
          removedCount++;
          return;
        }
        seenFiles.set(fileKey, track);
        
        // Validar e corrigir URL
        let finalUrl = track.url;
        let urlFixed = false;
        
        if (!finalUrl || typeof finalUrl !== 'string' || finalUrl.trim() === '') {
          // Sem URL - tentar criar se tiver arquivo
          if (track.file && (track.file instanceof File || track.file instanceof Blob)) {
            try {
              // Revogar URL antiga se existir
              if (track.url && track.url.startsWith('blob:')) {
                try {
                  URL.revokeObjectURL(track.url);
                } catch (e) {
                  // Ignorar erro
                }
              }
              
              finalUrl = URL.createObjectURL(track.file);
              urlFixed = true;
              fixedCount++;
              console.log(`✅ URL recriada para:`, track.name);
            } catch (e) {
              console.error(`❌ Erro ao criar URL para:`, track.name, e);
              removedCount++;
              return;
            }
          } else {
            // Sem URL e sem arquivo - remover
            console.warn(`⚠️ Track sem URL e sem arquivo removida:`, track.name);
            removedCount++;
            return;
          }
        } else if (finalUrl.startsWith('blob:')) {
          // Verificar se blob URL está válida e se temos arquivo para recriar se necessário
          if (track.file && (track.file instanceof File || track.file instanceof Blob)) {
            // Sempre recriar blob URLs para garantir que estão válidas
            try {
              // Revogar URL antiga
              try {
                URL.revokeObjectURL(finalUrl);
              } catch (e) {
                // Ignorar erro ao revogar
              }
              
              // Criar nova blob URL
              finalUrl = URL.createObjectURL(track.file);
              urlFixed = true;
              fixedCount++;
              console.log(`✅ Blob URL recriada para:`, track.name);
            } catch (e) {
              console.error(`❌ Erro ao recriar blob URL para:`, track.name, e);
              removedCount++;
              return;
            }
          } else {
            // Blob URL sem arquivo - pode ser que o arquivo foi perdido
            // Tentar manter a URL, mas é arriscado
            console.warn(`⚠️ Track com blob URL mas sem arquivo:`, track.name, '- mantendo mas pode falhar ao tocar');
          }
        }
        
        // Criar track validada e corrigida
        const cleanedTrack = {
          ...track,
          url: finalUrl,
          name: track.name.trim() // Garantir nome sem espaços extras
        };
        
        validTracks.push(cleanedTrack);
      });
      
      const endCount = validTracks.length;
      const totalChanges = fixedCount + removedCount;
      
      console.log('🧹 Limpeza profunda concluída:');
      console.log(`   - Total antes: ${startCount}`);
      console.log(`   - Total depois: ${endCount}`);
      console.log(`   - URLs corrigidas: ${fixedCount}`);
      console.log(`   - Duplicatas removidas: ${duplicateCount}`);
      console.log(`   - Inválidas removidas: ${removedCount - duplicateCount}`);
      console.log(`   - Total de alterações: ${totalChanges}`);
      
      if (totalChanges > 0) {
        alert(`🧹 Limpeza profunda concluída!\n\n` +
              `• URLs corrigidas: ${fixedCount}\n` +
              `• Duplicatas removidas: ${duplicateCount}\n` +
              `• Inválidas removidas: ${removedCount - duplicateCount}\n` +
              `• Total de músicas: ${endCount}`);
      }
      
      return validTracks;
    });
  }, [tracks.length]);
  
  // Usar ref para evitar loop infinito
  const tracksLengthRef = useRef(tracks.length);
  const isCleaningDuplicatesRef = useRef(false);
  
  useEffect(() => {
    // Evitar processamento se já estiver limpando ou se o tamanho não mudou
    if (isCleaningDuplicatesRef.current || tracksLengthRef.current === tracks.length) {
      return;
    }
    
    // Marcar que estamos limpando para evitar loops
    isCleaningDuplicatesRef.current = true;
    tracksLengthRef.current = tracks.length;
    
    setTracks(prevTracks => {
      const seenIds = new Set(); // IDs únicos
      const seenFiles = new Map(); // Nome + tamanho -> track
      const uniqueTracks = [];
      let duplicatesFound = 0;
      
      prevTracks.forEach((track) => {
        // Verificar duplicata por ID
        if (seenIds.has(track.id)) {
          duplicatesFound++;
          return; // Ignorar esta track
        }
        
        // Verificar duplicata por nome + tamanho do arquivo
        const fileKey = track.file 
          ? `${track.name}_${track.file.size}_${track.file.lastModified || 0}`
          : `${track.name}_${track.url || 'no-url'}`;
        
        if (seenFiles.has(fileKey)) {
          duplicatesFound++;
          return; // Ignorar esta track (já existe uma igual)
        }
        
        // Track é única, adicionar
        seenIds.add(track.id);
        seenFiles.set(fileKey, track);
        uniqueTracks.push(track);
      });
      
      // Resetar flag após um pequeno delay
      setTimeout(() => {
        isCleaningDuplicatesRef.current = false;
      }, 100);
      
      if (duplicatesFound > 0) {
        // Retornar apenas se houver mudanças
        if (uniqueTracks.length !== prevTracks.length) {
          return uniqueTracks;
        }
      }
      
      return prevTracks;
    });
  }, [tracks.length]); // Executar quando o número de tracks mudar

  // Socket.io
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
    
    // Suprimir erros de WebSocket no console quando o servidor não está disponível
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // Função para verificar se é um erro de WebSocket que deve ser suprimido
    const isWebSocketError = (message) => {
      if (typeof message !== 'string') return false;
      const lowerMessage = message.toLowerCase();
      return (
        (lowerMessage.includes('websocket') || 
         lowerMessage.includes('socket.io') ||
         lowerMessage.includes('ws://') ||
         lowerMessage.includes('wss://')) &&
        (
          lowerMessage.includes('failed') ||
          lowerMessage.includes('closed') ||
          lowerMessage.includes('connection') ||
          lowerMessage.includes('before the connection is established') ||
          lowerMessage.includes('transport') ||
          lowerMessage.includes('eio=4') ||
          lowerMessage.includes('localhost:8080')
        )
      );
    };
    
    const suppressWebSocketErrors = () => {
      console.error = (...args) => {
        const message = args.join(' ');
        if (isWebSocketError(message)) {
          return; // Suprimir erro
        }
        originalError.apply(console, args);
      };
      
      console.warn = (...args) => {
        const message = args.join(' ');
        if (isWebSocketError(message)) {
          return; // Suprimir aviso
        }
        originalWarn.apply(console, args);
      };
      
      // Também suprimir logs relacionados a WebSocket
      console.log = (...args) => {
        const message = args.join(' ');
        if (isWebSocketError(message)) {
          return; // Suprimir log
        }
        originalLog.apply(console, args);
      };
    };
    
    const restoreConsole = () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    };
    
    // Suprimir erros ANTES de tentar conectar
    suppressWebSocketErrors();
    
    let isMounted = true;
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 10;
    const maxSilentAttempts = 3;
    
    // Função para criar conexão Socket.IO
    const createSocketConnection = () => {
      if (!isMounted) return;
      
      // Limpar socket anterior se existir
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
        } catch (e) {
          // Ignorar
        }
        socketRef.current = null;
      }
      
      try {
        // Tentar conectar com polling primeiro se websocket falhar várias vezes
        const usePollingFirst = connectionAttempts > 3;
        const transports = usePollingFirst ? ['polling', 'websocket'] : ['websocket', 'polling'];
        
      socketRef.current = io(socketUrl, {
          transports: transports,
        reconnection: true,
          reconnectionDelay: 1000 + (connectionAttempts * 500), // Backoff exponencial
          reconnectionAttempts: MAX_ATTEMPTS,
          reconnectionDelayMax: 10000,
          timeout: 15000,
        autoConnect: true,
        forceNew: false,
        upgrade: true,
        rememberUpgrade: false
      });
      
      socketRef.current.on('connect', () => {
          if (!isMounted) return;
          
        restoreConsole();
        connectionAttempts = 0;
        setIsSocketConnected(true);
          console.log('✅ [Socket] DJ conectado:', socketRef.current.id);
          // Registrar como broadcaster quando conectar (se estiver transmitindo)
          if (isBroadcasting) {
            socketRef.current.emit('broadcaster', {
              broadcasterId: socketRef.current.id,
              streaming: true,
              directStream: true,
              radioName: radioName
            });
            console.log('✅ [Socket] DJ registrado como broadcaster');
          } else {
            socketRef.current.emit('broadcaster', {
              broadcasterId: socketRef.current.id,
              radioName: radioName
            });
            console.log('✅ [Socket] DJ registrado como broadcaster');
          }
      });
      
      socketRef.current.on('connect_error', (error) => {
          if (!isMounted) return;
          
        connectionAttempts++;
          
        // Só mostrar aviso após algumas tentativas falhadas
        if (connectionAttempts > maxSilentAttempts) {
            // Não mostrar erro se for apenas uma tentativa de reconexão
            if ((error.type === 'TransportError' || error.message?.includes('websocket') || error.message?.includes('connection_refused')) && connectionAttempts < MAX_ATTEMPTS) {
              // Tentar novamente com polling silenciosamente
              setTimeout(() => {
                if (isMounted && !socketRef.current?.connected) {
                  createSocketConnection();
                }
              }, 2000);
              return;
            }
            
          restoreConsole();
            if (connectionAttempts >= MAX_ATTEMPTS) {
              console.warn('⚠️ [Socket] Servidor backend não está rodando após', connectionAttempts, 'tentativas');
              console.warn('⚠️ [Socket] Para habilitar transmissão ao vivo, inicie o servidor backend na porta 8080');
            }
          suppressWebSocketErrors();
        }
        // Não bloquear outras funcionalidades - o app continua funcionando localmente
      });
      
        socketRef.current.on('reconnect', (attemptNumber) => {
          if (!isMounted) return;
          
          restoreConsole();
          connectionAttempts = 0;
          setIsSocketConnected(true);
          console.log('✅ [Socket] DJ reconectado após', attemptNumber, 'tentativas');
          // Registrar como broadcaster quando reconectar (se estiver transmitindo)
          if (isBroadcasting) {
            socketRef.current.emit('broadcaster', {
              broadcasterId: socketRef.current.id,
              streaming: true,
              directStream: true,
              radioName: radioName
            });
            console.log('✅ [Socket] DJ reconectado como broadcaster');
          } else {
            socketRef.current.emit('broadcaster', {
              broadcasterId: socketRef.current.id,
              radioName: radioName
            });
          }
      });
      
      socketRef.current.on('reconnect_attempt', () => {
        // Suprimir logs de tentativas de reconexão
        suppressWebSocketErrors();
      });
      
      socketRef.current.on('reconnect_failed', () => {
          if (!isMounted) return;
          
        restoreConsole();
          console.warn('⚠️ [Socket] Falha ao reconectar após', MAX_ATTEMPTS, 'tentativas');
        // Desabilitar reconexão após falhas
          if (socketRef.current) {
        socketRef.current.io.reconnection(false);
          }
        suppressWebSocketErrors();
      });
      
      socketRef.current.on('disconnect', (reason) => {
          if (!isMounted) return;
          
        setIsSocketConnected(false);
        // Só logar desconexões não intencionais
        if (reason !== 'io client disconnect') {
          restoreConsole();
            console.warn('⚠️ [Socket] DJ desconectado:', reason);
          suppressWebSocketErrors();
        }
      });
      
        // Adicionar todos os outros handlers de eventos
      socketRef.current.on('listenerCount', (count) => {
        setListenerCount(count);
      });
      
      // Novos eventos WebRTC para status de conexão
      socketRef.current.on('webrtc:dj:status', (data) => {
        console.log('📡 Status WebRTC DJ:', data);
        if (data.status === 'broadcasting') {
          setWebrtcConnectionStatus(listenerCount > 0 ? 'connected' : 'waiting');
        }
      });
      
      socketRef.current.on('webrtc:connection:status', (data) => {
        console.log('🔗 Status conexão WebRTC:', data);
        if (data.status === 'connected') {
          setWebrtcConnectionStatus('connected');
          setActiveWebrtcConnections(prev => prev + 1);
        } else if (data.status === 'connecting') {
          setWebrtcConnectionStatus('connecting');
        } else if (data.status === 'error') {
          setWebrtcConnectionStatus('error');
        } else if (data.status === 'disconnected') {
          setActiveWebrtcConnections(prev => {
            const newCount = Math.max(0, prev - 1);
            if (newCount <= 0) {
              setWebrtcConnectionStatus('waiting');
            }
            return newCount;
          });
        }
      });
      
      // Atualizar status baseado em conexões ativas
      socketRef.current.on('watcher', (data) => {
        const watcherData = typeof data === 'object' ? data : { listenerId: data };
        console.log('👂 Novo ouvinte solicitando conexão:', watcherData.listenerId);
        setWebrtcConnectionStatus('connecting');
      });
      
      } catch (error) {
        console.error('❌ [Socket] Erro ao criar conexão:', error);
      }
    }; // Fim da função createSocketConnection
    
    // Iniciar conexão
    try {
      createSocketConnection();
    } catch (error) {
      console.error('❌ [Socket] Erro ao iniciar conexão:', error);
    }
    
      // Cleanup function
    return () => {
        isMounted = false;
      restoreConsole();
        
      if (socketRef.current) {
          try {
            socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
          } catch (e) {
            // Ignorar erros de cleanup
          }
        socketRef.current = null;
      }
    };
  }, []);

  // Enumerar e aplicar saída de áudio automaticamente ao montar
  useEffect(() => {
    const initializeAudioOutput = async () => {
      try {
        // Solicitar permissões
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (permError) {
        console.warn('Permissão não concedida:', permError);
      }
      
      try {
        // Enumerar dispositivos
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        setAudioOutputDevices(audioOutputs);
        
        // Aplicar automaticamente o dispositivo padrão
        if (audioOutputs.length > 0 && audioRef.current) {
          const defaultDevice = audioOutputs.find(d => d.deviceId === 'default') || audioOutputs[0];
          if (defaultDevice && audioRef.current.setSinkId) {
            try {
              await audioRef.current.setSinkId(defaultDevice.deviceId);
              setSelectedOutputDeviceId(defaultDevice.deviceId);
              console.log('✅ Saída de áudio aplicada automaticamente:', defaultDevice.label || defaultDevice.deviceId);
            } catch (error) {
              console.warn('⚠️ Não foi possível aplicar saída de áudio automaticamente:', error);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao enumerar dispositivos:', error);
      }
    };

    // Aguardar um pouco para garantir que o audioRef está disponível
    const timeout = setTimeout(() => {
      initializeAudioOutput();
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  // Aplicar saída de áudio automaticamente quando dispositivos mudarem
  useEffect(() => {
    const applyAudioOutput = async () => {
      if (!audioRef.current || !audioOutputDevices.length || selectedOutputDeviceId) return;
      
      // Aplicar automaticamente o dispositivo padrão
      const defaultDevice = audioOutputDevices.find(d => d.deviceId === 'default') || audioOutputDevices[0];
      if (defaultDevice && audioRef.current.setSinkId) {
        try {
          await audioRef.current.setSinkId(defaultDevice.deviceId);
          setSelectedOutputDeviceId(defaultDevice.deviceId);
          console.log('✅ Saída de áudio aplicada automaticamente:', defaultDevice.label || defaultDevice.deviceId);
        } catch (error) {
          console.warn('⚠️ Não foi possível aplicar saída de áudio automaticamente:', error);
        }
      }
    };

    applyAudioOutput();
  }, [audioOutputDevices, selectedOutputDeviceId]);

  // Atualizar uptime quando estiver transmitindo
  useEffect(() => {
    if (isBroadcasting && !broadcastStartTimeRef.current) {
      broadcastStartTimeRef.current = Date.now();
    } else if (!isBroadcasting) {
      broadcastStartTimeRef.current = null;
      setUptime(0);
    }
  }, [isBroadcasting]);

  useEffect(() => {
    if (!isBroadcasting) return;

    const interval = setInterval(() => {
      if (broadcastStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - broadcastStartTimeRef.current) / 1000);
        setUptime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isBroadcasting]);

  // Visualizador de áudio (Spectrum Analyzer)
  useEffect(() => {
    // Se não está tocando ou não há elemento de áudio, limpar e sair
    if (!isPlaying || !audioRef.current) {
      setSpectrumData(new Array(32).fill(0));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Se já tentamos criar o MediaElementSource e falhou, não tentar novamente
    if (mediaSourceCreationAttemptedRef.current && !mediaSourceRef.current) {
      // Já tentamos criar e falhou - simplesmente retornar sem fazer nada
      return;
    }

    // Se já existe MediaElementSource, apenas iniciar/continuar a animação
    if (mediaSourceRef.current && analyserRef.current) {
      // Retomar AudioContext se necessário
      if (audioContextRefForSpectrum.current && audioContextRefForSpectrum.current.state === 'suspended') {
        audioContextRefForSpectrum.current.resume().catch(() => {
          // Ignorar erro silenciosamente
        });
      }

      // Iniciar animação se não estiver rodando
      if (!animationFrameRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const updateSpectrum = () => {
          if (!isPlaying || !analyserRef.current) {
            setSpectrumData(new Array(32).fill(0));
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
            return;
          }

          analyserRef.current.getByteFrequencyData(dataArray);
          
          const bars = 32;
          const step = Math.floor(dataArray.length / bars);
          const newSpectrum = [];
          
          for (let i = 0; i < bars; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
              sum += dataArray[i * step + j] || 0;
            }
            newSpectrum.push((sum / step / 255) * 100);
          }
          
          setSpectrumData(newSpectrum);
          animationFrameRef.current = requestAnimationFrame(updateSpectrum);
        };

        updateSpectrum();
      }
      return;
    }

    // Criar AudioContext, Analyser e MediaElementSource apenas uma vez
    try {
      if (!audioRef.current) {
        console.warn('⚠️ audioRef não está disponível ainda');
        return;
      }

      // Criar ou reutilizar AudioContext
      let audioContext = audioContextRefForSpectrum.current;
      if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRefForSpectrum.current = audioContext;
      }

      // Retomar AudioContext se estiver suspenso
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {
          // Ignorar erro silenciosamente
        });
      }

      // Criar Analyser se não existir
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 64;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      // Criar MediaElementSource APENAS se não existir e nunca tentamos antes
      // CRÍTICO: Um HTMLAudioElement só pode ter UM MediaElementSource durante toda sua vida útil
      // IMPORTANTE: O MediaElementSource persiste mesmo quando o src do audio muda
      if (!mediaSourceRef.current) {
        // Se já tentamos criar antes, não tentar novamente
        if (mediaSourceCreationAttemptedRef.current) {
          // Já tentamos e falhou - pular completamente
          return;
        }
        
        // Marcar ANTES de tentar criar
        mediaSourceCreationAttemptedRef.current = true;
        
        // Tentar criar com tratamento de erro completo
        try {
          if (audioRef.current && analyserRef.current && !audioRef.current.srcObject) {
          const source = audioContext.createMediaElementSource(audioRef.current);
          mediaSourceRef.current = source;
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);
            console.log('✅ MediaElementSource criado e conectado ao spectrum analyzer');
            
            // MediaElementSource será conectado ao stream direto quando necessário
          }
        } catch (createError) {
          // Verificar se o erro é porque já existe um MediaElementSource
          if (createError.message && createError.message.includes('already connected')) {
            console.log('ℹ️ MediaElementSource já existe para este elemento de áudio');
          } else {
            console.warn('⚠️ Erro ao criar MediaElementSource:', createError.message);
          }
          // Não tentar novamente
        }
      } else {
        // MediaElementSource já existe - garantir que está conectado corretamente
        // Não recriar, apenas verificar conexões
        try {
          // Verificar se o analyser ainda está conectado
          if (analyserRef.current && audioContextRefForSpectrum.current) {
            // O MediaElementSource persiste mesmo quando o src muda
            // Apenas garantir que as conexões estão corretas
            console.log('ℹ️ MediaElementSource já existe, verificando conexões...');
          }
        } catch (checkError) {
          console.warn('⚠️ Erro ao verificar conexões do MediaElementSource:', checkError.message);
        }
      }

      // Iniciar animação do spectrum
      if (!analyserRef.current) {
        return;
      }

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

      const updateSpectrum = () => {
        if (!isPlaying || !analyserRef.current) {
          setSpectrumData(new Array(32).fill(0));
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }

        analyserRef.current.getByteFrequencyData(dataArray);
        
        const bars = 32;
        const step = Math.floor(dataArray.length / bars);
        const newSpectrum = [];
        
        for (let i = 0; i < bars; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0;
          }
          newSpectrum.push((sum / step / 255) * 100);
        }
        
        setSpectrumData(newSpectrum);
        animationFrameRef.current = requestAnimationFrame(updateSpectrum);
      };

      updateSpectrum();
    } catch (error) {
      // Capturar todos os erros silenciosamente - especialmente erros de MediaElementSource
      // Não logar para evitar spam no console
      // O áudio continuará funcionando mesmo sem o spectrum analyzer
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  // Limpeza ao desmontar componente
  useEffect(() => {
    return () => {
      // IMPORTANTE: NÃO desconectar o MediaElementSource aqui
      // O elemento de áudio pode ser reutilizado e desconectar quebraria a conexão
      // Uma vez que um HTMLAudioElement é conectado a um MediaElementSource,
      // essa conexão é permanente até que o elemento seja destruído
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // NÃO limpar mediaSourceRef aqui - ele será reutilizado se o elemento for reutilizado
      // Apenas resetar a flag de tentativa para permitir nova tentativa se necessário
      // Mas manter a referência para reutilização
      
      // NÃO fechar o AudioContext aqui - ele pode ser reutilizado
      // Apenas limpar a referência se realmente necessário
    };
  }, []);

  // Atualizar tempo da música
  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeekingRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      
      if (!isNaN(current) && current >= 0) {
        setCurrentTime(current);
      }
      
      if (!isNaN(dur) && dur > 0) {
        if (!duration || Math.abs(duration - dur) > 0.1) {
          setDuration(dur);
        }
      }
    }
  };
  
  // Garantir que a duração e o tempo sejam atualizados periodicamente quando estiver tocando
  // Removido - duplicado com o useEffect abaixo na linha 4475

  // Manipular barra de progresso
  const handleProgressChange = (e) => {
    if (!audioRef.current || !duration) return;
    
    const newTime = parseFloat(e.target.value);
    isSeekingRef.current = true;
    setCurrentTime(newTime);
    
    try {
      audioRef.current.currentTime = newTime;
    } catch (err) {
      console.error('Erro ao alterar posição:', err);
    }
  };

  const handleProgressMouseUp = () => {
    isSeekingRef.current = false;
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Gerar path SVG para visualização de ondas sonoras
  const generateWaveformPath = (spectrum, playing, progress) => {
    const width = 200;
    const height = 40;
    const centerY = height / 2;
    const bars = 60; // Número de barras na onda
    
    if (!playing || !spectrum || spectrum.length === 0) {
      // Quando não está tocando, mostrar onda suave baseada no progresso
      const points = [];
      for (let i = 0; i <= bars; i++) {
        const x = (i / bars) * width;
        const waveHeight = Math.sin((i / bars) * Math.PI * 4 + progress * 0.1) * 6;
        const y = centerY + waveHeight;
        if (i === 0) {
          points.push(`M ${x},${y}`);
        } else {
          points.push(`L ${x},${y}`);
        }
      }
      return (
        <WaveformPathComponent
          d={points.join(' ')}
          color="#06b6d4"
          shadow="rgba(6, 182, 212, 0.4)"
          strokeWidth={2}
        />
      );
    }
    
    // Quando está tocando, usar dados do spectrum para criar ondas
    const pathData = [];
    const step = Math.max(1, Math.floor(spectrum.length / bars));
    
    // Criar linha superior da onda
    for (let i = 0; i < bars; i++) {
      const x = (i / bars) * width;
      const dataIndex = Math.min(i * step, spectrum.length - 1);
      const amplitude = spectrum[dataIndex] || 0;
      const waveHeight = (amplitude / 255) * (height * 0.35);
      const y = centerY - waveHeight;
      
      if (i === 0) {
        pathData.push(`M ${x},${y}`);
      } else {
        pathData.push(`L ${x},${y}`);
      }
    }
    
    // Criar linha inferior (espelho) para formar a onda completa
    for (let i = bars - 1; i >= 0; i--) {
      const x = (i / bars) * width;
      const dataIndex = Math.min(i * step, spectrum.length - 1);
      const amplitude = spectrum[dataIndex] || 0;
      const waveHeight = (amplitude / 255) * (height * 0.35);
      const y = centerY + waveHeight;
      pathData.push(`L ${x},${y}`);
    }
    
    pathData.push('Z'); // Fechar o path
    
    return (
      <>
        <defs>
          <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <WaveformPathComponent
          d={pathData.join(' ')}
          color="#22d3ee"
          shadow="rgba(34, 211, 238, 0.6)"
          fill="url(#waveformGradient)"
          strokeWidth={1.5}
        />
      </>
    );
  };

  const formatUptime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Obter próxima música baseado no modo (sequencial ou shuffle)
  const getNextTrack = useCallback(() => {
    // PRIORIDADE 1: Verificar se há músicas na fila
    // Usar ref para acessar o estado atual da fila (evita problemas de closure)
    if (playQueueRef.current.length > 0) {
      const nextInQueue = playQueueRef.current[0];
      console.log('getNextTrack: 🎵 Música encontrada na fila:', nextInQueue.name || nextInQueue.title);
      return nextInQueue;
    }
    
    if (tracks.length === 0) {
      console.log('getNextTrack: Nenhuma música disponível');
      return null;
    }
    
    // Sempre usar todas as músicas disponíveis
    const availableTracks = tracks;
    
    if (availableTracks.length === 0) {
      console.log('getNextTrack: Nenhuma música disponível');
      return null;
    }
    
    // Se não há música atual, retornar a primeira
    if (!currentTrackId) {
      console.log('getNextTrack: Sem música atual, retornando primeira');
      return availableTracks[0];
    }
    
    if (shuffleMode) {
      // Modo aleatório - evitar repetir músicas recentes
      const recentIds = playHistory.slice(-10);
      const available = availableTracks.filter(t => 
        t.id !== currentTrackId && !recentIds.includes(t.id)
      );
      
      if (available.length === 0) {
        // Se todas foram tocadas recentemente, resetar
        const filtered = availableTracks.filter(t => t.id !== currentTrackId);
        if (filtered.length === 0) {
          console.log('getNextTrack: Todas as músicas foram tocadas, reiniciando');
          return availableTracks[0];
        }
        const selected = filtered[Math.floor(Math.random() * filtered.length)];
        console.log('getNextTrack: Selecionada aleatória (reset):', selected.name);
        return selected;
      }
      
      const selected = available[Math.floor(Math.random() * available.length)];
      console.log('getNextTrack: Selecionada aleatória:', selected.name);
      return selected;
    } else {
      // Modo sequencial
      const currentIndex = availableTracks.findIndex(t => t.id === currentTrackId);
      const nextIndex = currentIndex >= 0 && currentIndex < availableTracks.length - 1
        ? currentIndex + 1
        : 0;
      const selected = availableTracks[nextIndex];
      console.log('getNextTrack: Sequencial - índice atual:', currentIndex, 'próximo:', nextIndex, 'música:', selected?.name);
      return selected;
    }
  }, [tracks, shuffleMode, playHistory, currentTrackId]);

  // Atualizar preview da próxima música
  useEffect(() => {
    if (autoDJ && currentTrackId) {
      const next = getNextTrack();
      setNextTrackPreview(next);
    } else {
      setNextTrackPreview(null);
    }
  }, [autoDJ, currentTrackId, tracks, shuffleMode, getNextTrack]);

  // Handler para quando a música termina (definido antes de playTrack para evitar erro de inicialização)
  const handleTrackEnded = useCallback(() => {
    // Evitar múltiplas chamadas simultâneas
    if (isTransitioningRef.current) {
      console.log('Transição já em andamento, ignorando...');
      return;
    }
    
    console.log('Música terminou. autoDJ:', autoDJ, 'isManualPlay:', isManualPlayRef.current);
    setIsPlaying(false);
    
    // Remover música atual da fila se estava na fila
    setPlayQueue(prev => {
      if (prev.length > 0 && prev[0].id === currentTrackId) {
        console.log('Removendo música da fila:', prev[0].name || prev[0].title);
        return prev.slice(1);
      }
      return prev;
    });
    
    if (autoDJ && !isManualPlayRef.current) {
      isTransitioningRef.current = true;
      console.log('Auto DJ ativo, buscando próxima música...');
      
      // Limpar o áudio atual completamente antes de tocar a próxima
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.removeEventListener('ended', handleTrackEnded);
        } catch (e) {
          console.warn('Erro ao limpar áudio:', e);
        }
      }
      
      const nextTrack = getNextTrack();
      console.log('Próxima música encontrada:', nextTrack);
      
      if (nextTrack) {
        isManualPlayRef.current = false;
        // Usar crossfade se configurado
        const shouldUseCrossfade = crossfadeDuration > 0;
        
        // Tocar próxima música imediatamente
        const playNext = () => {
          console.log('Tocando próxima música:', nextTrack.name || nextTrack.title, 'com crossfade:', shouldUseCrossfade);
          if (playTrackRef.current) {
            playTrackRef.current(nextTrack.id, shouldUseCrossfade);
          }
          isTransitioningRef.current = false;
        };
        
        // Função para tocar próxima música
        const playNextTrack = () => {
          console.log('Tocando próxima música:', nextTrack.name || nextTrack.title, 'com crossfade:', shouldUseCrossfade);
          if (playTrackRef.current) {
            // Passar flag indicando que é transição do Auto DJ para reduzir delays
            playTrackRef.current(nextTrack.id, shouldUseCrossfade, true);
          }
          isTransitioningRef.current = false;
        };
        
        // Sem crossfade: tocar imediatamente
        // Com crossfade: pequeno delay para detectar música anterior
        if (shouldUseCrossfade) {
          // Crossfade precisa de um pequeno delay para detectar a música anterior
          setTimeout(playNextTrack, 50);
        } else {
          // Sem crossfade, usar requestAnimationFrame para tocar na próxima renderização (quase instantâneo)
          requestAnimationFrame(() => {
            playNextTrack();
          });
        }
      } else {
        // Se não há próxima música, tentar reiniciar do início
        console.log('Nenhuma próxima música encontrada, reiniciando...');
        setTimeout(() => {
          const firstTrack = getNextTrack();
          if (firstTrack) {
            isManualPlayRef.current = false;
            console.log('Reiniciando com:', firstTrack.name || firstTrack.title);
            if (playTrackRef.current) {
              // Passar flag indicando que é transição do Auto DJ
              playTrackRef.current(firstTrack.id, false, true);
            }
          } else {
            console.warn('Nenhuma música disponível para tocar');
            setIsPlaying(false);
          }
          isTransitioningRef.current = false;
        }, 50);
      }
    } else {
      isManualPlayRef.current = false;
      isTransitioningRef.current = false;
    }
  }, [autoDJ, getNextTrack, crossfadeDuration, isPlaying, currentTrackId, playBoasVindas]);

  // Play track com crossfade (usa handleTrackEnded que já foi definido)
  const playTrack = useCallback((trackId, useCrossfade = false, isAutoDJTransition = false) => {
    // Permitir reiniciar a música mesmo se já estiver tocando (se for play manual)
    if (currentTrackId === trackId && isPlaying && !isManualPlayRef.current) {
      console.log('⏸️ Música já está tocando, ignorando...');
      return;
    }
    const track = tracks.find(t => t.id === trackId);
    if (!track) {
      console.warn('❌ Track não encontrada:', trackId);
      return;
    }
    
    // Validar se a URL da track é válida
    if (!track.url || typeof track.url !== 'string' || track.url.trim() === '') {
      console.error('❌ URL da música inválida:', track.name, track.url);
      alert(`Erro: A música "${track.name}" não possui uma URL válida. Por favor, remova e adicione novamente.`);
      return;
    }
    
    console.log('▶️ Iniciando reprodução de:', track.name, 'URL:', track.url);
    
    // Remover música da fila quando começar a tocar
    setPlayQueue(prev => {
      const index = prev.findIndex(t => t.id === trackId);
      if (index >= 0) {
        const removedTrack = prev[index];
        console.log('🎵 Removendo música da fila ao iniciar reprodução:', removedTrack.name || removedTrack.title);
        const newQueue = prev.filter((_, i) => i !== index);
        // Atualizar ref imediatamente para que getNextTrack tenha acesso ao estado atualizado
        playQueueRef.current = newQueue;
        return newQueue;
      }
      return prev;
    });
    
    // Verificar se há um pedido associado a esta música e removê-lo do chat
    const requestId = trackToRequestMapRef.current.get(trackId);
    if (requestId) {
      console.log('🗑️ Removendo pedido do chat - trackId:', trackId, 'requestId:', requestId);
      
      // Tocar saudação de boas-vindas quando uma música pedida começar
      playBoasVindas();
      
      // Remover do estado de pedidos
      setSongRequests(prev => {
        const filtered = prev.filter(r => r.id !== requestId);
        if (filtered.length !== prev.length) {
          console.log('✅ Pedido removido do chat:', requestId);
        }
        return filtered;
      });
      // Remover do mapeamento
      trackToRequestMapRef.current.delete(trackId);
      
      // Emitir evento para remover do backend também
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('chat:request:executed', requestId);
      }
    }
    
    console.log('playTrack chamado:', trackId, 'useCrossfade:', useCrossfade, 'isPlaying:', isPlaying);
    
    if (useCrossfade && isPlaying && audioRef.current && crossfadeDuration > 0) {
      // Crossfade entre músicas
      setIsCrossfading(true);
      // Usar o volume do canal MUSIC como base para o fade
      const currentVolume = channels.music / 100;
      const fadeStep = currentVolume / (crossfadeDuration * 10); // 10 steps por segundo
      let fadeInterval = null;
      
              // Recriar blob URL se necessário antes de criar o próximo áudio
      let crossfadeUrl = track.url;
      if (track.url.startsWith('blob:') && track.file) {
        try {
          if (track.file instanceof File || track.file instanceof Blob) {
            // Revogar URL antiga se existir
            try {
              if (track.url && track.url.startsWith('blob:')) {
                URL.revokeObjectURL(track.url);
              }
            } catch (e) {
              // Ignorar erro ao revogar
            }
            
            // Criar novo blob URL
            crossfadeUrl = URL.createObjectURL(track.file);
            
            // Atualizar a track com a nova URL
            setTracks(prev => prev.map(t => 
              t.id === track.id 
                ? { ...t, url: crossfadeUrl }
                : t
            ));
            
            // Atualizar referência local
            track.url = crossfadeUrl;
            
            console.log('✅ Blob URL recriado para crossfade:', track.name);
          }
        } catch (e) {
          console.error('❌ Erro ao recriar blob URL para crossfade:', e);
          // Continuar com URL original
        }
      }
      
      // Criar próximo áudio
      const nextAudio = new Audio(crossfadeUrl);
      nextAudio.volume = 0;
      nextAudio.crossOrigin = "anonymous";
      // CRÍTICO: Configurar onEnded no novo áudio
      nextAudio.addEventListener('ended', handleTrackEnded);
      nextAudioRef.current = nextAudio;
      
      // Volume máximo baseado no canal MUSIC (não no volume atual que pode estar sendo reduzido)
      const maxVolume = channels.music / 100;
      
      // Fade out atual
      fadeInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0) {
          audioRef.current.volume = Math.max(0, audioRef.current.volume - fadeStep);
        } else {
          clearInterval(fadeInterval);
          
          // Fade in próximo
          // Usar o volume do canal MUSIC como máximo (controlado pelo fader MUSIC)
          nextAudio.volume = 0;
          nextAudio.play().then(() => {
            let fadeInInterval = setInterval(() => {
              if (nextAudio.volume < maxVolume) {
                nextAudio.volume = Math.min(maxVolume, nextAudio.volume + fadeStep);
              } else {
                clearInterval(fadeInInterval);
                setIsCrossfading(false);
                
                // Remover evento do áudio antigo
                if (audioRef.current) {
                  audioRef.current.removeEventListener('ended', handleTrackEnded);
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                }
                
                // Trocar referências
                audioRef.current = nextAudio;
                // Aplicar volume do fader MUSIC (será controlado pelo MixerConsole)
                // O volume já está correto do fade in, mas garantimos que está aplicado
                nextAudioRef.current = null;
                
                setCurrentTrackId(trackId);
                setIsPlaying(true);
                isTransitioningRef.current = false;
                
                // Adicionar ao histórico
                setPlayHistory(prev => [...prev.slice(-49), trackId]);
                
                console.log('Crossfade completo, tocando:', track.name);
              }
            }, 100);
          }).catch(err => {
            console.error('Erro ao tocar próximo áudio:', err);
            setIsCrossfading(false);
            isTransitioningRef.current = false;
            if (nextAudioRef.current) {
              try {
                nextAudioRef.current.removeEventListener('ended', handleTrackEnded);
              } catch (e) {
                console.warn('Erro ao remover listener:', e);
              }
              nextAudioRef.current = null;
            }
          });
        }
      }, 100);
    } else {
      // Play normal sem crossfade
      setCurrentTrackId(trackId);
      
      // Função auxiliar para tentar tocar a música
      const attemptPlay = async () => {
        if (!audioRef.current) {
          console.error('audioRef não está disponível, tentando novamente...');
          // Tentar novamente após um pequeno delay
          setTimeout(attemptPlay, 100);
          return;
        }
        
        try {
          // CRÍTICO: Resetar completamente o elemento de áudio antes de carregar nova música
          try {
            // Remover todos os event listeners
            audioRef.current.removeEventListener('ended', handleTrackEnded);
            // Pausar e resetar
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            // Limpar o src ANTES de definir um novo para garantir reset completo
            audioRef.current.src = '';
            audioRef.current.removeAttribute('src');
            // Forçar um load vazio para resetar o estado interno
            audioRef.current.load();
            
            // CRÍTICO: Aguardar que o elemento esteja completamente resetado
            // Verificar se o readyState voltou para HAVE_NOTHING (0)
            let resetAttempts = 0;
            while (audioRef.current.readyState !== 0 && resetAttempts < 10) {
              await new Promise(resolve => setTimeout(resolve, 50));
              resetAttempts++;
            }
          } catch (e) {
            console.warn('Erro ao limpar áudio anterior:', e);
          }
          
          // Aguardar um pouco mais para garantir que o reset foi processado
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Configurar volume inicial baseado no playerVolume
          audioRef.current.volume = playerVolume / 100;
          
          // Volume será controlado pelo fader MUSIC do MixerConsole
          
          // Prevenir ERR_REQUEST_RANGE_NOT_SATISFIABLE:
          // Sempre recriar blob URL antes de usar para garantir que está válido
          let finalUrl = track.url;
          
          if (track.url.startsWith('blob:') && track.file) {
            try {
              if (track.file instanceof File || track.file instanceof Blob) {
                // Sempre recriar blob URL para evitar problemas de expiração
                // Revogar URL antiga se existir
                try {
                  if (track.url && track.url.startsWith('blob:')) {
                    URL.revokeObjectURL(track.url);
                  }
                } catch (e) {
                  // Ignorar erro ao revogar
                }
                
                // Criar novo blob URL
                finalUrl = URL.createObjectURL(track.file);
                
                // Atualizar a track com a nova URL IMEDIATAMENTE
                setTracks(prev => prev.map(t => 
                  t.id === track.id 
                    ? { ...t, url: finalUrl }
                    : t
                ));
                
                // Atualizar também a referência local da track para usar a nova URL
                track.url = finalUrl;
                
                console.log('✅ Blob URL recriado preventivamente para:', track.name);
                console.log('📝 Nova URL:', finalUrl);
              } else {
                console.warn('⚠️ track.file não é File ou Blob:', track.file);
                // Tentar usar URL original
              }
            } catch (e) {
              console.error('❌ Erro ao recriar blob URL preventivamente:', e);
              // Tentar continuar com a URL original se ainda for blob
              if (!finalUrl || !finalUrl.startsWith('blob:')) {
                alert(`Erro ao processar a música "${track.name}". O arquivo pode estar corrompido.`);
                setIsPlaying(false);
                isTransitioningRef.current = false;
                return;
              }
            }
          } else if (!track.file && track.url.startsWith('blob:')) {
            // Se temos um blob URL mas não temos mais o arquivo, não podemos recriar
            console.error('❌ Blob URL sem arquivo original para:', track.name);
            alert(`Erro: A música "${track.name}" não pode ser reproduzida. O arquivo não está mais disponível. Por favor, remova e adicione novamente.`);
            setIsPlaying(false);
            isTransitioningRef.current = false;
            return;
          } else if (!finalUrl || finalUrl.trim() === '') {
            console.error('❌ URL inválida para:', track.name);
            alert(`Erro: A música "${track.name}" não possui uma URL válida. Por favor, remova e adicione novamente.`);
            setIsPlaying(false);
            isTransitioningRef.current = false;
            return;
          }
          
          // Garantir que a URL está correta antes de definir
          if (!finalUrl || finalUrl.trim() === '') {
            console.error('❌ finalUrl está vazia após processamento');
            alert(`Erro ao processar a música "${track.name}". Por favor, remova e adicione novamente.`);
            setIsPlaying(false);
            isTransitioningRef.current = false;
            return;
          }
          
          // CRÍTICO: Definir src e configurar ANTES de load()
          audioRef.current.src = finalUrl;
          audioRef.current.crossOrigin = "anonymous";
          // Prevenir range requests que podem causar ERR_REQUEST_RANGE_NOT_SATISFIABLE
          // Configurar preload para "auto" para carregar o arquivo completo
          audioRef.current.preload = "auto";
          // CRÍTICO: Garantir que onEnded está configurado ANTES de load()
          audioRef.current.addEventListener('ended', handleTrackEnded);
          
          // Resetar tempo e duração quando começar nova música
          setCurrentTime(0);
          setDuration(0);
          
          // Carregar a música - isso vai resetar o estado interno do elemento
          audioRef.current.load();
          
          // CRÍTICO: Aguardar que o load seja processado antes de tentar tocar
          // Reduzir delay se for transição do Auto DJ para resposta mais rápida
          const loadDelay = isAutoDJTransition ? 20 : 100;
          await new Promise(resolve => setTimeout(resolve, loadDelay));
          
          // Para Auto DJ, aceitar readyState >= 1 (HAVE_METADATA) para tocar mais rápido
          const minReadyState = isAutoDJTransition ? 1 : 2;
          
          // Aguardar o load antes de tocar
          const canPlayHandler = () => {
            // Usar finalUrl em vez de track.url pois pode ter sido atualizado
            if (audioRef.current && audioRef.current.src === finalUrl) {
              // CRÍTICO: Verificar se o elemento está realmente pronto para tocar
              if (audioRef.current.readyState < minReadyState) {
                // Se ainda não está pronto, aguardar mais um pouco
                console.log('⏳ Aguardando elemento estar pronto... readyState:', audioRef.current.readyState);
                const retryDelay = isAutoDJTransition ? 50 : 100;
                setTimeout(() => {
                  if (audioRef.current && audioRef.current.src === finalUrl && !audioRef.current.paused) {
                    return; // Já está tocando
                  }
                  canPlayHandler();
                }, retryDelay);
                return;
              }
              
              // Garantir que o volume está configurado antes de tocar
              audioRef.current.volume = playerVolume / 100;
              
              // Tentar obter a duração antes de tocar
              if (audioRef.current.duration && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
                setDuration(audioRef.current.duration);
              }
              
              // CRÍTICO: Verificar se já está tocando antes de tentar tocar novamente
              if (!audioRef.current.paused) {
                console.log('ℹ️ Áudio já está tocando, pulando play()');
                setIsPlaying(true);
                isTransitioningRef.current = false;
                return;
              }
              
              audioRef.current.play().then(() => {
                setIsPlaying(true);
                setPlayHistory(prev => [...prev.slice(-49), trackId]);
                
                // Aguardar um pouco para a duração estar disponível
                const checkDuration = () => {
                  if (audioRef.current) {
                    const dur = audioRef.current.duration;
                    if (!isNaN(dur) && dur > 0 && dur !== Infinity) {
                      setDuration(dur);
                      console.log('✅ Duração definida:', dur, 'segundos');
                    } else if (audioRef.current.readyState >= 2) {
                      // Se readyState >= 2 (HAVE_CURRENT_DATA), tentar novamente
                      setTimeout(checkDuration, 100);
                    }
                  }
                };
                
                // Verificar imediatamente e depois novamente após delays
                checkDuration();
                setTimeout(checkDuration, 200);
                setTimeout(checkDuration, 500);
                setTimeout(checkDuration, 1000);
                
                // Garantir que o tempo atual seja atualizado
                setCurrentTime(0);
                
                console.log('✅ Tocando:', track.name, 'Volume:', audioRef.current.volume, 'URL:', track.url);
                console.log('📊 Estado inicial - Duração:', audioRef.current.duration, 'Tempo atual:', audioRef.current.currentTime);
                console.log('📊 ReadyState:', audioRef.current.readyState);
                isTransitioningRef.current = false;
              }).catch(err => {
                console.error('❌ Erro ao tocar:', err);
                console.error('URL da música:', track.url);
                console.error('Estado do áudio:', {
                  readyState: audioRef.current?.readyState,
                  networkState: audioRef.current?.networkState,
                  error: audioRef.current?.error
                });
                
                // Mostrar erro mais descritivo ao usuário
                let errorMessage = 'Erro ao reproduzir a música. ';
                if (err.name === 'NotAllowedError') {
                  errorMessage += 'Por favor, interaja com a página primeiro (clique em algum lugar) e tente novamente.';
                } else if (err.name === 'NotSupportedError') {
                  errorMessage += 'O formato de áudio pode não ser suportado pelo navegador.';
                } else {
                  errorMessage += 'Verifique se o arquivo ainda está disponível.';
                }
                
                alert(errorMessage);
                setIsPlaying(false);
                isTransitioningRef.current = false;
              });
            }
          };
          
          // Adicionar múltiplos listeners para garantir que capturamos quando está pronto
          audioRef.current.addEventListener('canplay', canPlayHandler, { once: true });
          audioRef.current.addEventListener('canplaythrough', canPlayHandler, { once: true });
          
          // Para Auto DJ, também tentar tocar imediatamente se já estiver pronto
          if (isAutoDJTransition && audioRef.current.readyState >= minReadyState) {
            // Se já está pronto, tentar tocar imediatamente
            setTimeout(() => canPlayHandler(), 10);
          }
          
          audioRef.current.addEventListener('loadeddata', () => {
            // Se canplay não disparou, tentar quando loadeddata disparar
            if (audioRef.current && audioRef.current.src === finalUrl && audioRef.current.paused) {
              setTimeout(canPlayHandler, 50);
            }
          }, { once: true });
          
          // Fallback: tentar tocar mesmo se canplay não disparar
          setTimeout(() => {
            // Usar finalUrl em vez de track.url pois pode ter sido atualizado
            if (audioRef.current && audioRef.current.src === finalUrl) {
              // Verificar se já está tocando
              if (audioRef.current.paused) {
                // Garantir que o volume está configurado antes de tocar
                audioRef.current.volume = channels.music / 100;
                // Resetar tempo quando começar nova música
                setCurrentTime(0);
                
                audioRef.current.play().then(() => {
                  setIsPlaying(true);
                  setPlayHistory(prev => [...prev.slice(-49), trackId]);
                  
                  // Aguardar um pouco para a duração estar disponível
                  const checkDurationFallback = () => {
                    if (audioRef.current) {
                      const dur = audioRef.current.duration;
                      if (!isNaN(dur) && dur > 0 && dur !== Infinity) {
                        setDuration(dur);
                        console.log('✅ Duração definida (fallback):', dur, 'segundos');
                      } else {
                        setTimeout(checkDurationFallback, 100);
                      }
                    }
                  };
                  
                  checkDurationFallback();
                  setTimeout(checkDurationFallback, 200);
                  setTimeout(checkDurationFallback, 500);
                  
                  // Garantir que o tempo atual seja atualizado
                  if (audioRef.current && audioRef.current.currentTime !== undefined) {
                    setCurrentTime(audioRef.current.currentTime || 0);
                  }
                  
                  console.log('✅ Tocando (fallback):', track.name, 'Volume:', audioRef.current.volume);
                  console.log('📊 Estado inicial (fallback) - Duração:', audioRef.current.duration, 'Tempo atual:', audioRef.current.currentTime);
                  isTransitioningRef.current = false;
                }).catch(err => {
                  console.error('❌ Erro ao tocar (fallback):', err);
                  console.error('URL da música:', track.url);
                  
                  // Se for NotSupportedError e temos o arquivo original, tentar recriar blob URL
                  if (err.name === 'NotSupportedError' && track.file && track.url.startsWith('blob:')) {
                    console.warn('⚠️ Blob URL pode ter expirado, tentando recriar...');
                    
                    try {
                      // Revogar URL antiga
                      try {
                        URL.revokeObjectURL(track.url);
                      } catch (e) {
                        // Ignorar
                      }
                      
                      // Criar nova blob URL
                      const newBlobUrl = URL.createObjectURL(track.file);
                      
                      // Atualizar track
                      setTracks(prev => prev.map(t => 
                        t.id === track.id 
                          ? { ...t, url: newBlobUrl }
                          : t
                      ));
                      
                      // Tentar tocar novamente
                      setTimeout(() => {
                        if (audioRef.current && currentTrackId === track.id) {
                          audioRef.current.src = newBlobUrl;
                          audioRef.current.load();
                          audioRef.current.play().then(() => {
                            setIsPlaying(true);
                            setPlayHistory(prev => [...prev.slice(-49), trackId]);
                            isTransitioningRef.current = false;
                            console.log('✅ Música tocando após recriar blob URL');
                          }).catch(retryErr => {
                            console.error('❌ Erro ao tocar após recriar blob URL:', retryErr);
                  setIsPlaying(false);
                  isTransitioningRef.current = false;
                            alert('Erro ao reproduzir a música. O arquivo pode estar corrompido ou em um formato não suportado.');
                          });
                        }
                      }, 100);
                      
                      return; // Não mostrar alert ainda
                    } catch (recreateError) {
                      console.error('❌ Erro ao recriar blob URL:', recreateError);
                    }
                  }
                  
                  // Mostrar erro mais descritivo ao usuário
                  let errorMessage = 'Erro ao reproduzir a música. ';
                  if (err.name === 'NotAllowedError') {
                    errorMessage += 'Por favor, interaja com a página primeiro (clique em algum lugar) e tente novamente.';
                  } else if (err.name === 'NotSupportedError') {
                    errorMessage += 'O formato de áudio pode não ser suportado pelo navegador.';
                  } else {
                    errorMessage += 'Verifique se o arquivo ainda está disponível.';
                  }
                  
                  alert(errorMessage);
                  setIsPlaying(false);
                  isTransitioningRef.current = false;
                });
              } else {
                // Já está tocando
                setIsPlaying(true);
                console.log('✅ Música já está tocando:', track.name);
              }
            }
          }, 500);
        } catch (e) {
          console.error('❌ Erro ao configurar áudio:', e);
          console.error('Track:', track);
          console.error('finalUrl:', finalUrl);
          
          // Se o erro for relacionado ao arquivo, tentar recriar blob URL
          if (track && track.file && track.url.startsWith('blob:')) {
            try {
              const newBlobUrl = URL.createObjectURL(track.file);
              setTracks(prev => prev.map(t => 
                t.id === track.id 
                  ? { ...t, url: newBlobUrl }
                  : t
              ));
              
              // Tentar novamente após um delay
              setTimeout(() => {
                if (currentTrackId === track.id) {
                  console.log('🔄 Tentando novamente após recriar blob URL...');
                  playTrack(track.id, false);
                }
              }, 500);
              return;
            } catch (retryError) {
              console.error('❌ Erro ao tentar recriar blob URL:', retryError);
            }
          }
          
          const trackName = track?.name || 'a música';
          alert(`Erro ao configurar ${trackName}. Por favor, remova e adicione novamente.`);
          setIsPlaying(false);
          isTransitioningRef.current = false;
        }
      };
      
      // Aguardar um pouco para garantir que o pause foi processado (se houver áudio anterior)
      setTimeout(attemptPlay, 50);
    }
  }, [currentTrackId, isPlaying, tracks, crossfadeDuration, handleTrackEnded, playBoasVindas, channels.music]);

  // Atualizar ref de playTrack
  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);

  const playTrackManual = (trackId) => {
    console.log('🎵 playTrackManual chamado com trackId:', trackId);
    console.log('🎵 audioRef.current existe?', !!audioRef.current);
    console.log('🎵 tracks disponíveis:', tracks.length);
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      console.log('🎵 Track encontrada:', track.name, 'URL:', track.url);
    } else {
      console.error('❌ Track não encontrada com ID:', trackId);
    }
    isManualPlayRef.current = true;
    playTrack(trackId, false);
  };

  // Iniciar Auto DJ automaticamente quando ativado
  useEffect(() => {
    if (autoDJ && tracks.length > 0 && !currentTrackId && !isPlaying) {
      console.log('Auto DJ ativado, iniciando primeira música...');
      const next = getNextTrack();
      if (next) {
        setTimeout(() => {
          isManualPlayRef.current = false;
          playTrack(next.id, false);
        }, 500);
      }
    }
  }, [autoDJ, tracks.length, currentTrackId, isPlaying, getNextTrack, playTrack]);

  // Próxima música (manual)
  const playNextTrack = useCallback(() => {
    console.log('⏭️ playNextTrack chamado');
    const next = getNextTrack();
    if (next) {
      console.log('✅ Próxima música encontrada:', next.name || next.title);
      isManualPlayRef.current = true;
      playTrack(next.id, isPlaying && crossfadeDuration > 0);
    } else {
      console.warn('⚠️ Nenhuma próxima música encontrada');
    }
  }, [getNextTrack, isPlaying, crossfadeDuration, playTrack]);

  // Música anterior
  const playPreviousTrack = useCallback(() => {
    console.log('⏮️ playPreviousTrack chamado, histórico:', playHistory.length);
    if (playHistory.length > 1) {
      const previousId = playHistory[playHistory.length - 2];
      console.log('✅ Música anterior encontrada:', previousId);
      isManualPlayRef.current = true;
      playTrack(previousId, isPlaying && crossfadeDuration > 0);
    } else {
      console.warn('⚠️ Não há música anterior no histórico');
    }
  }, [playHistory, isPlaying, crossfadeDuration, playTrack]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current) {
      console.warn('⚠️ audioRef não está disponível');
      return;
    }
    
    // Se não há música selecionada, selecionar a primeira disponível
    if (!currentTrackId) {
      const next = getNextTrack();
      if (next) {
        isManualPlayRef.current = true;
        playTrack(next.id, false);
        return;
      } else {
        console.warn('⚠️ Nenhuma música disponível para tocar');
        return;
      }
    }
    
      if (isPlaying) {
      // Pausar
      try {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log('⏸️ Áudio pausado');
      } catch (err) {
        console.error('❌ Erro ao pausar:', err);
      }
      } else {
      // Reproduzir
      try {
        // Verificar se há src válido
        if (!audioRef.current.src || audioRef.current.src === '' || audioRef.current.src === window.location.href) {
          console.warn('⚠️ Não há música carregada, tentando carregar novamente...');
          // Tentar recarregar a música atual
          const track = tracks.find(t => t.id === currentTrackId);
          if (track) {
            isManualPlayRef.current = true;
            playTrack(currentTrackId, false);
            return;
          } else {
            console.error('❌ Track não encontrada:', currentTrackId);
            return;
          }
        }
        
        // Verificar se o áudio está pronto
        if (audioRef.current.readyState < 2) {
          console.log('⏳ Aguardando áudio estar pronto...');
          audioRef.current.addEventListener('canplay', () => {
            audioRef.current.play().then(() => {
              setIsPlaying(true);
              console.log('▶️ Áudio iniciado após canplay');
            }).catch(err => {
              console.error('❌ Erro ao tocar após canplay:', err);
            });
          }, { once: true });
          return;
        }
        
        // Tocar normalmente
          await audioRef.current.play();
          setIsPlaying(true);
        console.log('▶️ Áudio iniciado');
        } catch (err) {
        console.error('❌ Erro ao tocar:', err);
        // Se der erro, tentar recarregar
        const track = tracks.find(t => t.id === currentTrackId);
        if (track) {
          console.log('🔄 Tentando recarregar a música...');
          isManualPlayRef.current = true;
          playTrack(currentTrackId, false);
        }
      }
    }
  }, [currentTrackId, isPlaying, tracks, getNextTrack, playTrack]);

  const handleAddMusic = (e) => {
    console.log('🎵 handleAddMusic chamado');
    console.log('📦 Tipo do parâmetro:', typeof e);
    console.log('📦 Estrutura:', {
      hasTarget: !!e?.target,
      hasFiles: !!e?.files,
      isArray: Array.isArray(e),
      targetFiles: e?.target?.files ? (Array.isArray(e.target.files) ? `Array[${e.target.files.length}]` : `FileList[${e.target.files.length}]`) : 'undefined',
      directFiles: e?.files ? (Array.isArray(e.files) ? `Array[${e.files.length}]` : `FileList[${e.files.length}]`) : 'undefined'
    });
    
    // Suporta tanto evento { target: { files } } quanto FileList direto ou array
    let files = null;
    
    if (e?.target?.files) {
      files = e.target.files;
      console.log('✅ Usando e.target.files');
    } else if (e?.files) {
      files = e.files;
      console.log('✅ Usando e.files');
    } else if (Array.isArray(e)) {
      files = e;
      console.log('✅ Usando array direto');
    } else {
      console.warn('⚠️ Nenhum formato de arquivo reconhecido');
      return;
    }
    
    // Converter para array se for FileList
    const fileList = Array.isArray(files) ? files : Array.from(files);
    
    console.log('📁 Total de arquivos recebidos:', fileList.length);
    
    if (fileList.length === 0) {
      console.warn('⚠️ Nenhum arquivo recebido');
      return;
    }
    
    // Validar e filtrar arquivos de áudio
    const audioFiles = fileList.filter(file => {
      if (!file) {
        console.warn('Arquivo nulo encontrado');
        return false;
      }
      
      if (!file.name) {
        console.warn('Arquivo sem nome:', file);
        return false;
      }
      
      if (!(file instanceof File) && !(file instanceof Blob)) {
        console.warn('Arquivo não é File ou Blob:', file);
        return false;
      }
      
      const ext = file.name.toLowerCase().split('.').pop();
      const isValid = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'].includes(ext);
      
      if (!isValid) {
        console.log('Arquivo ignorado (extensão não suportada):', file.name);
      }
      
      return isValid;
    });

    console.log('🎵 Arquivos de áudio válidos:', audioFiles.length, 'de', fileList.length);

    if (audioFiles.length === 0) {
      console.warn('⚠️ Nenhum arquivo de áudio válido encontrado');
      alert('Nenhum arquivo de áudio válido encontrado. Formatos suportados: MP3, WAV, OGG, FLAC, M4A, AAC, WMA, OPUS');
      return;
    }

    // Processar arquivos usando FileReader para criar data URLs (mais estáveis que blob URLs)
    console.log('📦 Processando', audioFiles.length, 'arquivo(s) com FileReader...');
    
    if (audioFiles.length === 0) {
      console.warn('⚠️ Nenhum arquivo para processar');
      return;
    }
    
    const processedTracks = [];
    let processedCount = 0;
    let errorCount = 0;
    
    // Função para finalizar e adicionar as tracks processadas
    const finalizeProcessing = () => {
      if (processedCount === audioFiles.length) {
        console.log('✅ Processamento concluído:', processedTracks.length, 'tracks válidas de', audioFiles.length, 'arquivos');
        if (errorCount > 0) {
          console.warn('⚠️ Erros ao processar:', errorCount, 'arquivo(s)');
        }
        
        if (processedTracks.length === 0) {
      console.error('❌ Nenhuma track foi criada com sucesso');
          alert('Erro ao processar os arquivos. Nenhuma música pôde ser adicionada.\n\nVerifique o console para mais detalhes.');
      return;
    }
    
        console.log('📊 Total anterior:', tracks.length);
    setTracks(prev => {
          // Criar um Map de tracks existentes baseado em nome + tamanho para detectar duplicatas reais
          const existingTracksMap = new Map();
          prev.forEach(track => {
            const fileKey = track.file 
              ? `${track.name}_${track.file.size}_${track.file.lastModified || 0}`
              : `${track.name}_${track.url || 'no-url'}`;
            if (!existingTracksMap.has(fileKey)) {
              existingTracksMap.set(fileKey, track);
            }
          });
          
          // Limpar duplicatas do estado anterior
          const prevUnique = [];
          const prevIds = new Set();
          const prevFiles = new Set();
          prev.forEach(track => {
            const fileKey = track.file 
              ? `${track.name}_${track.file.size}_${track.file.lastModified || 0}`
              : `${track.name}_${track.url || 'no-url'}`;
            
            // Verificar duplicata por ID
            if (prevIds.has(track.id)) {
              return;
            }
            
            // Verificar duplicata por nome + tamanho
            if (prevFiles.has(fileKey)) {
              return;
            }
            
            prevIds.add(track.id);
            prevFiles.add(fileKey);
            prevUnique.push(track);
          });
          
          // Processar novas tracks e filtrar duplicatas
          const existingIds = new Set(prevUnique.map(t => t.id));
          const seenIds = new Set();
          const seenFiles = new Set();
          const uniqueNewTracks = [];
          let duplicatesSkipped = 0;
          
          processedTracks.forEach((track, trackIndex) => {
            // Criar chave única baseada em nome + tamanho + lastModified
            const fileKey = track.file 
              ? `${track.name}_${track.file.size}_${track.file.lastModified || 0}`
              : `${track.name}_${track.url || 'no-url'}`;
            
            // Verificar se já existe uma track com mesmo nome e tamanho
            if (existingTracksMap.has(fileKey)) {
              duplicatesSkipped++;
              return; // Pular esta track
            }
            
            // Verificar se já vimos esta track no lote atual
            if (seenFiles.has(fileKey)) {
              duplicatesSkipped++;
              return; // Pular esta track
            }
            
            // Verificar e garantir ID único
            let finalId = track.id;
            let attempts = 0;
            const maxAttempts = 20;
            
            while ((existingIds.has(finalId) || seenIds.has(finalId)) && attempts < maxAttempts) {
              finalId = generateUniqueTrackId();
              attempts++;
            }
            
            if (attempts >= maxAttempts) {
              console.error('❌ Não foi possível gerar ID único após', maxAttempts, 'tentativas para:', track.name);
              finalId = generateUniqueTrackId();
            }
            
            track.id = finalId;
            seenIds.add(finalId);
            seenFiles.add(fileKey);
            existingIds.add(finalId);
            uniqueNewTracks.push(track);
          });
          
          const updated = [...prevUnique, ...uniqueNewTracks];
          console.log('✅ Total de músicas agora:', updated.length, '(antes:', prev.length, ', novas:', uniqueNewTracks.length, ')');
    console.log('🎉 Músicas adicionadas com sucesso!');
          return updated;
        });
        
        if (errorCount > 0 && processedTracks.length < audioFiles.length) {
          alert(`${processedTracks.length} de ${audioFiles.length} música(s) foram adicionadas com sucesso.\n\n${errorCount} arquivo(s) não puderam ser processados.`);
        }
      }
    };
    
    // Usar blob URLs para todos os arquivos - mais rápido e eficiente
    // Manter referência ao arquivo original para recriar blob URL se necessário
    // Contador global para garantir IDs únicos
    let idCounter = 0;
    const usedIdsInBatch = new Set(); // Rastrear IDs já usados no lote atual
    
    audioFiles.forEach((file, index) => {
      if (!file || !(file instanceof File)) {
        console.warn('⚠️ Arquivo inválido no índice', index, ':', file);
        processedCount++;
        errorCount++;
        finalizeProcessing();
        return;
      }
      
      idCounter++;
      
      // Gerar ID único garantindo que não haja duplicatas
      // Usar múltiplos fatores para garantir unicidade absoluta
      const timestamp = Date.now();
      const performanceNow = performance.now();
      const randomStr1 = Math.random().toString(36).substr(2, 12);
      const randomStr2 = Math.random().toString(36).substr(2, 12);
      const randomStr3 = Math.random().toString(36).substr(2, 12);
      const fileSignature = `${file.name}_${file.size}_${file.lastModified || 0}`;
      
      // Criar hash simples do nome do arquivo
      let hash = 0;
      for (let i = 0; i < fileSignature.length; i++) {
        const char = fileSignature.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      // Gerar ID usando função helper para garantir unicidade absoluta
      let trackId = generateUniqueTrackId();
      
      // Garantir que o ID seja único dentro do lote atual
      while (usedIdsInBatch.has(trackId)) {
        trackId = generateUniqueTrackId();
      }
      usedIdsInBatch.add(trackId);
      
      try {
        // Criar blob URL diretamente - mais rápido que FileReader
        const blobUrl = URL.createObjectURL(file);
        
        const newTrack = {
          id: trackId,
          name: file.name,
          file: file, // Manter referência ao arquivo original para recriar blob URL se expirar
          url: blobUrl, // Usar blob URL
          playlistIds: []
        };
        
        processedTracks.push(newTrack);
        processedCount++;
        
        // Processar em lotes para não bloquear a UI
        if (processedCount % 10 === 0) {
          console.log(`✅ Processado ${processedCount}/${audioFiles.length} arquivos...`);
        }
        
        // Se todos foram processados, finalizar imediatamente
        if (processedCount === audioFiles.length) {
          finalizeProcessing();
        }
      } catch (error) {
        processedCount++;
        errorCount++;
        console.error('❌ Erro ao criar blob URL para:', file.name, error);
        
        if (processedCount === audioFiles.length) {
          finalizeProcessing();
        }
      }
    });
    
    console.log('🔄 Iniciado processamento de', audioFiles.length, 'arquivo(s)...');
    
    // Se todos os arquivos foram processados síncronamente (raro, mas possível)
    if (processedCount === audioFiles.length) {
      finalizeProcessing();
    }
  };

  const handleCreatePlaylist = (name) => {
    setPlaylists([...playlists, { id: Math.random().toString(36).substr(2, 9), name, trackIds: [] }]);
  };

  // Sistema antigo de streamer de URL removido - substituído por streaming direto via Socket.IO

  // Função auxiliar para garantir que o MediaElementSource seja criado
  const ensureMediaElementSource = useCallback(() => {
    // Se já existe, retornar
    if (mediaSourceRef.current) {
      return true;
    }

    // Se já tentamos criar e falhou, não tentar novamente
    if (mediaSourceCreationAttemptedRef.current) {
      return false;
    }

    // Verificar se temos os requisitos
    if (!audioRef.current) {
      console.warn('⚠️ audioRef não está disponível para criar MediaElementSource');
      return false;
    }

    // Verificar se o elemento de áudio tem um src (mesmo que vazio, precisa estar pronto)
    if (!audioRef.current.src && !audioRef.current.srcObject) {
      console.warn('⚠️ Elemento de áudio não tem src definido ainda');
      return false;
    }

    try {
      // Criar AudioContext se não existir
      if (!audioContextRefForSpectrum.current || audioContextRefForSpectrum.current.state === 'closed') {
        audioContextRefForSpectrum.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRefForSpectrum.current;
      
      // Retomar AudioContext se estiver suspenso
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      // Criar Analyser se não existir
      if (!analyserRef.current) {
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 64;
        analyserRef.current.smoothingTimeConstant = 0.8;
      }

      // Marcar que vamos tentar criar
      mediaSourceCreationAttemptedRef.current = true;

      // Criar MediaElementSource
      if (!audioRef.current.srcObject) {
        const source = audioContext.createMediaElementSource(audioRef.current);
        mediaSourceRef.current = source;
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);
        console.log('✅ MediaElementSource criado e conectado');
            return true;
          }
        } catch (error) {
      console.warn('⚠️ Erro ao criar MediaElementSource:', error.message);
          return false;
        }

        return false;
  }, []);

  // Função para iniciar streaming direto via Socket.IO
  const startDirectStreaming = useCallback(async () => {
    if (!socketRef.current?.connected) {
      alert('Erro: Não conectado ao servidor. Verifique se o backend está rodando.');
        return false;
      }
      
    try {
      // IMPORTANTE: Usar o mesmo AudioContext do spectrum para evitar erros de conexão
      if (!audioContextRefForSpectrum.current || audioContextRefForSpectrum.current.state === 'closed') {
        audioContextRefForSpectrum.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      const audioContext = audioContextRefForSpectrum.current;
      streamingAudioContextRef.current = audioContext;
      
      // Retomar AudioContext se estiver suspenso
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      // Tentar criar o MediaElementSource se ainda não existe
      if (!mediaSourceRef.current && audioRef.current) {
        console.log('ℹ️ Tentando criar MediaElementSource antes de iniciar streaming...');
        ensureMediaElementSource();
      }
      
      // Criar destination para capturar o áudio misturado
      const destination = audioContext.createMediaStreamDestination();
      streamingDestinationRef.current = destination;
      const stream = destination.stream;

      // Conectar o áudio do player ao destination
      if (mediaSourceRef.current) {
        try {
          if (!broadcastGainNodeRef.current) {
            broadcastGainNodeRef.current = audioContext.createGain();
          }
          broadcastGainNodeRef.current.gain.value = channels.master / 100;
          
          try {
            broadcastGainNodeRef.current.connect(destination);
            mediaSourceRef.current.connect(broadcastGainNodeRef.current);
            console.log('✅ Áudio do player conectado ao stream');
          } catch (connectError) {
            if (connectError.message && connectError.message.includes('already connected')) {
              console.log('ℹ️ Conexões já estabelecidas');
            } else {
              try {
                broadcastGainNodeRef.current.disconnect();
                broadcastGainNodeRef.current.connect(destination);
                mediaSourceRef.current.connect(broadcastGainNodeRef.current);
                console.log('✅ Reconectado com sucesso');
              } catch (reconnectError) {
                console.warn('⚠️ Erro ao reconectar:', reconnectError.message);
              }
            }
          }
        } catch (error) {
          console.error('❌ Erro ao configurar conexão do player:', error);
        }
      }

      // Conectar microfone se disponível
      if (micStreamRef.current) {
        const micSource = audioContext.createMediaStreamSource(micStreamRef.current);
        const micGain = audioContext.createGain();
        micGain.gain.value = channels.mic / 100;
        micSource.connect(micGain);
        micGain.connect(destination);
      }

      // Criar MediaRecorder para capturar o áudio
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/ogg') 
        ? 'audio/ogg' 
        : 'audio/webm';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      streamingMediaRecorderRef.current = mediaRecorder;

      // Enviar chunks de áudio via Socket.IO
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socketRef.current?.connected) {
          try {
            // Converter blob para base64 para enviar via Socket.IO
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result.split(',')[1]; // Remover prefixo data:audio/...
              socketRef.current.emit('audio:chunk', {
                data: base64data,
                mimeType: mimeType,
                timestamp: Date.now()
              });
            };
            reader.onerror = (error) => {
              console.error('❌ Erro ao ler chunk de áudio:', error);
            };
            reader.readAsDataURL(event.data);
          } catch (error) {
            console.error('❌ Erro ao processar chunk de áudio:', error);
          }
        }
      };

      // Iniciar gravação em chunks (250ms para menor latência)
      mediaRecorder.start(250);
      
      setIsStreaming(true);
      console.log('✅ Streaming direto iniciado via Socket.IO');
      
      // Notificar backend que estamos transmitindo com o nome do DJ
      socketRef.current.emit('broadcaster', {
        broadcasterId: socketRef.current.id,
        streaming: true,
        directStream: true,
        djName: user?.username || 'DJ'
      });
      
      return true;
          } catch (error) {
      console.error('❌ Erro ao iniciar streaming direto:', error);
      alert('Erro ao iniciar streaming: ' + error.message);
      return false;
    }
  }, [channels, ensureMediaElementSource]);

  // Função para parar streaming direto
  const stopDirectStreaming = useCallback(() => {
    if (streamingMediaRecorderRef.current && streamingMediaRecorderRef.current.state !== 'inactive') {
      streamingMediaRecorderRef.current.stop();
      streamingMediaRecorderRef.current = null;
    }

    // Notificar backend que paramos de transmitir
    if (socketRef.current?.connected) {
      socketRef.current.emit('broadcaster_left');
    }

    // Desconectar áudio
    if (broadcastGainNodeRef.current) {
      try {
        broadcastGainNodeRef.current.disconnect();
          } catch (e) {
            // Ignorar erro
          }
    }

    streamingDestinationRef.current = null;
    setIsStreaming(false);
    console.log('🛑 Streaming direto parado');
  }, []);

  // Sistema de streaming direto via Socket.IO
  useEffect(() => {
    if (isBroadcasting) {
      // Iniciar streaming direto
      startDirectStreaming().then((success) => {
        if (success && socketRef.current?.connected) {
          // Notificar ouvintes que estamos transmitindo com o nome da rádio
          socketRef.current.emit('broadcaster', {
            broadcasterId: socketRef.current.id,
            streaming: true,
            directStream: true,
            radioName: radioName
          });
          console.log('📡 Streaming direto iniciado - ouvintes serão notificados');
        }
      });
    } else {
      // Parar streaming
      stopDirectStreaming();
      
      // Notificar ouvintes que a transmissão parou
      if (socketRef.current?.connected) {
        socketRef.current.emit('broadcaster_left');
      }
    }

    return () => {
      stopDirectStreaming();
    };
  }, [isBroadcasting, startDirectStreaming, stopDirectStreaming, radioName]);

  // Sistema antigo WebRTC - REMOVIDO
  // Todo o código WebRTC foi removido e substituído por streaming direto via Socket.IO

  // Enviar nome da rádio atualizado para os ouvintes quando mudar
  useEffect(() => {
    if (socketRef.current?.connected && radioName) {
      socketRef.current.emit('broadcaster', {
        broadcasterId: socketRef.current.id,
        streaming: isBroadcasting,
        directStream: isBroadcasting,
        radioName: radioName
      });
      console.log('📡 Nome da rádio enviado para ouvintes:', radioName);
    }
  }, [radioName, isBroadcasting]);

  // Enviar nome da música atual para os ouvintes
  useEffect(() => {
    if (socketRef.current && currentTrackId && isBroadcasting) {
      const track = tracks.find(t => t.id === currentTrackId);
      if (track) {
        socketRef.current.emit('trackUpdate', {
          trackName: track.name,
          artist: 'DJ no Ar'
        });
      }
    }
  }, [currentTrackId, isBroadcasting, tracks]);

  // Garantir que o evento onEnded está sempre configurado e volume inicial está configurado
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      // Configurar volume inicial baseado no playerVolume
      audio.volume = playerVolume / 100;
      audio.addEventListener('ended', handleTrackEnded);
      
      // Adicionar tratamento de erro para URLs inválidas
      const errorHandler = (e) => {
        console.error('❌ Erro no elemento de áudio:', e);
        if (audio.error) {
          console.error('Código de erro:', audio.error.code);
          console.error('Mensagem:', audio.error.message);
          
          // Verificar se é erro de formato ou arquivo inválido (incluindo ERR_REQUEST_RANGE_NOT_SATISFIABLE)
          const errorMessage = audio.error.message || '';
          const isRangeError = errorMessage.includes('ERR_REQUEST_RANGE_NOT_SATISFIABLE') || 
                               errorMessage.toLowerCase().includes('range') ||
                               errorMessage.toLowerCase().includes('request range');
          const isFormatError = audio.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
                                errorMessage.includes('Format error') ||
                                isRangeError;
          
          // Se o erro for por formato não suportado, ERR_REQUEST_RANGE_NOT_SATISFIABLE, ou arquivo corrompido
          if (isFormatError || isRangeError || audio.error.code === MediaError.MEDIA_ERR_NETWORK || audio.error.code === MediaError.MEDIA_ERR_DECODE) {
            const currentSrc = audio.src;
            const currentTrack = tracks.find(t => t.url === currentSrc);
            
            if (currentTrack && currentTrack.id === currentTrackId) {
              // Se for erro de blob URL expirada ou ERR_REQUEST_RANGE_NOT_SATISFIABLE, tentar recriar
              if ((isFormatError || isRangeError) && currentTrack.file && currentSrc.startsWith('blob:')) {
                console.warn('⚠️ Blob URL com problema (ERR_REQUEST_RANGE_NOT_SATISFIABLE ou expirada), recriando...', currentTrack.name);
                
                try {
                  // Revogar a URL antiga
                  try {
                    URL.revokeObjectURL(currentSrc);
                  } catch (e) {
                    // Ignorar erro ao revogar
                  }
                  
                  // Criar nova blob URL
                  const newBlobUrl = URL.createObjectURL(currentTrack.file);
                  
                  // Atualizar a track com a nova URL
                  setTracks(prev => prev.map(t => 
                    t.id === currentTrack.id 
                      ? { ...t, url: newBlobUrl }
                      : t
                  ));
                  
                  // Tentar tocar novamente com a nova URL após um delay para garantir que o blob está pronto
                  setTimeout(() => {
                    if (audioRef.current && currentTrackId === currentTrack.id) {
                      try {
                        audioRef.current.src = newBlobUrl;
                        audioRef.current.load();
                        
                        // Aguardar um pouco mais antes de tocar para evitar range requests
                        setTimeout(() => {
                          if (audioRef.current && audioRef.current.src === newBlobUrl) {
                            // Garantir volume antes de tocar
                            audioRef.current.volume = playerVolume / 100;
                            // Garantir que onEnded está configurado
                            audioRef.current.addEventListener('ended', handleTrackEnded);
                            
                            audioRef.current.play().then(() => {
                              setIsPlaying(true);
                              setPlayHistory(prev => [...prev.slice(-49), currentTrackId]);
                              console.log('✅ Música tocando após recriar blob URL devido a ERR_REQUEST_RANGE_NOT_SATISFIABLE');
                              
                              // Aguardar para obter duração
                              const checkDurationAfterRecovery = () => {
                                if (audioRef.current) {
                                  const dur = audioRef.current.duration;
                                  if (!isNaN(dur) && dur > 0 && dur !== Infinity) {
                                    setDuration(dur);
                                    console.log('✅ Duração definida após recuperação:', dur);
                                  } else if (audioRef.current.readyState >= 2) {
                                    setTimeout(checkDurationAfterRecovery, 100);
                                  }
                                }
                              };
                              checkDurationAfterRecovery();
                              setTimeout(checkDurationAfterRecovery, 200);
                              setTimeout(checkDurationAfterRecovery, 500);
                            }).catch(err => {
                              console.error('❌ Erro ao tocar após recriar blob URL:', err);
                              console.error('Erro detalhado:', {
                                name: err.name,
                                message: err.message,
                                readyState: audioRef.current?.readyState,
                                networkState: audioRef.current?.networkState,
                                error: audioRef.current?.error
                              });
                              
                              // Se ainda falhar, tentar mais uma vez após um delay maior
                              if (err.name === 'NotSupportedError' || err.name === 'NotAllowedError') {
                                console.log('🔄 Tentando mais uma vez após delay maior...');
                                setTimeout(() => {
                                  if (audioRef.current && audioRef.current.src === newBlobUrl && currentTrackId === currentTrack?.id) {
                                    audioRef.current.load();
                                    audioRef.current.play().then(() => {
                                      setIsPlaying(true);
                                      console.log('✅ Música tocando após segunda tentativa');
                                    }).catch(finalErr => {
                                      console.error('❌ Falha final ao tocar:', finalErr);
                                      setIsPlaying(false);
                                      alert(`Não foi possível reproduzir a música "${currentTrack?.name}". O arquivo pode estar corrompido ou em formato não suportado.`);
                                    });
                                  }
                                }, 1000);
                              } else {
                                setIsPlaying(false);
                                const trackName = currentTrack?.name || 'a música';
                                alert(`Erro ao reproduzir ${trackName}. Tente novamente ou remova e adicione a música novamente.`);
                              }
                            });
                          }
                        }, 300);
                      } catch (e) {
                        console.error('❌ Erro ao configurar nova URL:', e);
                        setIsPlaying(false);
                      }
                    }
                  }, 100);
                  
                  // Não reportar erro ainda - aguardar resultado da tentativa
                  return;
                } catch (recreateError) {
                  console.error('❌ Erro ao recriar blob URL:', recreateError);
                  // Continuar para reportar erro ao usuário
                }
              }
              
              // Verificar se já reportamos erro para esta música (evitar múltiplos alerts)
              if (!errorReportedTracksRef.current.has(currentTrack.id)) {
                errorReportedTracksRef.current.add(currentTrack.id);
                
                console.error('❌ Erro ao carregar música:', currentTrack.name);
                console.error('❌ Tipo de erro:', audio.error.code, audio.error.message);
                
                // Mostrar mensagem mais clara ao usuário (apenas uma vez)
                alert(`Erro ao carregar a música "${currentTrack.name}".\n\nO arquivo pode estar corrompido ou em um formato não suportado pelo navegador.\n\nPor favor, remova esta música e adicione novamente, ou tente com outro arquivo.`);
                
                // Limpar a flag após 5 segundos para permitir novo reporte se necessário
                setTimeout(() => {
                  errorReportedTracksRef.current.delete(currentTrack.id);
                }, 5000);
              }
            } else {
              alert('Erro ao carregar a música. A URL pode estar inválida ou o arquivo foi movido. Por favor, remova e adicione a música novamente.');
            }
          }
        }
        setIsPlaying(false);
      };
      
      audio.addEventListener('error', errorHandler);
      console.log('✅ Elemento audio inicializado e evento onEnded configurado. Volume:', audio.volume);
      
      return () => {
        audio.removeEventListener('ended', handleTrackEnded);
        audio.removeEventListener('error', errorHandler);
      };
    } else {
      console.warn('⚠️ audioRef.current não está disponível ainda');
    }
  }, [handleTrackEnded, currentTrackId, playerVolume, tracks]);
  
  // Sincronizar volume do player com o audioRef
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = playerVolume / 100;
    }
  }, [playerVolume]);
  
  // Atualizar volume dos jingles quando o fader FX mudar
  useEffect(() => {
    Object.values(jingleAudioRefs.current).forEach(audio => {
      if (audio && audio instanceof HTMLAudioElement) {
        audio.volume = channels.fx / 100;
      }
    });
  }, [channels.fx]);
  
  // Sincronizar estado de playing dos jingles
  const [playingJingles, setPlayingJingles] = useState({});
  
  useEffect(() => {
    const checkPlaying = () => {
      const playing = {};
      Object.keys(jingleAudioRefs.current).forEach(id => {
        const audio = jingleAudioRefs.current[id];
        if (audio && audio instanceof HTMLAudioElement) {
          playing[id] = !audio.paused;
        }
      });
      setPlayingJingles(playing);
    };
    
    const interval = setInterval(checkPlaying, 100);
    return () => clearInterval(interval);
  }, [jingles]);
  
  // Função para salvar jingle (igual ao sistema do MixerConsole - usando DataURL)
  const handleSaveJingle = useCallback(() => {
    if (!editingJingle || !editingJingleName.trim() || !editingJingleFile) {
      if (!editingJingleName.trim()) {
        alert('Por favor, informe um nome para o jingle.');
      }
      if (!editingJingleFile) {
        alert('Por favor, selecione um arquivo de áudio.');
      }
      return;
    }
    
    // Ler arquivo como DataURL (base64) para salvar no localStorage - igual ao MixerConsole
    const reader = new FileReader();
    reader.onloadend = () => {
      const audioDataUrl = reader.result; // DataURL (base64) - pode ser salvo no localStorage
      
      // Atualizar estado dos jingles
      setJingles(prev => {
        const updated = prev.map(j => 
          j.id === editingJingle 
            ? { 
                ...j, 
                name: editingJingleName.trim(), 
                audioUrl: audioDataUrl, // Usar DataURL diretamente
                audioFile: editingJingleFile 
              }
            : j
        );
        
        // Salvar no localStorage com DataURL (igual ao MixerConsole)
        localStorage.setItem('screenJingles', JSON.stringify(updated.map(j => ({
          id: j.id,
          name: j.name,
          audioUrl: j.audioUrl,
          audioFile: null
        }))));
        
        return updated;
      });
      
      // Limpar áudio anterior se existir
      if (jingleAudioRefs.current[editingJingle]) {
        const oldAudio = jingleAudioRefs.current[editingJingle];
        oldAudio.pause();
        oldAudio.src = '';
        oldAudio.load();
        delete jingleAudioRefs.current[editingJingle];
      }
      
      // Criar novo elemento de áudio usando DataURL
      const audio = new Audio(audioDataUrl);
      audio.volume = channels.fx / 100;
      audio.preload = 'auto';
      
      // Adicionar tratamento de erro
      audio.addEventListener('error', (e) => {
        console.error('Erro ao carregar áudio do jingle:', e);
        alert(`Erro ao carregar o arquivo de áudio "${editingJingleFile.name}". Verifique se o arquivo não está corrompido.`);
      });
      
      // Adicionar evento quando terminar de tocar
      audio.addEventListener('ended', () => {
        setPlayingJingles(prev => ({ ...prev, [editingJingle]: false }));
      });
      
      jingleAudioRefs.current[editingJingle] = audio;
      
      console.log(`✅ Jingle "${editingJingleName.trim()}" adicionado com sucesso!`);
      
      // Fechar modal e limpar estado
      setEditingJingle(null);
      setEditingJingleName('');
      setEditingJingleFile(null);
      
      // Limpar o input file
      if (jingleFileInputRefs.current[editingJingle]) {
        jingleFileInputRefs.current[editingJingle].value = '';
      }
    };
    
    reader.onerror = () => {
      console.error('Erro ao ler arquivo de áudio');
      alert('Erro ao processar o arquivo de áudio. Tente novamente.');
    };
    
    reader.readAsDataURL(editingJingleFile);
  }, [editingJingle, editingJingleName, editingJingleFile, channels.fx]);
  
  // Garantir que a duração e o progresso sejam atualizados quando a música estiver tocando
  useEffect(() => {
    if (!isPlaying || !audioRef.current || !currentTrackId) return;
    
    // Intervalo de fallback para atualizar progresso caso timeupdate não funcione
    const progressInterval = setInterval(() => {
      if (audioRef.current && !isSeekingRef.current && isPlaying) {
        const current = audioRef.current.currentTime;
        const dur = audioRef.current.duration;
        
        // Só atualizar se o valor realmente mudou (evitar loops)
        if (!isNaN(current) && current >= 0) {
          setCurrentTime(prev => {
            // Só atualizar se a diferença for significativa (> 0.1s)
            if (Math.abs(prev - current) > 0.1) {
              return current;
            }
            return prev;
          });
        }
        
        // Só atualizar duration se ainda não foi definida ou mudou significativamente
        if (!isNaN(dur) && dur > 0 && dur !== Infinity) {
          setDuration(prev => {
            // Só atualizar se ainda não foi definida ou mudou significativamente
            if (!prev || Math.abs(prev - dur) > 0.1) {
              return dur;
            }
            return prev;
          });
        }
      }
    }, 250); // Atualizar a cada 250ms como fallback
    
    return () => clearInterval(progressInterval);
  }, [isPlaying, currentTrackId]);

  return (
    <PageContainer>
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            const dur = audioRef.current.duration;
            if (!isNaN(dur) && dur > 0) {
              setDuration(dur);
              console.log('✅ Duração carregada:', dur, 'segundos');
            }
          }
        }}
        onDurationChange={() => {
          if (audioRef.current) {
            const dur = audioRef.current.duration;
            if (!isNaN(dur) && dur > 0) {
              setDuration(dur);
              console.log('✅ Duração alterada:', dur, 'segundos');
            }
          }
        }}
        onCanPlay={() => {
          if (audioRef.current) {
            const dur = audioRef.current.duration;
            if (!isNaN(dur) && dur > 0 && !duration) {
              setDuration(dur);
              console.log('✅ Duração disponível no canplay:', dur, 'segundos');
            }
          }
        }}
        preload="auto"
        crossOrigin="anonymous"
      />

      <TopHeader>
        <BrandArea onClick={() => setShowRadioSettings(true)}>
          <EditIcon className="edit-icon">✏️ Editar</EditIcon>
          {radioBanner && <BannerImage src={radioBanner} alt="Radio Banner" />}
          <LogoText data-text={radioName}>{radioName}</LogoText>
          <SubLogoText>ATENDIMENTO POR IA</SubLogoText>
          <SubLogoText style={{color: '#fbbf24', fontWeight: 'bold'}}>
             DJ: {user?.username || 'Guest'}
          </SubLogoText>
        </BrandArea>

        <OnAirIndicator>
          <OnAirBadge $live={isBroadcasting}>
            {isBroadcasting ? 'ON AIR' : 'OFF AIR'}
          </OnAirBadge>
          <ListenerCount>
            <span>👥</span>
            <ListenerNumber>{listenerCount}</ListenerNumber>
            <span>Ouvintes</span>
          </ListenerCount>
        </OnAirIndicator>

        <CurrentTrackInfo>
          <TrackTitle>{tracks.find(t => t.id === currentTrackId)?.name || 'Nenhuma música selecionada'}</TrackTitle>
          <TrackArtist>DJ: {user?.username || 'Guest'}</TrackArtist>
          
          {/* Controles do Player e Barra de Progresso */}
          <PlayerContainer>
            {/* Controle de Volume */}
            <VolumeControl>
              <div style={{ position: 'relative', width: '4px', height: '36px' }}>
                <VolumeProgressBar $percent={playerVolume} />
                <VolumeSlider
                  type="range"
                  min="0"
                  max="100"
                  value={playerVolume}
                  onChange={(e) => {
                    const newVolume = parseInt(e.target.value);
                    setPlayerVolume(newVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume / 100;
                    }
                    localStorage.setItem('playerVolume', newVolume.toString());
                  }}
                  onMouseDown={(e) => {
                    // Manter o foco no slider durante o arrasto
                    e.target.style.cursor = 'grabbing';
                  }}
                  onMouseUp={(e) => {
                    e.target.style.cursor = 'grab';
                  }}
                  title={`Volume: ${playerVolume}%`}
                  style={{ position: 'relative', zIndex: 2 }}
                />
              </div>
              <VolumeButton 
                onClick={() => {
                  if (playerVolume > 0) {
                    setPlayerVolume(0);
                    if (audioRef.current) {
                      audioRef.current.volume = 0;
                    }
                    localStorage.setItem('playerVolume', '0');
                  } else {
                    const newVolume = 75;
                    setPlayerVolume(newVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume / 100;
                    }
                    localStorage.setItem('playerVolume', newVolume.toString());
                  }
                }}
                title={playerVolume > 0 ? 'Mutar' : 'Desmutar'}
              >
                {playerVolume === 0 ? '🔇' : playerVolume < 50 ? '🔉' : '🔊'}
              </VolumeButton>
            </VolumeControl>
            
            {/* Caixa com Botões de Controle */}
            <ControlsBox>
              <PlayerButton 
                onClick={playPreviousTrack}
                disabled={!currentTrackId || playHistory.length < 2}
                title="Música Anterior"
              >
                ⏮️
              </PlayerButton>
              
              <PlayPauseButton 
                $playing={isPlaying}
                onClick={togglePlay}
                disabled={!currentTrackId}
                title={isPlaying ? 'Pausar' : 'Tocar'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </PlayPauseButton>
              
              <PlayerButton 
                onClick={playNextTrack}
                disabled={!currentTrackId || tracks.length === 0}
                title="Próxima Música"
              >
                ⏭️
              </PlayerButton>
            </ControlsBox>
            
            {/* Barra de Progresso Profissional */}
            <ProgressWrapper>
              <ProfessionalProgressContainer>
                <ProfessionalProgressFill $percent={duration ? (currentTime / duration) * 100 : 0} />
                <ProfessionalProgressSlider
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  step="0.1"
                  onChange={handleProgressChange}
                  onMouseUp={handleProgressMouseUp}
                  onTouchEnd={handleProgressMouseUp}
                  disabled={!duration || !currentTrackId}
                />
              </ProfessionalProgressContainer>
              <TimeDisplay>
                {formatTime(currentTime)} / {formatTime(duration) || '00:00'}
              </TimeDisplay>
            </ProgressWrapper>
          </PlayerContainer>
        </CurrentTrackInfo>


        <HeaderActions data-header-menu>
          <LuminousStatusButton>
            <LuminousStatRow>
              <LuminousStatLabel>Bitrate</LuminousStatLabel>
              <LuminousStatValue>128 kbps</LuminousStatValue>
            </LuminousStatRow>
            <LuminousStatRow>
              <LuminousStatLabel>Uptime</LuminousStatLabel>
              <LuminousStatValue>{formatUptime(uptime)}</LuminousStatValue>
            </LuminousStatRow>
            <LuminousStatRow>
              <LuminousStatLabel>Status</LuminousStatLabel>
              <LuminousStatValue 
                $color={isBroadcasting ? '#10b981' : '#ef4444'}
                $pulse={isBroadcasting}
              >
                {isBroadcasting ? 'LIVE' : 'IDLE'}
              </LuminousStatValue>
            </LuminousStatRow>
            <LuminousStatRow style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <LuminousStatLabel>Conexão WebRTC</LuminousStatLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ConnectionStatusLED 
                  status={isBroadcasting && isSocketConnected ? webrtcConnectionStatus : 'waiting'}
                  size={12}
                  fontSize="0.7rem"
                  showLabel={false}
                  showStatusText={false}
                />
                {activeWebrtcConnections > 0 && (
                  <span style={{ 
                    fontSize: '0.7rem', 
                    color: '#22d3ee',
                    fontWeight: '700'
                  }}>
                    ({activeWebrtcConnections})
                  </span>
                )}
              </div>
            </LuminousStatRow>
          </LuminousStatusButton>
          
          <HeaderMenuButton onClick={() => setShowHeaderMenu(!showHeaderMenu)}>
            <span>☰</span> Menu
          </HeaderMenuButton>
          
          <HeaderMenuDropdown $show={showHeaderMenu} data-header-menu>
            <HeaderMenuItem
              $active={activeTab === 'HOME'}
              onClick={() => {
                setActiveTab('HOME');
                setShowHeaderMenu(false);
              }}
            >
              <span>🏠</span> HOME
            </HeaderMenuItem>
            
            <HeaderMenuItem
              $active={activeTab === 'TELA INTEIRA'}
              onClick={() => {
                setActiveTab('TELA INTEIRA');
                setShowHeaderMenu(false);
              }}
            >
              <span>🖥️</span> TELA INTEIRA
            </HeaderMenuItem>
            
            <div style={{ 
              height: '1px', 
              background: 'rgba(6, 182, 212, 0.3)', 
              margin: '4px 0' 
            }} />
            
            <HeaderMenuItem
              onClick={() => {
                // Streaming direto não requer configuração
                setShowHeaderMenu(false);
              }}
            >
            </HeaderMenuItem>
            
            <HeaderMenuItem
              $active={isBroadcasting}
              onClick={async () => {
                try {
                  // Streaming direto não requer configuração externa

                  // Se está ativando o broadcast, garantir que o AudioContext seja retomado
                  if (!isBroadcasting) {
                    // Garantir que o AudioContext esteja ativo antes de iniciar o broadcast
                    if (audioContextRefForSpectrum.current) {
                      if (audioContextRefForSpectrum.current.state === 'suspended') {
                        await audioContextRefForSpectrum.current.resume();
                      }
                    }
                  }
                setIsBroadcasting(!isBroadcasting);
                setShowHeaderMenu(false);
                } catch (error) {
                  console.error('Erro ao alternar broadcasting:', error);
                  setShowHeaderMenu(false);
                }
              }}
            >
              <span>{isBroadcasting ? '●' : '○'}</span>
              {isBroadcasting ? 'ON AIR' : 'OFF AIR'}
            </HeaderMenuItem>
            
            <HeaderMenuItem
              $danger
              onClick={() => {
                logout();
                setShowHeaderMenu(false);
              }}
            >
              <span>⏻</span> Sair
            </HeaderMenuItem>
          </HeaderMenuDropdown>
        </HeaderActions>
      </TopHeader>

      {/* Conteúdo da Aba HOME */}
      <TabContent $active={activeTab === 'HOME'}>
      <MainGrid>
        <LeftColumn>
          <WebcamPanel />
          <LeftPlaylistPanel 
            playlists={playlists}
            onCreatePlaylist={handleCreatePlaylist}
            onAddMusic={handleAddMusic}
            tracks={tracks}
            currentTrackId={currentTrackId}
            onPlay={playTrackManual}
            onDeepCleanup={performDeepCleanup}
          />
        </LeftColumn>

        <CenterColumn>
           <div style={{marginBottom: '0', width: '100%'}}>
             <MixerConsole 
               tracks={tracks}
               songRequests={songRequests}
               socket={socketRef.current}
               onDownloadAndAddMusic={downloadMusicFromInternet}
               onAddToQueue={(track, requestId) => {
                 // Adicionar à fila de reprodução
                 console.log('🎵 Adicionando música à fila:', track.name || track.title);
                 
                 // Mapear trackId -> requestId para remover pedido quando tocar
                 if (requestId) {
                   trackToRequestMapRef.current.set(track.id, requestId);
                   console.log('📝 Mapeamento criado: trackId', track.id, '-> requestId', requestId);
                 }
                 
                 // Verificar se a música já está na fila
                 setPlayQueue(prev => {
                   const alreadyInQueue = prev.some(t => t.id === track.id);
                   if (alreadyInQueue) {
                     console.log('⚠️ Música já está na fila, ignorando...');
                     return prev;
                   }
                   
                   const newQueue = [...prev, track];
                   console.log(`✅ Música adicionada à fila. Total na fila: ${newQueue.length}`);
                   console.log('📋 Fila atual:', newQueue.map(t => t.name || t.title));
                   return newQueue;
                 });
                 
                 // Se não está tocando e Auto DJ está ativo, iniciar reprodução
                 if (!isPlaying && autoDJ) {
                   console.log('🎶 Iniciando reprodução da fila...');
                   setTimeout(() => {
                     const nextTrack = playQueue.length > 0 ? playQueue[0] : track;
                     if (nextTrack) {
                       playTrack(nextTrack.id, false);
                     }
                   }, 500);
                 }
               }}
               onRejectRequest={(requestId) => {
                 console.log('Rejeitando pedido:', requestId);
                 if (socketRef.current && socketRef.current.connected) {
                   socketRef.current.emit('chat:request:reject', requestId);
                 }
               }}
               onMicStreamChange={(stream) => {
                 micStreamRef.current = stream;
                 
                 // Se estiver transmitindo, adicionar o microfone ao broadcast
                 if (isBroadcasting && broadcastStreamRef.current && stream) {
                   const audioTracks = stream.getAudioTracks();
                   audioTracks.forEach(track => {
                     try {
                       // Adicionar track do microfone ao stream de broadcast
                       if (broadcastStreamRef.current) {
                         broadcastStreamRef.current.addTrack(track);
                         console.log('✅ Track do microfone adicionado ao broadcast:', track.id);
                         
                         // Adicionar track a todas as peer connections existentes
                         Object.values(peerConnectionsRef.current).forEach(pc => {
                           try {
                             pc.addTrack(track, broadcastStreamRef.current);
                             console.log('✅ Track do microfone adicionado à peer connection');
                           } catch (e) {
                             console.warn('⚠️ Erro ao adicionar track do microfone à peer connection:', e);
                           }
                         });
                       }
                     } catch (e) {
                       console.warn('⚠️ Erro ao adicionar track do microfone ao broadcast:', e);
                     }
                   });
                 }
               }}
               micGain={50}
               currentTrackId={currentTrackId}
               isPlaying={isPlaying}
               autoDJ={autoDJ}
               setAutoDJ={setAutoDJ}
               shuffleMode={shuffleMode}
               setShuffleMode={setShuffleMode}
               crossfadeDuration={crossfadeDuration}
               setCrossfadeDuration={setCrossfadeDuration}
               playHistory={playHistory}
               nextTrackPreview={nextTrackPreview}
               isCrossfading={isCrossfading}
               onPlayNext={playNextTrack}
               onPlayPrevious={playPreviousTrack}
               onTogglePlay={togglePlay}
               onPlayTrack={playTrack}
               getNextTrack={getNextTrack}
               musicAudioRef={audioRef}
               audioContext={audioContextRefForSpectrum.current}
               mediaElementSource={mediaSourceRef.current}
               jingleAudioRefs={jingleAudioRefs}
               mediaStreamDestination={broadcastDestinationRef.current}
               onMicActiveChange={(active) => {
                 setMicActive(active);
               }}
               micToggleRef={mixerConsoleMicToggleRef}
               onMascotStartSpeaking={() => {
                 // Callback quando o mascote começar a falar
                 console.log('🤖 Mascote começou a falar - volume da música reduzido');
               }}
               onMascotStopSpeaking={() => {
                 // Callback quando o mascote parar de falar
                 console.log('🤖 Mascote parou de falar - volume da música restaurado');
               }}
             />
           </div>
           
           {/* Jingles abaixo do Digital Mixer - 8 por linha */}
           <div style={{marginTop: '8px', width: '100%'}}>
             <VignettePanel 
               jingles={[]}
               onPlayJingle={handlePlayJingle}
               onAddJingle={() => {}}
               onAddJingleToSlot={handleAddJingleToSlot}
               currentlyPlaying={currentlyPlayingJingle}
               jingleAudios={jingleAudios}
             />
           </div>
           
           {/* Auto DJ abaixo dos Jingles */}
           <div style={{marginTop: '16px', width: '100%'}}>
                 <div style={{
                   padding: '8px',
                   background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.95) 100%)',
                   border: '2px solid rgba(6, 182, 212, 0.3)',
                   borderRadius: '8px',
                   display: 'flex',
                   flexDirection: 'column',
                   gap: '8px',
                   boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(6, 182, 212, 0.2)'
                 }}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                     <div style={{color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                       <span>🎛️</span> AUTO DJ
                     </div>
                     <div style={{
                       display: 'flex',
                       alignItems: 'center',
                       gap: '6px',
                       padding: '2px 6px',
                       borderRadius: '15px',
                       background: autoDJ 
                         ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
                         : 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)',
                       border: `1px solid ${autoDJ ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.3)'}`,
                       fontSize: '0.65rem',
                       fontWeight: 800,
                       textTransform: 'uppercase',
                       letterSpacing: '1px',
                       color: autoDJ ? '#22d3ee' : '#94a3b8'
                     }}>
                       <span>{autoDJ ? '●' : '○'}</span>
                       {autoDJ ? 'ATIVO' : 'INATIVO'}
                     </div>
                   </div>
                   
                   <div style={{display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center'}}>
                     <button
                       onClick={playPreviousTrack}
                       disabled={!currentTrackId || playHistory.length < 2}
                       style={{
                         background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                         border: '2px solid rgba(6, 182, 212, 0.4)',
                         color: '#22d3ee',
                         width: '45px',
                         height: '45px',
                         borderRadius: '10px',
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         fontSize: '1.1rem',
                         transition: 'all 0.3s ease',
                         boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                         opacity: (!currentTrackId || playHistory.length < 2) ? 0.4 : 1
                       }}
                       title="Música Anterior"
                     >
                       ⏮️
                     </button>
                     <button
                       onClick={togglePlay}
                       disabled={!currentTrackId}
                       style={{
                         background: isPlaying 
                           ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
                           : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                         border: `2px solid ${isPlaying ? '#22d3ee' : 'rgba(6, 182, 212, 0.4)'}`,
                         color: '#22d3ee',
                         width: '45px',
                         height: '45px',
                         borderRadius: '10px',
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         fontSize: '1.1rem',
                         transition: 'all 0.3s ease',
                         boxShadow: isPlaying 
                           ? '0 0 25px rgba(6, 182, 212, 0.6), 0 4px 15px rgba(0, 0, 0, 0.3)'
                           : '0 4px 15px rgba(0, 0, 0, 0.3)',
                         opacity: !currentTrackId ? 0.4 : 1
                       }}
                       title={isPlaying ? 'Pausar' : 'Tocar'}
                     >
                       {isPlaying ? '⏸️' : '▶️'}
                     </button>
                     <button
                       onClick={playNextTrack}
                       disabled={!currentTrackId || tracks.length === 0}
                       style={{
                         background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
                         border: '2px solid rgba(6, 182, 212, 0.4)',
                         color: '#22d3ee',
                         width: '45px',
                         height: '45px',
                         borderRadius: '10px',
                         cursor: 'pointer',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         fontSize: '1.1rem',
                         transition: 'all 0.3s ease',
                         boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                         opacity: (!currentTrackId || tracks.length === 0) ? 0.4 : 1
                       }}
                       title="Próxima Música"
                     >
                       ⏭️
                     </button>
                   </div>
                   
                   {isCrossfading && (
                     <div style={{
                       textAlign: 'center',
                       padding: '4px',
                       background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%)',
                       borderRadius: '8px',
                       border: '1px solid rgba(251, 191, 36, 0.3)',
                       color: '#fbbf24',
                       fontSize: '0.7rem',
                       fontWeight: 700,
                       textTransform: 'uppercase',
                       letterSpacing: '1px'
                     }}>
                       🔄 CROSSFADE ATIVO
                     </div>
                   )}
                   
                   {nextTrackPreview && autoDJ && (
                     <div style={{
                       padding: '4px 8px',
                       background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)',
                       borderRadius: '8px',
                       border: '1px solid rgba(6, 182, 212, 0.3)'
                     }}>
                       <div style={{
                         fontSize: '0.75rem',
                         color: '#22d3ee',
                         fontWeight: 600,
                         whiteSpace: 'nowrap',
                         overflow: 'hidden',
                         textOverflow: 'ellipsis'
                       }}>
                         ⏭️ PRÓXIMA: {nextTrackPreview.name}
                       </div>
                     </div>
                   )}
                   
                   <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                       <label style={{color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'}}>
                         <span>🔄</span> Aleatório
                       </label>
                       <label style={{
                         position: 'relative',
                         display: 'inline-block',
                         width: '45px',
                         height: '24px'
                       }}>
                         <input
                           type="checkbox"
                           checked={shuffleMode}
                           onChange={(e) => setShuffleMode(e.target.checked)}
                           disabled={!autoDJ}
                           style={{opacity: 0, width: 0, height: 0}}
                         />
                         <span style={{
                           position: 'absolute',
                           cursor: 'pointer',
                           top: 0,
                           left: 0,
                           right: 0,
                           bottom: 0,
                           backgroundColor: shuffleMode ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.5)',
                           transition: '0.3s',
                           borderRadius: '24px',
                           boxShadow: shuffleMode ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none'
                         }}>
                           <span style={{
                             position: 'absolute',
                             height: '18px',
                             width: '18px',
                             left: '3px',
                             bottom: '3px',
                             backgroundColor: 'white',
                             transition: '0.3s',
                             borderRadius: '50%',
                             transform: shuffleMode ? 'translateX(21px)' : 'translateX(0)'
                           }} />
                         </span>
                       </label>
                     </div>
                     
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                       <label style={{color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'}}>
                         <span>🎚️</span> Crossfade ({crossfadeDuration}s)
                       </label>
                       <input
                         type="range"
                         min="0"
                         max="10"
                         value={crossfadeDuration}
                         onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
                         disabled={!autoDJ}
                         style={{
                           width: '120px',
                           height: '5px',
                           borderRadius: '3px',
                           background: 'rgba(15, 23, 42, 0.8)',
                           outline: 'none',
                           WebkitAppearance: 'none',
                           opacity: !autoDJ ? 0.5 : 1
                         }}
                       />
                     </div>
                     
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                       <label style={{color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'}}>
                         <span>▶️</span> Ativar Auto DJ
                       </label>
                       <label style={{
                         position: 'relative',
                         display: 'inline-block',
                         width: '45px',
                         height: '24px'
                       }}>
                         <input
                           type="checkbox"
                           checked={autoDJ}
                           onChange={(e) => {
                             const newAutoDJ = e.target.checked;
                             setAutoDJ(newAutoDJ);
                             
                             if (newAutoDJ && tracks.length === 0) {
                               alert('Adicione músicas primeiro para ativar o Auto DJ!');
                               setAutoDJ(false);
                               return;
                             }
                             
                             if (newAutoDJ && !currentTrackId && tracks.length > 0) {
                               setTimeout(() => {
                                 const next = getNextTrack();
                                 if (next) {
                                   playTrack(next.id, false);
                                 }
                               }, 300);
                             }
                           }}
                           style={{opacity: 0, width: 0, height: 0}}
                         />
                         <span style={{
                           position: 'absolute',
                           cursor: 'pointer',
                           top: 0,
                           left: 0,
                           right: 0,
                           bottom: 0,
                           backgroundColor: autoDJ ? 'rgba(6, 182, 212, 0.5)' : 'rgba(100, 116, 139, 0.5)',
                           transition: '0.3s',
                           borderRadius: '24px',
                           boxShadow: autoDJ ? '0 0 15px rgba(6, 182, 212, 0.5)' : 'none'
                         }}>
                           <span style={{
                             position: 'absolute',
                             height: '18px',
                             width: '18px',
                             left: '3px',
                             bottom: '3px',
                             backgroundColor: 'white',
                             transition: '0.3s',
                             borderRadius: '50%',
                             transform: autoDJ ? 'translateX(21px)' : 'translateX(0)'
                           }} />
                         </span>
                       </label>
                     </div>
                   </div>
                 </div>
                 </div>
                 
        </CenterColumn>

        <ChatPanel 
                   tracks={tracks}
                   socket={socketRef.current}
          isDJ={true}
          onPlayTrack={playTrack}
          onRequestsChange={setSongRequests}
        />
      </MainGrid>
      </TabContent>

      {/* Conteúdo da Aba TELA INTEIRA */}
      <TabContent $active={activeTab === 'TELA INTEIRA'}>
        <FullScreenContainer>
          <div style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            gap: '16px',
            padding: '16px',
            overflow: 'hidden'
          }}>
            {/* Coluna Esquerda: Webcam */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '350px',
              flexShrink: 0,
              gap: '16px',
              height: '100%',
              justifyContent: 'space-between'
            }}>
              {/* Webcam */}
              <div style={{
                flex: '0 0 auto',
                height: 'auto'
              }}>
                <WebcamPanel />
              </div>
              
              {/* Jingles - Usando VignettePanel (mesmo da HOME) */}
              <div style={{ marginTop: '0', width: '100%' }}>
                <VignettePanel 
                  jingles={[]}
                  onPlayJingle={(jingleId) => {
                    // Fazer o segundo robô falar quando o jingle começar a tocar
                    if (mascotEnabled2) {
                      const jingleNames = {
                        'f1': 'Applause',
                        'f2': 'Laugh',
                        'f3': 'Boas Vindas',
                        'f4': 'Station ID',
                        'f5': 'Hora Certa',
                        'f6': 'News',
                        'f7': 'Alert',
                        'f8': 'Outro'
                      };
                      makeMascotSpeak2(`Tocando jingle: ${jingleNames[jingleId] || jingleId}`);
                    }
                    // Usar a mesma função de tocar jingle da HOME
                    handlePlayJingle(jingleId);
                  }}
                  onAddJingle={() => {}}
                  onAddJingleToSlot={handleAddJingleToSlot}
                  currentlyPlaying={currentlyPlayingJingle}
                  jingleAudios={jingleAudios}
                />
              </div>
              
              {/* Código antigo dos jingles removido - substituído por VignettePanel acima */}
              
              {/* Segundo Robô */}
              <RobotMascotContainer style={{
                opacity: mascotEnabled2 ? 1 : 0.3,
                marginTop: 'auto',
                marginBottom: '0'
              }}>
                {/* Botão de Ligar/Desligar Robô */}
                <RobotToggleButton
                  $active={mascotEnabled2}
                  onClick={() => {
                    setMascotEnabled2(!mascotEnabled2);
                    // Cancelar fala se estiver desligando
                    if (mascotEnabled2 && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                      isSpeakingRef2.current = false;
                      setIsMascotTalking2(false);
                    }
                  }}
                  title={mascotEnabled2 ? 'Desligar robô' : 'Ligar robô'}
                >
                  {mascotEnabled2 ? 'L' : 'D'}
                </RobotToggleButton>
                
                {mascotMessage2 && mascotEnabled2 && (
                  <RobotSpeechBubble>
                    {mascotMessage2}
                  </RobotSpeechBubble>
                )}
                <RobotContainer2 style={{opacity: mascotEnabled2 ? 1 : 0.5}}>
                  <RobotAccessory2>🤖</RobotAccessory2>
                  <RobotAntenna2 $left />
                  <RobotAntenna2 $left={false} />
                  <RobotHead2 $talking={isMascotTalking2 && mascotEnabled2}>
                    <RobotEye2 $left />
                    <RobotEye2 $left={false} />
                    <RobotSensor2 />
                    <RobotSpeaker2 $talking={isMascotTalking2 && mascotEnabled2} />
                  </RobotHead2>
                  <RobotBody2 />
                  <RobotArm2 $front $left />
                  <RobotArm2 $front $left={false} />
                </RobotContainer2>
                {!mascotEnabled2 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#ef4444',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    zIndex: 1001
                  }}>
                    DESLIGADO
                  </div>
                )}
              </RobotMascotContainer>
            </div>
            
            {/* Coluna Direita: Tela de Compartilhamento */}
            <ScreenShareContainer style={{ 
              margin: '0', 
              width: '100%', 
              flex: 1,
              height: '100%',
              minHeight: '100%',
              borderRadius: 16,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              padding: '16px'
            }}>
            <ScreenShareHeader style={{ 
              paddingBottom: '12px',
              marginBottom: '12px',
              borderBottom: '1px solid rgba(6, 182, 212, 0.2)',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <ScreenShareTitle>
                <span>📺</span> TRANSMISSÃO DE TELA
              </ScreenShareTitle>
              
              {/* Status e Botões na mesma linha */}
              <div style={{ 
                display: 'flex',
                gap: '6px',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <ScreenShareStatus $active={isScreenSharing} style={{
                  fontSize: '0.6rem',
                  padding: '3px 10px'
                }}>
                  <span>{isScreenSharing ? '●' : '○'}</span>
                  {isScreenSharing ? 'TRANSMITINDO' : 'DESLIGADO'}
                </ScreenShareStatus>
                
                {!isScreenSharing ? (
                  <>
                    <ScreenButton
                      $primary
                      onClick={() => setShowScreenOptions(true)}
                      title="Escolher tipo de compartilhamento"
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '6px 14px',
                        minWidth: 'auto',
                        fontWeight: '700'
                      }}
                    >
                      <span>📺</span>
                      Compartilhar
                    </ScreenButton>
                    <ScreenButton
                      onClick={() => startScreenShare('monitor')}
                      title="Compartilhar tela inteira rapidamente"
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '6px 12px',
                        minWidth: 'auto'
                      }}
                    >
                      <span>🖥️</span>
                      Tela
                    </ScreenButton>
                    <ScreenButton
                      onClick={() => startScreenShare('window')}
                      title="Compartilhar uma janela específica"
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '6px 12px',
                        minWidth: 'auto'
                      }}
                    >
                      <span>🪟</span>
                      Janela
                    </ScreenButton>
                    <ScreenButton
                      onClick={() => startScreenShare('browser')}
                      title="Compartilhar apenas uma aba do navegador"
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '6px 12px',
                        minWidth: 'auto'
                      }}
                    >
                      <span>🌐</span>
                      Aba
                    </ScreenButton>
                  </>
                ) : (
                  <>
                    <ScreenButton
                      onClick={stopScreenShare}
                      title="Parar compartilhamento de tela"
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '6px 14px',
                        minWidth: 'auto',
                        fontWeight: '700'
                      }}
                    >
                      <span>⏹️</span>
                      Parar
                    </ScreenButton>
                    <ScreenButton
                      $primary
                      onClick={async () => {
                        stopScreenShare();
                        setTimeout(() => {
                          setShowScreenOptions(true);
                        }, 300);
                      }}
                      title="Trocar tela compartilhada"
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '6px 12px',
                        minWidth: 'auto'
                      }}
                    >
                      <span>🔄</span>
                      Trocar
                    </ScreenButton>
                  </>
                )}
              </div>
            </ScreenShareHeader>
            
            <ScreenPreview style={{ 
              flex: 1,
              height: '95%',
              minHeight: 'calc(95vh - 260px)',
              maxHeight: 'none'
            }}>
              {isScreenSharing && screenStream ? (
                <>
                  <ScreenVideo
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      background: '#000',
                      display: 'block'
                    }}
                  />
                  {screenVideoRef.current && !screenVideoRef.current.srcObject && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#94a3b8',
                      fontSize: '0.9rem'
                    }}>
                      Aguardando stream...
                    </div>
                  )}
                </>
              ) : (
                <ScreenPlaceholder>
                  <div style={{ fontSize: '4rem' }}>🖥️</div>
                  <div style={{ fontSize: '1.2rem', marginTop: '16px' }}>Nenhuma tela compartilhada</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '12px' }}>
                    Clique em "Compartilhar" para começar
                  </div>
                </ScreenPlaceholder>
              )}
            </ScreenPreview>
          </ScreenShareContainer>
          </div>
        </FullScreenContainer>
      </TabContent>

      {/* Modal de Seleção de Tipo de Tela */}
      {showScreenOptions && (
        <ScreenOptionsModal onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowScreenOptions(false);
          }
        }}>
          <ScreenOptionsContainer>
            <ScreenOptionsTitle>📺 Escolher Tipo de Compartilhamento</ScreenOptionsTitle>
            
            <ScreenOptionsGrid>
              <ScreenOptionButton
                $selected={selectedScreenType === 'monitor'}
                onClick={() => setSelectedScreenType('monitor')}
              >
                <span>🖥️</span>
                <div>Tela Inteira</div>
                <ScreenOptionDescription $selected={selectedScreenType === 'monitor'}>
                  Compartilha todo o monitor
                </ScreenOptionDescription>
              </ScreenOptionButton>
              
              <ScreenOptionButton
                $selected={selectedScreenType === 'window'}
                onClick={() => setSelectedScreenType('window')}
              >
                <span>🪟</span>
                <div>Janela</div>
                <ScreenOptionDescription $selected={selectedScreenType === 'window'}>
                  Compartilha uma janela específica
                </ScreenOptionDescription>
              </ScreenOptionButton>
              
              <ScreenOptionButton
                $selected={selectedScreenType === 'browser'}
                onClick={() => setSelectedScreenType('browser')}
              >
                <span>🌐</span>
                <div>Aba do Navegador</div>
                <ScreenOptionDescription $selected={selectedScreenType === 'browser'}>
                  Compartilha apenas uma aba
                </ScreenOptionDescription>
              </ScreenOptionButton>
            </ScreenOptionsGrid>
            
            <ScreenOptionsActions>
              <ScreenOptionsButton
                onClick={() => setShowScreenOptions(false)}
              >
                Cancelar
              </ScreenOptionsButton>
              <ScreenOptionsButton
                $primary
                onClick={() => startScreenShare(selectedScreenType)}
              >
                Confirmar
              </ScreenOptionsButton>
            </ScreenOptionsActions>
          </ScreenOptionsContainer>
        </ScreenOptionsModal>
      )}

      {/* Modal de Configurações da Rádio */}
      {showRadioSettings && (
        <RadioSettingsModal
          radioName={radioName}
          radioBanner={radioBanner}
          onClose={() => setShowRadioSettings(false)}
          onSave={(name, banner) => {
            setRadioName(name);
            setRadioBanner(banner);
            localStorage.setItem('radioName', name);
            if (banner) {
              localStorage.setItem('radioBanner', banner);
            } else {
              localStorage.removeItem('radioBanner');
            }
            // Enviar nome atualizado para os ouvintes imediatamente
            if (socketRef.current?.connected) {
              socketRef.current.emit('broadcaster', {
                broadcasterId: socketRef.current.id,
                streaming: isBroadcasting,
                directStream: isBroadcasting,
                radioName: name
              });
              console.log('📡 Nome da rádio atualizado e enviado para ouvintes:', name);
            }
            setShowRadioSettings(false);
          }}
        />
      )}
      
      {/* Modal de Notícias */}
      {showNewsModal && (
        <NewsModal
          articles={newsArticles}
          loading={loadingNews}
          onClose={() => setShowNewsModal(false)}
          onRefresh={fetchNews}
          onArticleClick={(article) => {
            // Abrir notícia em nova aba e fechar modal
            window.open(article.link, '_blank', 'noopener,noreferrer');
            setShowNewsModal(false);
          }}
        />
      )}
      
      {/* Modal de configuração removido - streaming direto não requer configuração externa */}
      {false && (
        <ModalOverlay onClick={() => setShowIcecastModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#fff' }}>📡 Configuração do Servidor Icecast</h2>
            
            <div style={{ 
              padding: '12px', 
              background: 'rgba(6, 182, 212, 0.1)',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid rgba(6, 182, 212, 0.3)'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', lineHeight: '1.5' }}>
                <strong style={{ color: '#22d3ee' }}>Como funciona:</strong> Configure seu servidor Icecast para transmitir áudio. 
                O sistema enviará o áudio do player e microfone para o servidor Icecast, e os ouvintes se conectarão diretamente ao stream.
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>
                URL do Servidor Icecast: *
              </label>
              <input
                type="text"
                value={icecastConfig.url}
                onChange={(e) => setIcecastConfig({ ...icecastConfig, url: e.target.value })}
                placeholder="Ex: http://icecast.example.com ou https://stream.example.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>
                  Porta:
                </label>
                <input
                  type="number"
                  value={icecastConfig.port}
                  onChange={(e) => setIcecastConfig({ ...icecastConfig, port: e.target.value })}
                  placeholder="8000"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>
                  Mountpoint:
                </label>
                <input
                  type="text"
                  value={icecastConfig.mountpoint}
                  onChange={(e) => setIcecastConfig({ ...icecastConfig, mountpoint: e.target.value })}
                  placeholder="/stream"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#fff',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>
                Username (Source): *
              </label>
              <input
                type="text"
                value={icecastConfig.username}
                onChange={(e) => setIcecastConfig({ ...icecastConfig, username: e.target.value })}
                placeholder="source"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>
                Senha (Source Password): *
              </label>
              <input
                type="password"
                value={icecastConfig.password}
                onChange={(e) => setIcecastConfig({ ...icecastConfig, password: e.target.value })}
                placeholder="Sua senha do Icecast"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                Esta é a senha de source do seu servidor Icecast. Os ouvintes não precisam desta senha.
              </p>
            </div>
            
            <div style={{ 
              padding: '12px', 
              background: isStreamingToIcecast ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              marginBottom: '20px',
              border: `1px solid ${isStreamingToIcecast ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: isStreamingToIcecast ? '#4ade80' : '#f87171', lineHeight: '1.5' }}>
                <strong>Status:</strong> {isStreamingToIcecast ? '✅ Transmitindo para Icecast' : '⏸️ Não transmitindo'}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowIcecastModal(false);
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'rgba(6, 182, 212, 0.1)';
                  e.target.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'rgba(15, 23, 42, 0.8)';
                  e.target.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('icecastConfig', JSON.stringify(icecastConfig));
                  setShowIcecastModal(false);
                  alert('Configuração do Icecast salva com sucesso!');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)',
                  color: '#22d3ee',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(34, 211, 238, 0.25) 100%)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)';
                }}
              >
                Salvar Configuração
              </button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}
      
      {/* Modal antigo de Streamer - REMOVIDO (substituído por Icecast) */}

    </PageContainer>
  );
};

// Componente Modal de Notícias
const NewsModal = ({ articles, loading, onClose, onRefresh, onArticleClick }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data não disponível';
    }
  };
  
  const handleArticleClick = (article) => {
    if (onArticleClick) {
      onArticleClick(article);
    }
  };
  
  // Limpar HTML tags da descrição para exibição segura
  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };
  
  return (
    <ModalOverlay onClick={onClose}>
      <NewsModalContent onClick={(e) => e.stopPropagation()}>
        <NewsHeader>
          <NewsTitle>📰 Últimas Notícias</NewsTitle>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <RefreshButton onClick={onRefresh} disabled={loading}>
              {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
            </RefreshButton>
            <CancelButton onClick={onClose}>Fechar</CancelButton>
          </div>
        </NewsHeader>
        
        {loading ? (
          <LoadingText>🔄 Buscando notícias...</LoadingText>
        ) : articles.length === 0 ? (
          <EmptyNewsText>Nenhuma notícia encontrada. Tente atualizar.</EmptyNewsText>
        ) : (
          <NewsList>
            {articles.map((article, index) => (
              <NewsItem
                key={index}
                onClick={() => handleArticleClick(article)}
                title="Clique para abrir a notícia"
              >
                <NewsItemHeader>
                  <NewsItemTitle>{article.title}</NewsItemTitle>
                  <NewsItemSource>{article.source}</NewsItemSource>
                </NewsItemHeader>
                {article.description && (
                  <NewsItemDescription>
                    {stripHtml(article.description).substring(0, 150)}...
                  </NewsItemDescription>
                )}
                <NewsItemDate>
                  📅 {formatDate(article.pubDate)}
                </NewsItemDate>
              </NewsItem>
            ))}
          </NewsList>
        )}
      </NewsModalContent>
    </ModalOverlay>
  );
};

// Componente Modal de Configurações
const RadioSettingsModal = ({ radioName, radioBanner, onClose, onSave }) => {
  const [name, setName] = useState(radioName);
  const [banner, setBanner] = useState(radioBanner);
  const [bannerPreview, setBannerPreview] = useState(radioBanner);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
        setBanner(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBanner = () => {
    setBanner(null);
    setBannerPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Por favor, insira um nome para a rádio.');
      return;
    }
    onSave(name.trim(), banner);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalTitle>⚙️ Configurações da Rádio</ModalTitle>
        
        <FormGroup>
          <Label>Nome da Rádio</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Digite o nome da rádio"
            maxLength={50}
          />
        </FormGroup>

        <FormGroup>
          <Label>Banner da Rádio</Label>
          <FileInput
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            id="banner-input"
          />
          <FileInputLabel htmlFor="banner-input">
            {bannerPreview ? '🖼️ Alterar Banner' : '📷 Adicionar Banner'}
          </FileInputLabel>
          {bannerPreview && (
            <>
              <PreviewBanner src={bannerPreview} alt="Banner Preview" />
              <RemoveBannerButton onClick={handleRemoveBanner}>
                🗑️ Remover Banner
              </RemoveBannerButton>
            </>
          )}
        </FormGroup>

        <ButtonGroup>
          <CancelButton onClick={onClose}>Cancelar</CancelButton>
          <SaveButton onClick={handleSave}>Salvar</SaveButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DJPanel;

