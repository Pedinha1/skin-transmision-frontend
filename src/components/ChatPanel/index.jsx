import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import io from 'socket.io-client';
import { pulse, slideIn } from '../../styles/animations';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(15px);
  border-left: 2px solid rgba(6, 182, 212, 0.3);
  box-shadow: 
    -10px 0 40px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(6, 182, 212, 0.08),
    inset 1px 0 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1.2rem 1.2rem;
  border-bottom: 2px solid rgba(6, 182, 212, 0.3);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(6, 182, 212, 0.5) 50%,
      transparent 100%
    );
  }
`;

const HeaderTitle = styled.span`
  color: #f1f5f9;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 10px;
  
  span {
    font-size: 1.1rem;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5));
  }
`;

const OnlineBadge = styled.span`
  font-size: 0.7rem;
  padding: 8px 14px;
  border-radius: 20px;
  background: ${props => props.$connected 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    : 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
  };
  color: white;
  font-weight: 800;
  box-shadow: 
    0 4px 15px ${props => props.$connected ? 'rgba(6, 182, 212, 0.6)' : 'rgba(100, 116, 139, 0.4)'},
    0 2px 8px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  
  &::before {
    content: '●';
    font-size: 0.7rem;
    ${props => props.$connected ? css`animation: ${pulse} 2s infinite;` : css`animation: none;`}
  }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 2px solid rgba(6, 182, 212, 0.2);
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem 1.2rem;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)' 
    : 'transparent'
  };
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#06b6d4' : 'transparent'};
  cursor: pointer;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition: all 0.3s ease;
  position: relative;
  text-shadow: ${props => props.$active ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none'};
  
  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.2) 100%)' 
      : 'rgba(6, 182, 212, 0.1)'
    };
    color: #22d3ee;
  }
`;

const ChatArea = styled.div`
  flex: 1;
  padding: 1.2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.3) 100%);

  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
    border-radius: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #06b6d4, #22d3ee);
    border-radius: 5px;
    border: 2px solid rgba(15, 23, 42, 0.4);
    box-shadow: 
      0 2px 8px rgba(6, 182, 212, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #22d3ee, #67e8f9);
  }
  
  scrollbar-width: thin;
  scrollbar-color: #06b6d4 rgba(15, 23, 42, 0.4);
`;

const Message = styled.div`
  background: ${props => props.$self 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)'
  };
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 14px 16px;
  border-left: 3px solid ${props => props.$self ? '#06b6d4' : '#22d3ee'};
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 2px 10px ${props => props.$self ? 'rgba(6, 182, 212, 0.15)' : 'rgba(34, 211, 238, 0.1)'},
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  ${css`animation: ${slideIn} 0.3s ease;`}
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: ${props => props.$self 
      ? 'linear-gradient(180deg, #06b6d4, #22d3ee)'
      : 'linear-gradient(180deg, #22d3ee, #67e8f9)'
    };
    box-shadow: 0 0 10px ${props => props.$self 
      ? 'rgba(6, 182, 212, 0.6)'
      : 'rgba(34, 211, 238, 0.6)'
    };
  }

  &:hover {
    transform: translateX(4px);
    box-shadow: 
      0 6px 25px rgba(0, 0, 0, 0.4),
      0 3px 15px ${props => props.$self ? 'rgba(6, 182, 212, 0.2)' : 'rgba(34, 211, 238, 0.2)'},
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
`;

const UserHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const UserName = styled.span`
  font-weight: 800;
  color: ${props => props.$self ? '#22d3ee' : '#06b6d4'};
  font-size: 0.85rem;
  text-shadow: 0 0 10px ${props => props.$self 
    ? 'rgba(34, 211, 238, 0.5)'
    : 'rgba(6, 182, 212, 0.5)'
  };
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &::before {
    content: ${props => props.$self ? '"👤"' : '"👥"'};
    font-size: 0.8rem;
    filter: drop-shadow(0 0 4px rgba(6, 182, 212, 0.5));
  }
`;

const Time = styled.span`
  color: #64748b;
  font-size: 0.7rem;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
`;

const Text = styled.p`
  color: #e2e8f0;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.7;
  word-wrap: break-word;
  font-weight: 500;
`;

const InputContainer = styled.div`
  padding: 1.2rem;
  border-top: 2px solid rgba(6, 182, 212, 0.3);
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%,
      rgba(6, 182, 212, 0.5) 50%,
      transparent 100%
    );
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const MessageInput = styled.input`
  flex: 1;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 2px solid rgba(6, 182, 212, 0.4);
  border-radius: 12px;
  padding: 14px 18px;
  color: #f1f5f9;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);

  &::placeholder {
    color: #64748b;
    font-style: italic;
  }

  &:focus {
    border-color: #22d3ee;
    box-shadow: 
      0 0 0 4px rgba(6, 182, 212, 0.2),
      0 4px 20px rgba(6, 182, 212, 0.3),
      0 2px 10px rgba(0, 0, 0, 0.5),
      inset 0 2px 8px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  }
`;

const SendButton = styled.button`
  background: ${props => props.$disabled 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)'
    : 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
  };
  border: ${props => props.$disabled 
    ? '2px solid rgba(6, 182, 212, 0.2)'
    : '2px solid rgba(6, 182, 212, 0.5)'
  };
  color: white;
  padding: 14px 24px;
  border-radius: 12px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 800;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: ${props => props.$disabled 
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 4px 15px rgba(6, 182, 212, 0.6), 0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
  };
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;

  box-sizing: border-box;

  &:hover:not(:disabled) {
    box-shadow: 
      0 6px 25px rgba(6, 182, 212, 0.8),
      0 3px 12px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 0 20px rgba(6, 182, 212, 0.4);
    border-color: #22d3ee;
  }

  &:active:not(:disabled) {
    transform: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #64748b;
  margin-top: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 3rem 2rem;
`;

const EmptyIcon = styled.div`
  font-size: 4rem;
  opacity: 0.3;
  filter: drop-shadow(0 4px 12px rgba(6, 182, 212, 0.3));
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const EmptyText = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const EmptySubtext = styled.small`
  font-size: 0.8rem;
  color: #64748b;
  font-style: italic;
`;

const RequestItem = styled.div`
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(249, 115, 22, 0.1) 100%);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  border-left: 3px solid #fbbf24;
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 2px 10px rgba(251, 191, 36, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  ${css`animation: ${slideIn} 0.3s ease;`}
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    background: linear-gradient(180deg, #fbbf24, #f59e0b);
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.6);
  }

  &:hover {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(249, 115, 22, 0.15) 100%);
    transform: translateX(4px);
    box-shadow: 
      0 6px 25px rgba(0, 0, 0, 0.4),
      0 3px 15px rgba(251, 191, 36, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
`;

const RequestHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const RequestUser = styled.span`
  font-weight: 800;
  color: #fbbf24;
  font-size: 0.85rem;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &::before {
    content: '🎵';
    font-size: 0.9rem;
    filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
  }
`;

const RequestActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 12px;
`;

const ActionIcon = styled.button`
  background: ${props => props.$accept 
    ? 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)'
    : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
  };
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$accept 
    ? '0 4px 15px rgba(6, 182, 212, 0.5)'
    : '0 4px 15px rgba(239, 68, 68, 0.5)'
  };

  &:hover {
    transform: scale(1.1);
    box-shadow: ${props => props.$accept 
      ? '0 6px 20px rgba(6, 182, 212, 0.7)'
      : '0 6px 20px rgba(239, 68, 68, 0.7)'
    };
  }

  &:active {
    transform: scale(0.95);
  }
`;

const SongTitle = styled.div`
  color: #fbbf24;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 8px 0;
  padding: 8px 12px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
`;

const SearchContainer = styled.div`
  padding: 1rem;
  border-bottom: 2px solid rgba(6, 182, 212, 0.2);
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const RequestForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
`;

const InputRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  color: #22d3ee;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SearchInput = styled.input`
  width: 100%;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 2px solid rgba(6, 182, 212, 0.4);
  border-radius: 12px;
  padding: 12px 16px;
  color: #f1f5f9;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    inset 0 2px 8px rgba(0, 0, 0, 0.3);

  &::placeholder {
    color: #64748b;
    font-style: italic;
  }

  &:focus {
    border-color: #22d3ee;
    box-shadow: 
      0 0 0 4px rgba(6, 182, 212, 0.2),
      0 4px 20px rgba(6, 182, 212, 0.3),
      0 2px 10px rgba(0, 0, 0, 0.5),
      inset 0 2px 8px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  }
`;

const SearchResults = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SearchResultItem = styled.div`
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.2) 100%);
    border-color: #22d3ee;
    transform: translateX(4px);
  }
`;

const SearchResultTitle = styled.div`
  color: #22d3ee;
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 4px;
`;

const SearchResultArtist = styled.div`
  color: #94a3b8;
  font-size: 0.75rem;
`;

const RequestButton = styled.button`
  background: ${props => props.$disabled 
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.6) 100%)'
    : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
  };
  border: ${props => props.$disabled 
    ? '2px solid rgba(251, 191, 36, 0.2)'
    : '2px solid rgba(251, 191, 36, 0.5)'
  };
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  font-weight: 800;
  font-size: 0.85rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: ${props => props.$disabled 
    ? '0 2px 8px rgba(0, 0, 0, 0.3)'
    : '0 4px 15px rgba(251, 191, 36, 0.6), 0 2px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  box-sizing: border-box;

  &:hover:not(:disabled) {
    box-shadow: 
      0 6px 25px rgba(251, 191, 36, 0.8),
      0 3px 12px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      0 0 20px rgba(251, 191, 36, 0.4);
    border-color: #f59e0b;
  }

  &:active:not(:disabled) {
    transform: none;
  }
`;

// Animação para o botão push-to-talk
const pulseMic = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
  50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(239, 68, 68, 0.8); }
`;

const PushToTalkButton = styled.button`
  width: 45px;
  height: 45px;
  min-width: 45px;
  min-height: 45px;
  border-radius: 50%;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: 2px solid ${props => props.$active ? '#ef4444' : 'rgba(6, 182, 212, 0.5)'};
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: ${props => props.$active 
    ? '0 0 25px rgba(239, 68, 68, 0.7), 0 4px 15px rgba(0, 0, 0, 0.4)'
    : '0 2px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
  };
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
  flex-shrink: 0;
  ${props => props.$active ? css`animation: ${pulseMic} 1s infinite;` : ''}

  &:hover:not(:active) {
    border-color: #22d3ee;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4);
  }
`;

const VoiceCommandDisplay = styled.div`
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%);
  border: 1px solid rgba(34, 211, 238, 0.3);
  border-radius: 8px;
  font-size: 0.7rem;
  color: #22d3ee;
  text-align: center;
  margin-top: 8px;
  ${css`animation: ${fadeIn} 0.3s ease;`}
`;

const ChatPanel = ({ tracks = [], socket, isDJ = false, onPlayTrack, userName = 'Ouvinte', onRequestsChange }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestUserName, setRequestUserName] = useState(''); // Nome do usuário opcional para pedidos
  const [chatUserName, setChatUserName] = useState(() => {
    // Carregar nome de usuário do chat do localStorage se existir
    return localStorage.getItem('chatUserName') || '';
  }); // Nome do usuário opcional para chat
  
  // Configurações de limpeza automática
  const MAX_MESSAGES = 100; // Máximo de mensagens no histórico
  const MAX_MESSAGE_AGE = 2 * 60 * 60 * 1000; // 2 horas em milissegundos
  const CLEANUP_INTERVAL = 5 * 60 * 1000; // Limpar a cada 5 minutos
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Push-to-Talk States (apenas para ouvintes)
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [pushToTalkVuLevel, setPushToTalkVuLevel] = useState(0);
  const [lastVoiceCommand, setLastVoiceCommand] = useState('');
  const pushToTalkStreamRef = useRef(null);
  const pushToTalkAudioContextRef = useRef(null);
  const pushToTalkAnalyserRef = useRef(null);
  const pushToTalkAnimationRef = useRef(null);
  const pushToTalkRecognitionRef = useRef(null);
  
  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Funções Push-to-Talk
  const startPushToTalk = useCallback(async () => {
    if (isPushToTalkActive || isDJ) return;
    
    try {
      console.log('🎤 Ouvinte: Iniciando Push-to-Talk...');
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      pushToTalkAudioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      pushToTalkAnalyserRef.current = analyser;
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      pushToTalkStreamRef.current = stream;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
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
          
          if (event.results[last].isFinal && command) {
            console.log('🎤 Ouvinte comando de voz:', command);
            setLastVoiceCommand(command);
            
            // Enviar como mensagem de chat
            if (socketRef.current && isConnected) {
              const message = {
                id: Date.now(),
                user: chatUserName.trim() || userName,
                time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                timestamp: new Date().toISOString(),
                text: `🎤 ${command}`,
                self: false,
              };
              socketRef.current.emit('chat:message', message);
            }
          }
        };
        
        recognition.start();
        pushToTalkRecognitionRef.current = recognition;
      }
      
      // VU Meter
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVU = () => {
        if (!pushToTalkStreamRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        setPushToTalkVuLevel(Math.min(100, (average / 255) * 100 * 2));
        pushToTalkAnimationRef.current = requestAnimationFrame(updateVU);
      };
      updateVU();
      
      setIsPushToTalkActive(true);
    } catch (err) {
      console.error('❌ Erro Push-to-Talk:', err);
    }
  }, [isPushToTalkActive, isDJ, chatUserName, userName, isConnected]);
  
  const stopPushToTalk = useCallback(() => {
    if (!isPushToTalkActive) return;
    
    if (pushToTalkRecognitionRef.current) {
      pushToTalkRecognitionRef.current.stop();
      pushToTalkRecognitionRef.current = null;
    }
    
    if (pushToTalkAnimationRef.current) {
      cancelAnimationFrame(pushToTalkAnimationRef.current);
    }
    
    if (pushToTalkStreamRef.current) {
      pushToTalkStreamRef.current.getTracks().forEach(track => track.stop());
      pushToTalkStreamRef.current = null;
    }
    
    if (pushToTalkAudioContextRef.current) {
      pushToTalkAudioContextRef.current.close();
      pushToTalkAudioContextRef.current = null;
    }
    
    setPushToTalkVuLevel(0);
    setIsPushToTalkActive(false);
  }, [isPushToTalkActive]);

  // Inicializar socket
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
    
    // Suprimir erros de WebSocket no console quando o servidor não está disponível
    const originalError = console.error;
    const suppressWebSocketErrors = () => {
      console.error = (...args) => {
        const message = args.join(' ');
        // Suprimir erros específicos de WebSocket do Socket.IO
        if (
          message.includes('WebSocket') && 
          (message.includes('failed') || message.includes('closed') || message.includes('connection'))
        ) {
          return;
        }
        originalError.apply(console, args);
      };
    };
    
    const restoreConsole = () => {
      console.error = originalError;
    };
    
    suppressWebSocketErrors();
    
    // Usar socket passado como prop ou criar novo
    if (socket && socket.connected) {
      restoreConsole();
      socketRef.current = socket;
      setIsConnected(true);
      console.log('ChatPanel: Usando socket passado como prop. ID:', socket.id);
    } else {
      try {
        socketRef.current = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 2000,
          reconnectionAttempts: 3,
          reconnectionDelayMax: 5000,
          timeout: 10000,
          autoConnect: true,
          forceNew: false
        });

        let connectionAttempts = 0;
        const maxSilentAttempts = 2;

        socketRef.current.on('connect', () => {
          restoreConsole();
          connectionAttempts = 0;
          console.log('ChatPanel: Socket.IO conectado:', socketRef.current.id);
          setIsConnected(true);
        });

        socketRef.current.on('disconnect', (reason) => {
          if (reason !== 'io client disconnect') {
            restoreConsole();
            console.log('ChatPanel: Socket.IO desconectado:', reason);
            suppressWebSocketErrors();
          }
          setIsConnected(false);
        });

        socketRef.current.on('connect_error', (error) => {
          connectionAttempts++;
          if (connectionAttempts > maxSilentAttempts) {
            restoreConsole();
            suppressWebSocketErrors();
          }
          setIsConnected(false);
        });

        socketRef.current.on('reconnect_attempt', () => {
          suppressWebSocketErrors();
        });

        socketRef.current.on('reconnect_failed', () => {
          restoreConsole();
          socketRef.current.io.reconnection(false);
          suppressWebSocketErrors();
        });

        socketRef.current.on('reconnect', () => {
          restoreConsole();
          console.log('ChatPanel: Socket.IO reconectado');
          setIsConnected(true);
        });
        
        // Restaurar console após um tempo se não conectar
        setTimeout(() => {
          if (!socketRef.current?.connected) {
            restoreConsole();
          }
        }, 5000);
      } catch (error) {
        restoreConsole();
        console.warn('ChatPanel: Erro ao inicializar Socket.IO:', error);
      }
    }

    return () => {
      restoreConsole();
      // Não desconectar se o socket foi passado como prop
      if (!socket && socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [socket]);

  // Atualizar socket ref quando prop mudar
  useEffect(() => {
    if (socket) {
      socketRef.current = socket;
      setIsConnected(socket.connected);
      
      const handleConnect = () => setIsConnected(true);
      const handleDisconnect = () => setIsConnected(false);
      
      socket.on('connect', handleConnect);
      socket.on('disconnect', handleDisconnect);
      
      return () => {
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
      };
    }
  }, [socket]);

  // Configurar listeners de eventos
  useEffect(() => {
    if (!socketRef.current) return;

    console.log('ChatPanel: Configurando listeners. isDJ:', isDJ);

    const handleMessage = (message) => {
      console.log('ChatPanel: Mensagem recebida:', message);
      setMessages(prev => {
        const exists = prev.find(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    const handleRequest = (request) => {
      console.log('ChatPanel: Pedido recebido!', request, 'isDJ:', isDJ);
      setRequests(prev => {
        const exists = prev.find(r => r.id === request.id);
        if (exists) {
          console.log('Pedido já existe, ignorando duplicata');
          return prev;
        }
        console.log('Adicionando novo pedido. Total:', prev.length + 1);
        return [...prev, request];
      });
    };

    const handleRequestAccepted = (requestId) => {
      console.log('ChatPanel: Pedido aceito:', requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleRequestRejected = (requestId) => {
      console.log('ChatPanel: Pedido rejeitado:', requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleRequestExecuted = (requestId) => {
      console.log('ChatPanel: Pedido executado (música começou a tocar):', requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    };

    const handleHistory = (history) => {
      console.log('ChatPanel: Histórico recebido:', history.length, 'mensagens');
      setMessages(history);
    };

    const handleRequests = (requestsList) => {
      console.log('ChatPanel: Pedidos recebidos:', requestsList.length);
      setRequests(requestsList);
    };

    const handleRequestSent = (sentRequest) => {
      console.log('ChatPanel: Pedido enviado confirmado:', sentRequest);
      setSongTitle('');
      setSongArtist('');
    };

    const handleServerRestarted = (data) => {
      console.log('🔄 Servidor reiniciado:', data);
      // Limpar mensagens e pedidos quando o servidor reinicia
      setMessages([]);
      setRequests([]);
      if (isDJ && onRequestsChangeRef.current) {
        onRequestsChangeRef.current([]);
      }
    };

    socketRef.current.on('chat:message', handleMessage);
    socketRef.current.on('chat:request', handleRequest);
    socketRef.current.on('chat:request:accepted', handleRequestAccepted);
    socketRef.current.on('chat:request:rejected', handleRequestRejected);
    socketRef.current.on('chat:request:executed', handleRequestExecuted);
    socketRef.current.on('chat:history', handleHistory);
    socketRef.current.on('chat:requests', handleRequests);
    socketRef.current.on('chat:request:sent', handleRequestSent);
    socketRef.current.on('server:restarted', handleServerRestarted);

    // Carregar histórico
    socketRef.current.emit('chat:history');
    socketRef.current.emit('chat:requests');

    return () => {
      if (socketRef.current) {
        socketRef.current.off('chat:message', handleMessage);
        socketRef.current.off('chat:request', handleRequest);
        socketRef.current.off('chat:request:accepted', handleRequestAccepted);
        socketRef.current.off('chat:request:rejected', handleRequestRejected);
        socketRef.current.off('chat:request:executed', handleRequestExecuted);
        socketRef.current.off('chat:history', handleHistory);
        socketRef.current.off('chat:requests', handleRequests);
        socketRef.current.off('chat:request:sent', handleRequestSent);
        socketRef.current.off('server:restarted', handleServerRestarted);
      }
    };
  }, [isDJ, isConnected]);

  // Auto-scroll
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, requests]);

  // Sincronizar pedidos com componente pai (apenas para DJ)
  // Usar useRef para evitar loop infinito
  const onRequestsChangeRef = useRef(onRequestsChange);
  const prevRequestsRef = useRef(requests);

  useEffect(() => {
    onRequestsChangeRef.current = onRequestsChange;
  }, [onRequestsChange]);

  useEffect(() => {
    if (isDJ && onRequestsChangeRef.current) {
      // Verificar se os pedidos realmente mudaram
      const requestsChanged = 
        prevRequestsRef.current.length !== requests.length ||
        prevRequestsRef.current.some((req, idx) => {
          const newReq = requests[idx];
          return !newReq || req.id !== newReq.id || req.accepted !== newReq.accepted || req.rejected !== newReq.rejected;
        });

      if (requestsChanged) {
        prevRequestsRef.current = requests;
        // Usar setTimeout para garantir que a atualização aconteça após o render
        const timeoutId = setTimeout(() => {
          if (onRequestsChangeRef.current) {
            onRequestsChangeRef.current(requests);
          }
        }, 0);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [requests, isDJ]);

  // Sistema de limpeza automática do chat
  useEffect(() => {
    const MAX_MESSAGES = 100; // Máximo de mensagens no histórico
    const MAX_MESSAGE_AGE = 2 * 60 * 60 * 1000; // 2 horas em milissegundos
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // Limpar a cada 5 minutos
    
    const cleanupMessages = () => {
      const now = Date.now();
      
      setMessages(prev => {
        // Remover mensagens antigas
        const filtered = prev.filter(msg => {
          if (!msg.timestamp && !msg.time) return true; // Manter mensagens sem timestamp
          
          // Tentar parsear timestamp
          let messageTime;
          if (msg.timestamp) {
            messageTime = new Date(msg.timestamp).getTime();
          } else if (msg.time) {
            // Tentar parsear formato HH:MM:SS
            const timeParts = msg.time.split(':');
            if (timeParts.length >= 2) {
              const today = new Date();
              today.setHours(parseInt(timeParts[0]) || 0);
              today.setMinutes(parseInt(timeParts[1]) || 0);
              today.setSeconds(parseInt(timeParts[2]) || 0);
              messageTime = today.getTime();
            } else {
              return true; // Manter se não conseguir parsear
            }
          } else {
            return true; // Manter se não tem timestamp
          }
          
          const messageAge = now - messageTime;
          return messageAge < MAX_MESSAGE_AGE;
        });
        
        // Limitar quantidade máxima
        if (filtered.length > MAX_MESSAGES) {
          return filtered.slice(-MAX_MESSAGES);
        }
        
        return filtered;
      });
      
      // Limpar pedidos antigos
      setRequests(prev => {
        const MAX_REQUESTS = 50;
        const MAX_REQUEST_AGE = 24 * 60 * 60 * 1000; // 24 horas
        
        const filtered = prev.filter(req => {
          // Remover pedidos aceitos ou rejeitados há mais de 1 hora
          if (req.accepted || req.rejected) {
            if (req.processedAt) {
              const age = now - new Date(req.processedAt).getTime();
              return age < 60 * 60 * 1000; // Manter por 1 hora após processamento
            }
            return false;
          }
          
          // Remover pedidos pendentes muito antigos
          if (req.timestamp) {
            const age = now - new Date(req.timestamp).getTime();
            return age < MAX_REQUEST_AGE;
          }
          
          return true;
        });
        
        if (filtered.length > MAX_REQUESTS) {
          return filtered.slice(-MAX_REQUESTS);
        }
        
        return filtered;
      });
    };
    
    // Limpar imediatamente e depois periodicamente
    cleanupMessages();
    const interval = setInterval(cleanupMessages, CLEANUP_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  // Buscar músicas
  useEffect(() => {
    if (searchTerm.trim().length > 2 && tracks.length > 0) {
      const filtered = tracks.filter(track => {
        const search = searchTerm.toLowerCase();
        const title = (track.title || '').toLowerCase();
        const artist = (track.artist || '').toLowerCase();
        const filename = (track.filename || '').toLowerCase();
        return title.includes(search) || artist.includes(search) || filename.includes(search);
      }).slice(0, 5);
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, tracks]);

  const formatTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!inputValue.trim() || !socketRef.current || !isConnected) {
      if (!isConnected) {
        alert('Não conectado ao servidor. Aguarde a conexão...');
      }
      return;
    }

    // Usar o nome de usuário do chat se fornecido, senão usar o padrão
    const finalUserName = chatUserName.trim() || (isDJ ? 'DJ' : userName);

    const message = {
      id: Date.now(),
      user: finalUserName,
      time: formatTime(),
      timestamp: new Date().toISOString(), // Adicionar timestamp ISO para limpeza automática
      text: inputValue.trim(),
      self: isDJ,
    };

    console.log('ChatPanel: Enviando mensagem:', message);
    socketRef.current.emit('chat:message', message);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, isDJ, userName, chatUserName, isConnected]);

  const handleRequestSong = useCallback((track) => {
    if (!socketRef.current || !isConnected) {
      alert('Não conectado ao servidor. Aguarde a conexão...');
      return;
    }

    // Usar o nome do usuário do formulário se preenchido, senão usar o userName padrão
    const finalUserName = requestUserName.trim() || (isDJ ? 'DJ' : userName);

    const request = {
      id: Date.now(),
      user: finalUserName,
      song: track.title || track.filename,
      artist: track.artist || '',
      trackId: track.id,
      time: formatTime(),
      timestamp: new Date().toISOString(), // Adicionar timestamp para limpeza automática
    };

    console.log('ChatPanel: Enviando pedido da biblioteca:', request);
    socketRef.current.emit('chat:request', request);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearch(false);
  }, [isDJ, userName, requestUserName, isConnected]);

  const handleManualRequest = useCallback(async (e) => {
    e.preventDefault();
    
    if (!songTitle.trim()) {
      alert('Por favor, digite o nome da música');
      return;
    }

    if (!socketRef.current) {
      alert('Erro: Socket não disponível. Recarregue a página.');
      return;
    }

    if (!isConnected) {
      alert('Não conectado ao servidor. Aguarde a conexão...');
      return;
    }

    try {
      // Usar o nome do usuário do formulário se preenchido, senão usar o userName padrão
      const finalUserName = requestUserName.trim() || (isDJ ? 'DJ' : userName);
      
      const request = {
        id: Date.now(),
        user: finalUserName,
        song: songTitle.trim(),
        artist: songArtist.trim() || '',
        trackId: null,
        time: formatTime(),
        timestamp: new Date().toISOString(), // Adicionar timestamp para limpeza automática
      };

      console.log('ChatPanel: Enviando pedido manual:', request);
      socketRef.current.emit('chat:request', request);
      
      // Limpar campos imediatamente para melhor UX
      setSongTitle('');
      setSongArtist('');
      setRequestUserName(''); // Limpar também o nome do usuário
    } catch (error) {
      console.error('Erro ao enviar pedido:', error);
      alert('Erro ao enviar pedido: ' + error.message);
    }
  }, [songTitle, songArtist, requestUserName, isDJ, userName, isConnected]);

  const handleAcceptRequest = useCallback((requestId) => {
    if (!socketRef.current || !isConnected) return;
    
    const request = requests.find(r => r.id === requestId);
    if (request && request.trackId && onPlayTrack) {
      console.log('ChatPanel: Tocando música do pedido:', request.trackId);
      onPlayTrack(request.trackId);
    }
    
    console.log('ChatPanel: Aceitando pedido:', requestId);
    socketRef.current.emit('chat:request:accept', requestId);
  }, [requests, onPlayTrack, isConnected]);

  const handleRejectRequest = useCallback((requestId) => {
    if (!socketRef.current || !isConnected) return;
    console.log('ChatPanel: Rejeitando pedido:', requestId);
    socketRef.current.emit('chat:request:reject', requestId);
  }, [isConnected]);

  const handleClearChat = useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar todas as mensagens do chat?')) {
      setMessages([]);
      console.log('ChatPanel: Chat limpo pelo usuário');
    }
  }, []);

  return (
    <Container>
      <Header>
        <HeaderTitle>
          <span>💬</span> CHAT
        </HeaderTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleClearChat}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(100, 116, 139, 0.1)',
              color: '#94a3b8',
              border: '1px solid rgba(100, 116, 139, 0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 500,
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              opacity: 0.6,
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.2)';
              e.target.style.opacity = '1';
              e.target.style.color = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
              e.target.style.opacity = '0.6';
              e.target.style.color = '#94a3b8';
            }}
            title="Limpar chat"
          >
            🧹 Limpeza
          </button>
          <OnlineBadge $connected={isConnected}>
            {isConnected ? 'ONLINE' : 'OFFLINE'}
          </OnlineBadge>
        </div>
      </Header>
      
      <Tabs>
        <Tab $active={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
          Chat
        </Tab>
        <Tab $active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')}>
          Pedir Músicas
        </Tab>
      </Tabs>

      {activeTab === 'pedidos' && !isDJ && (
        <SearchContainer>
          <RequestForm onSubmit={handleManualRequest}>
            <InputRow>
              <Label>
                👤 Seu Nome (Opcional)
              </Label>
              <SearchInput
                type="text"
                placeholder="Digite seu nome (opcional)..."
                value={requestUserName}
                onChange={(e) => setRequestUserName(e.target.value)}
                disabled={!isConnected}
                maxLength={50}
              />
            </InputRow>
            <InputRow>
              <Label>
                🎵 Nome da Música *
              </Label>
              <SearchInput
                type="text"
                placeholder="Digite o nome da música..."
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                required
                disabled={!isConnected}
              />
            </InputRow>
            <InputRow>
              <Label>
                🎤 Nome do Cantor/Artista
              </Label>
              <SearchInput
                type="text"
                placeholder="Digite o nome do cantor (opcional)..."
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
                disabled={!isConnected}
              />
            </InputRow>
            <RequestButton 
              type="submit" 
              $disabled={!songTitle.trim() || !isConnected}
            >
              <span>🎵</span> Enviar Pedido
            </RequestButton>
          </RequestForm>
          
          <div style={{ 
            borderTop: '1px solid rgba(6, 182, 212, 0.2)', 
            paddingTop: '12px',
            marginTop: '8px'
          }}>
            <Label style={{ marginBottom: '8px' }}>
              🔍 Ou busque na biblioteca
            </Label>
            <SearchInput
              type="text"
              placeholder="🔍 Buscar música na biblioteca..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              disabled={!isConnected}
            />
            {showSearch && searchResults.length > 0 && (
              <SearchResults>
                {searchResults.map(track => (
                  <SearchResultItem
                    key={track.id}
                    onClick={() => handleRequestSong(track)}
                  >
                    <SearchResultTitle>{track.title || track.filename}</SearchResultTitle>
                    {track.artist && <SearchResultArtist>{track.artist}</SearchResultArtist>}
                  </SearchResultItem>
                ))}
              </SearchResults>
            )}
          </div>
        </SearchContainer>
      )}

      <ChatArea ref={chatAreaRef}>
        {activeTab === 'chat' ? (
          messages.length > 0 ? (
            messages.map(msg => (
              <Message key={msg.id} $self={msg.self}>
                <UserHeader>
                  <UserName $self={msg.self}>{msg.user}</UserName>
                  <Time>{msg.time}</Time>
                </UserHeader>
                <Text>{msg.text}</Text>
              </Message>
            ))
          ) : (
            <EmptyState>
              <EmptyIcon>💬</EmptyIcon>
              <EmptyText>Nenhuma mensagem</EmptyText>
              <EmptySubtext>Inicie a conversa!</EmptySubtext>
            </EmptyState>
          )
        ) : (
          requests.length > 0 ? (
            requests.map(req => (
              <RequestItem key={req.id}>
                <RequestHeader>
                  <RequestUser>{req.user}</RequestUser>
                  <Time>{req.time}</Time>
                </RequestHeader>
                <SongTitle>
                  <div>🎵 {req.song}</div>
                  {req.artist && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#f59e0b',
                      marginTop: '4px',
                      fontWeight: '500'
                    }}>
                      🎤 {req.artist}
                    </div>
                  )}
                </SongTitle>
                {isDJ && (
                  <RequestActions>
                    <ActionIcon $accept onClick={() => handleAcceptRequest(req.id)} title="Aceitar">
                      ✓
                    </ActionIcon>
                    <ActionIcon onClick={() => handleRejectRequest(req.id)} title="Rejeitar">
                      ✕
                    </ActionIcon>
                  </RequestActions>
                )}
              </RequestItem>
            ))
          ) : (
            <EmptyState>
              <EmptyIcon>🎵</EmptyIcon>
              <EmptyText>Nenhum pedido pendente</EmptyText>
              <EmptySubtext>{isDJ ? 'Aguardando pedidos dos ouvintes...' : 'Busque e peça sua música favorita!'}</EmptySubtext>
            </EmptyState>
          )
        )}
      </ChatArea>

      {activeTab === 'chat' && (
        <InputContainer>
          <form onSubmit={handleSendMessage}>
            <InputRow style={{ marginBottom: '8px' }}>
              <Label style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                👤 Nome de usuário (opcional)
              </Label>
              <SearchInput
                type="text"
                placeholder="Digite seu nome (opcional)..."
                value={chatUserName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setChatUserName(newName);
                  // Salvar no localStorage
                  if (newName.trim()) {
                    localStorage.setItem('chatUserName', newName);
                  } else {
                    localStorage.removeItem('chatUserName');
                  }
                }}
                disabled={!isConnected}
                style={{ width: '100%', marginBottom: 0 }}
              />
            </InputRow>
            <InputWrapper>
              <MessageInput
                ref={inputRef}
                type="text"
                placeholder={isConnected ? "Digite sua mensagem..." : "Aguardando conexão..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!isConnected}
              />
              
              {/* Push-to-Talk Button - apenas para ouvintes (lado direito) */}
              {!isDJ && (
                <>
                  {/* VU Meter mini */}
                  <div style={{
                    width: '6px',
                    height: '45px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    flexShrink: 0
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
                  
                  <PushToTalkButton
                    $active={isPushToTalkActive}
                    onMouseDown={startPushToTalk}
                    onMouseUp={stopPushToTalk}
                    onMouseLeave={stopPushToTalk}
                    onTouchStart={startPushToTalk}
                    onTouchEnd={stopPushToTalk}
                    onTouchCancel={stopPushToTalk}
                    title="Segure para falar"
                  >
                    🎤
                  </PushToTalkButton>
                </>
              )}
              
              <SendButton type="submit" $disabled={!inputValue.trim() || !isConnected}>
                <span>➤</span> Enviar
              </SendButton>
            </InputWrapper>
            
            {/* Último comando de voz */}
            {!isDJ && lastVoiceCommand && (
              <VoiceCommandDisplay>
                🗣️ "{lastVoiceCommand}"
              </VoiceCommandDisplay>
            )}
          </form>
        </InputContainer>
      )}
    </Container>
  );
};

export default ChatPanel;
