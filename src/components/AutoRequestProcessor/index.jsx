import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { pulse, slideIn } from '../../styles/animations';

// Animações customizadas
const glowPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5),
                0 0 20px rgba(0, 255, 255, 0.3),
                0 0 30px rgba(0, 255, 255, 0.1);
  }
  50% { 
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8),
                0 0 40px rgba(0, 255, 255, 0.5),
                0 0 60px rgba(0, 255, 255, 0.3);
  }
`;

const scanLine = keyframes`
  0% { transform: translateY(-100%); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(200%); opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const numberRoll = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const ConnectedIndicator = styled.span`
  color: #00ff00;
  font-size: 0.65rem;
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  text-shadow: 0 0 8px rgba(0, 255, 0, 0.8);
  animation: ${pulse} 2s ease-in-out infinite;
`;

const DisconnectedIndicator = styled.span`
  color: #ff4444;
  font-size: 0.65rem;
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.8);
`;

const StandbyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 16px;
  animation: ${pulse} 2s ease-in-out infinite;
  filter: drop-shadow(0 0 10px rgba(0, 204, 204, 0.8));
`;

const Container = styled.div`
  background: 
    linear-gradient(180deg, rgba(0, 0, 0, 0.98) 0%, rgba(5, 15, 25, 0.99) 50%, rgba(0, 0, 0, 0.98) 100%),
    repeating-linear-gradient(
      0deg,
      rgba(0, 200, 255, 0.04) 0px,
      rgba(0, 200, 255, 0.04) 1px,
      transparent 1px,
      transparent 2px
    ),
    radial-gradient(circle at 50% 50%, rgba(0, 255, 255, 0.03) 0%, transparent 70%);
  border: 3px solid #00c8ff;
  border-radius: 4px;
  padding: 16px;
  margin-top: 0;
  height: 300%;
  min-height: 300%;
  display: flex;
  flex-direction: column;
  box-shadow: 
    0 0 40px rgba(0, 200, 255, 0.6),
    0 0 80px rgba(0, 200, 255, 0.3),
    inset 0 0 50px rgba(0, 200, 255, 0.15),
    inset 0 0 20px rgba(0, 200, 255, 0.25);
  position: relative;
  overflow: hidden;
  animation: ${glowPulse} 3s ease-in-out infinite;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      180deg,
      rgba(0, 200, 255, 0.08) 0%,
      transparent 50%,
      rgba(0, 200, 255, 0.08) 100%
    );
    pointer-events: none;
    z-index: 0;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(0, 255, 255, 0.8) 50%,
      transparent 100%
    );
    animation: ${scanLine} 3s linear infinite;
    pointer-events: none;
    z-index: 2;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  box-shadow: 0 1px 0 rgba(0, 255, 255, 0.1);
  position: relative;
  z-index: 1;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #00ffff;
  font-weight: 900;
  font-size: 0.9rem;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  text-shadow: 
    0 0 15px rgba(0, 255, 255, 1),
    0 0 30px rgba(0, 255, 255, 0.6),
    0 0 45px rgba(0, 255, 255, 0.3);
  position: relative;
  z-index: 1;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  box-shadow: 
    inset 0 0 20px rgba(0, 255, 255, 0.1),
    0 0 15px rgba(0, 255, 255, 0.2);
  
  span {
    font-size: 1.3rem;
    filter: drop-shadow(0 0 10px rgba(0, 255, 255, 1));
    animation: ${pulse} 2s ease-in-out infinite;
  }
  
  &::before {
    content: '▶';
    color: rgba(0, 255, 255, 0.5);
    font-size: 0.7rem;
    margin-right: -8px;
    animation: ${pulse} 1.5s ease-in-out infinite;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleLabel = styled.span`
  color: ${props => props.$active ? '#00ff00' : '#ff4444'};
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: 'Courier New', 'Consolas', monospace;
  text-shadow: ${props => props.$active 
    ? '0 0 10px rgba(0, 255, 0, 0.8)' 
    : '0 0 10px rgba(255, 68, 68, 0.8)'};
  position: relative;
  z-index: 1;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 70px;
  height: 34px;
  cursor: pointer;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
  
  &:checked + .slider {
    background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
    box-shadow: 
      0 0 25px rgba(0, 255, 0, 0.8),
      0 0 50px rgba(0, 255, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    border: 1px solid rgba(0, 255, 0, 0.6);
  }
  
  &:checked + .slider:before {
    transform: translateX(36px);
    background: linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%);
    box-shadow: 
      0 0 15px rgba(255, 255, 255, 0.8),
      0 2px 8px rgba(0, 0, 0, 0.4);
  }
  
  &:focus + .slider {
    box-shadow: 0 0 1px rgba(0, 255, 0, 0.5);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
  border: 1px solid rgba(100, 116, 139, 0.5);
  box-shadow: 
    0 2px 10px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(0, 0, 0, 0.3);
  
  &:before {
    position: absolute;
    content: "";
    height: 28px;
    width: 28px;
    left: 3px;
    bottom: 2px;
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 50%;
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
`;

const StatusContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 16px;
  padding: 16px;
  background: 
    linear-gradient(180deg, rgba(0, 20, 40, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 98%,
      rgba(0, 255, 255, 0.15) 99%,
      rgba(0, 255, 255, 0.15) 100%
    );
  border: 2px solid rgba(0, 255, 255, 0.4);
  border-radius: 4px;
  box-shadow: 
    inset 0 0 30px rgba(0, 200, 255, 0.25),
    0 0 20px rgba(0, 200, 255, 0.15),
    inset 0 2px 4px rgba(0, 255, 255, 0.1);
  position: relative;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.6), transparent);
  }
`;

const StatusRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 4px;
  position: relative;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease;
  
  &:hover {
    background: rgba(0, 255, 255, 0.05);
    border-color: rgba(0, 255, 255, 0.4);
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
    transform: translateY(-2px);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
  }
`;

const StatusLabel = styled.span`
  color: #00cccc;
  font-weight: 700;
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 0.7rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  text-shadow: 0 0 8px rgba(0, 204, 204, 0.6);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &::before {
    content: '●';
    font-size: 0.5rem;
    color: rgba(0, 204, 204, 0.8);
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const StatusValue = styled.span`
  color: ${props => props.$active ? '#00ff00' : '#ff4444'};
  font-weight: 900;
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 2rem;
  letter-spacing: 3px;
  text-shadow: 
    ${props => props.$active 
      ? '0 0 15px rgba(0, 255, 0, 1), 0 0 30px rgba(0, 255, 0, 0.6), 0 0 45px rgba(0, 255, 0, 0.3)' 
      : '0 0 15px rgba(255, 68, 68, 1), 0 0 30px rgba(255, 68, 68, 0.6), 0 0 45px rgba(255, 68, 68, 0.3)'};
  animation: ${numberRoll} 0.5s ease;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 2px;
    background: ${props => props.$active 
      ? 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.8), transparent)' 
      : 'linear-gradient(90deg, transparent, rgba(255, 68, 68, 0.8), transparent)'};
    box-shadow: ${props => props.$active 
      ? '0 0 10px rgba(0, 255, 0, 0.6)' 
      : '0 0 10px rgba(255, 68, 68, 0.6)'};
  }
`;

const ActivityLog = styled.div`
  margin-top: 16px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px;
  background: 
    linear-gradient(180deg, rgba(0, 10, 20, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%),
    repeating-linear-gradient(
      0deg,
      rgba(0, 255, 255, 0.03) 0px,
      rgba(0, 255, 255, 0.03) 1px,
      transparent 1px,
      transparent 3px
    );
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  font-size: 0.72rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 
    inset 0 0 40px rgba(0, 200, 255, 0.2),
    0 0 15px rgba(0, 200, 255, 0.15),
    inset 0 2px 4px rgba(0, 255, 255, 0.1);
  position: relative;
  z-index: 1;
  
  &::before {
    content: 'SYSTEM LOG';
    position: absolute;
    top: -12px;
    left: 12px;
    font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
    font-size: 0.6rem;
    color: rgba(0, 255, 255, 0.6);
    letter-spacing: 2px;
    text-transform: uppercase;
    background: rgba(0, 0, 0, 0.9);
    padding: 2px 8px;
    border: 1px solid rgba(0, 255, 255, 0.3);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar {
    width: 10px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.9);
    border-left: 2px solid rgba(0, 255, 255, 0.3);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #00ffff, #00cccc, #00ffff);
    border-radius: 4px;
    box-shadow: 
      0 0 15px rgba(0, 255, 255, 0.7),
      inset 0 0 5px rgba(0, 255, 255, 0.3);
    
    &:hover {
      background: linear-gradient(180deg, #00ffff, #00ffff);
      box-shadow: 
        0 0 20px rgba(0, 255, 255, 1),
        inset 0 0 8px rgba(0, 255, 255, 0.5);
    }
  }
`;

const LogEntry = styled.div`
  color: ${props => {
    if (props.$type === 'success') return '#00ff00';
    if (props.$type === 'error') return '#ff4444';
    if (props.$type === 'info') return '#00ffff';
    return '#00cccc';
  }};
  padding: 10px 12px;
  border-radius: 4px;
  background: ${props => {
    if (props.$type === 'success') return 'linear-gradient(90deg, rgba(0, 255, 0, 0.05) 0%, rgba(0, 0, 0, 0.5) 100%)';
    if (props.$type === 'error') return 'linear-gradient(90deg, rgba(255, 68, 68, 0.05) 0%, rgba(0, 0, 0, 0.5) 100%)';
    if (props.$type === 'info') return 'linear-gradient(90deg, rgba(0, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.5) 100%)';
    return 'linear-gradient(90deg, rgba(0, 204, 204, 0.05) 0%, rgba(0, 0, 0, 0.5) 100%)';
  }};
  border-left: 3px solid ${props => {
    if (props.$type === 'success') return 'rgba(0, 255, 0, 0.7)';
    if (props.$type === 'error') return 'rgba(255, 68, 68, 0.7)';
    if (props.$type === 'info') return 'rgba(0, 255, 255, 0.7)';
    return 'rgba(0, 204, 204, 0.5)';
  }};
  border-right: 1px solid ${props => {
    if (props.$type === 'success') return 'rgba(0, 255, 0, 0.2)';
    if (props.$type === 'error') return 'rgba(255, 68, 68, 0.2)';
    if (props.$type === 'info') return 'rgba(0, 255, 255, 0.2)';
    return 'rgba(0, 204, 204, 0.2)';
  }};
  font-family: 'Courier New', 'Consolas', 'Monaco', monospace;
  font-size: 0.72rem;
  letter-spacing: 0.8px;
  line-height: 1.5;
  animation: ${slideIn} 0.4s ease, ${fadeIn} 0.4s ease;
  text-shadow: ${props => {
    const color = props.$type === 'success' ? 'rgba(0, 255, 0, 1)' : 
                  props.$type === 'error' ? 'rgba(255, 68, 68, 1)' : 
                  props.$type === 'info' ? 'rgba(0, 255, 255, 1)' : 'rgba(0, 204, 204, 0.7)';
    return `0 0 8px ${color}, 0 0 15px ${color.replace('1)', '0.5)')}`;
  }};
  position: relative;
  transition: all 0.3s ease;
  
  &::before {
    content: '▸';
    position: absolute;
    left: 4px;
    color: ${props => {
      if (props.$type === 'success') return 'rgba(0, 255, 0, 0.6)';
      if (props.$type === 'error') return 'rgba(255, 68, 68, 0.6)';
      if (props.$type === 'info') return 'rgba(0, 255, 255, 0.6)';
      return 'rgba(0, 204, 204, 0.5)';
    }};
    font-size: 0.8rem;
    text-shadow: none;
  }
  
  &:hover {
    background: ${props => {
      if (props.$type === 'success') return 'linear-gradient(90deg, rgba(0, 255, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)';
      if (props.$type === 'error') return 'linear-gradient(90deg, rgba(255, 68, 68, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)';
      if (props.$type === 'info') return 'linear-gradient(90deg, rgba(0, 255, 255, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)';
      return 'linear-gradient(90deg, rgba(0, 204, 204, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%)';
    }};
    border-left-width: 4px;
    transform: translateX(3px);
    box-shadow: ${props => {
      const color = props.$type === 'success' ? 'rgba(0, 255, 0, 0.3)' : 
                    props.$type === 'error' ? 'rgba(255, 68, 68, 0.3)' : 
                    props.$type === 'info' ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 204, 204, 0.3)';
      return `0 0 20px ${color}`;
    }};
  }
`;

const AutoRequestProcessor = ({ 
  tracks = [], 
  requests = [], 
  socket, 
  onAddToQueue, 
  onRejectRequest,
  onDownloadAndAddMusic = null // Callback para adicionar música baixada da internet
}) => {
  const [isActive, setIsActive] = useState(false);
  const [processedRequests, setProcessedRequests] = useState(new Set());
  const [stats, setStats] = useState({
    processed: 0,
    found: 0,
    notFound: 0
  });
  const [activityLog, setActivityLog] = useState([]);
  const requestsRef = useRef(requests);
  const tracksRef = useRef(tracks);
  const processedRequestsRef = useRef(new Set());

  // Atualizar refs
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    processedRequestsRef.current = processedRequests;
  }, [processedRequests]);

  // Função para normalizar strings (remover acentos, caracteres especiais, espaços extras)
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

  // Função para extrair palavras-chave de uma string
  const extractKeywords = useCallback((str) => {
    if (!str) return [];
    const normalized = normalizeString(str);
    return normalized.split(/\s+/).filter(word => word.length > 2); // Palavras com mais de 2 caracteres
  }, [normalizeString]);

  // Função para calcular similaridade entre duas strings
  const calculateSimilarity = useCallback((str1, str2) => {
    if (!str1 || !str2) return 0;
    const s1 = normalizeString(str1);
    const s2 = normalizeString(str2);
    
    // Se são iguais, retorna 100%
    if (s1 === s2) return 100;
    
    // Se uma contém a outra, retorna 80%
    if (s1.includes(s2) || s2.includes(s1)) return 80;
    
    // Contar palavras em comum
    const words1 = extractKeywords(s1);
    const words2 = extractKeywords(s2);
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(w => words2.includes(w));
    const similarity = (commonWords.length / Math.max(words1.length, words2.length)) * 100;
    
    return similarity;
  }, [normalizeString, extractKeywords]);

  // Função para buscar música na biblioteca (melhorada)
  const findTrackInLibrary = useCallback((songTitle, songArtist) => {
    if (!songTitle && !songArtist) return null;
    
    const normalizedTitle = normalizeString(songTitle || '');
    const normalizedArtist = normalizeString(songArtist || '');
    const titleKeywords = extractKeywords(songTitle || '');
    const artistKeywords = extractKeywords(songArtist || '');
    
    // Buscar todas as tracks e calcular pontuação
    const tracksWithScore = tracksRef.current.map(track => {
      const trackTitle = normalizeString(track.title || track.name || track.filename || '');
      const trackArtist = normalizeString(track.artist || '');
      const trackFilename = normalizeString(track.filename || track.name || '');
      
      let score = 0;
      
      // 1. Busca exata (100 pontos)
      if (normalizedTitle && trackTitle === normalizedTitle) score += 100;
      if (normalizedArtist && trackArtist === normalizedArtist) score += 100;
      
      // 2. Busca exata combinada (90 pontos)
      if (normalizedTitle && normalizedArtist) {
        const combined = `${trackTitle} ${trackArtist}`;
        const searchCombined = `${normalizedTitle} ${normalizedArtist}`;
        if (combined === searchCombined) score += 90;
      }
      
      // 3. Título contém termo de busca ou vice-versa (70 pontos)
      if (normalizedTitle) {
        if (trackTitle.includes(normalizedTitle)) score += 70;
        if (normalizedTitle.includes(trackTitle)) score += 70;
      }
      
      // 4. Artista contém termo de busca ou vice-versa (60 pontos)
      if (normalizedArtist && trackArtist) {
        if (trackArtist.includes(normalizedArtist)) score += 60;
        if (normalizedArtist.includes(trackArtist)) score += 60;
      }
      
      // 5. Palavras-chave do título (50 pontos por palavra)
      if (titleKeywords.length > 0) {
        const titleMatches = titleKeywords.filter(kw => trackTitle.includes(kw)).length;
        score += (titleMatches / titleKeywords.length) * 50;
      }
      
      // 6. Palavras-chave do artista (40 pontos por palavra)
      if (artistKeywords.length > 0 && trackArtist) {
        const artistMatches = artistKeywords.filter(kw => trackArtist.includes(kw)).length;
        score += (artistMatches / artistKeywords.length) * 40;
      }
      
      // 7. Busca no filename (30 pontos)
      if (normalizedTitle && trackFilename.includes(normalizedTitle)) score += 30;
      if (normalizedArtist && trackFilename.includes(normalizedArtist)) score += 20;
      
      // 8. Similaridade calculada (até 40 pontos)
      if (normalizedTitle) {
        const titleSim = calculateSimilarity(trackTitle, normalizedTitle);
        score += titleSim * 0.4;
      }
      if (normalizedArtist && trackArtist) {
        const artistSim = calculateSimilarity(trackArtist, normalizedArtist);
        score += artistSim * 0.3;
      }
      
      // 9. Busca combinada (título + artista) (até 50 pontos)
      if (normalizedTitle && normalizedArtist) {
        const combined = `${trackTitle} ${trackArtist}`;
        const searchCombined = `${normalizedTitle} ${normalizedArtist}`;
        if (combined.includes(searchCombined) || searchCombined.includes(combined)) {
          score += 50;
        }
      }
      
      return { track, score };
    });
    
    // Ordenar por pontuação e retornar a melhor match
    tracksWithScore.sort((a, b) => b.score - a.score);
    
    // Retornar a track com pontuação maior que 30 (threshold mínimo)
    const bestMatch = tracksWithScore[0];
    if (bestMatch && bestMatch.score >= 30) {
      console.log(`🎯 Música encontrada com pontuação ${bestMatch.score.toFixed(1)}:`, {
        pedido: { título: songTitle, artista: songArtist },
        encontrada: { título: bestMatch.track.title || bestMatch.track.name, artista: bestMatch.track.artist }
      });
      return bestMatch.track;
    }
    
    console.log('❌ Nenhuma música encontrada. Melhor pontuação:', tracksWithScore[0]?.score?.toFixed(1) || 0);
    return null;
  }, [normalizeString, extractKeywords, calculateSimilarity]);

  // Processar pedidos automaticamente
  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (!socket) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    console.log('AutoRequestProcessor: Ativo, aguardando pedidos...', {
      totalRequests: requests.length,
      totalTracks: tracksRef.current.length
    });

    const processRequests = () => {
      if (!isActive) return;

      const pendingRequests = requestsRef.current.filter(req => 
        req && 
        !req.accepted && 
        !req.rejected && 
        !processedRequestsRef.current.has(req.id)
      );

      if (pendingRequests.length === 0) {
        return;
      }

      console.log('AutoRequestProcessor: Processando', pendingRequests.length, 'pedidos pendentes');

      pendingRequests.forEach(async (request) => {
        console.log('🔍 Processando pedido automaticamente:', request);
        
        // Marcar como processado
        setProcessedRequests(prev => new Set([...prev, request.id]));
        setStats(prev => ({ ...prev, processed: prev.processed + 1 }));

        // Buscar na biblioteca
        const foundTrack = findTrackInLibrary(request.song, request.artist);

        if (foundTrack) {
          // Música encontrada - adicionar à fila
          console.log('✅ Música encontrada:', foundTrack.title || foundTrack.filename);
          
          if (onAddToQueue) {
            // Passar o requestId junto com a track para mapeamento
            onAddToQueue(foundTrack, request.id);
          }

          // Aceitar o pedido
          if (socket && socket.connected) {
            socket.emit('chat:request:accept', request.id);
          }

          setStats(prev => ({ ...prev, found: prev.found + 1 }));
          setActivityLog(prev => [
            {
              id: Date.now(),
              message: `✅ ${request.song}${request.artist ? ` - ${request.artist}` : ''} adicionada`,
              type: 'success',
              time: new Date().toLocaleTimeString('pt-BR')
            },
            ...prev.slice(0, 9) // Manter apenas últimas 10 entradas
          ]);
        } else {
          // Música não encontrada - tentar buscar na internet
          console.log('❌ Música não encontrada na biblioteca:', request.song);
          console.log('🌐 Tentando buscar na internet...');
          
          // Tentar buscar e baixar da internet se a função estiver disponível
          if (onDownloadAndAddMusic) {
            try {
              setActivityLog(prev => [
                {
                  id: Date.now(),
                  message: `🌐 Buscando ${request.song}${request.artist ? ` - ${request.artist}` : ''} na internet...`,
                  type: 'info',
                  time: new Date().toLocaleTimeString('pt-BR')
                },
                ...prev.slice(0, 9)
              ]);
              
              // Chamar função para buscar e baixar da internet
              const downloadResult = await onDownloadAndAddMusic(request.song, request.artist, request.id);
              
              if (downloadResult && downloadResult.success) {
                console.log('✅ Música baixada da internet com sucesso:', downloadResult.track);
                
                // Aceitar o pedido
                if (socket && socket.connected) {
                  socket.emit('chat:request:accept', request.id);
                }
                
                setStats(prev => ({ ...prev, found: prev.found + 1 }));
                setActivityLog(prev => [
                  {
                    id: Date.now(),
                    message: `✅ ${request.song}${request.artist ? ` - ${request.artist}` : ''} baixada da internet`,
                    type: 'success',
                    time: new Date().toLocaleTimeString('pt-BR')
                  },
                  ...prev.slice(0, 9)
                ]);
                
                return; // Sucesso - não rejeitar
              } else {
                console.log('❌ Não foi possível baixar da internet:', downloadResult?.message || 'Erro desconhecido');
              }
            } catch (downloadError) {
              console.error('❌ Erro ao tentar baixar da internet:', downloadError);
            }
          }
          
          // Se não conseguiu baixar da internet, rejeitar pedido
          console.log('❌ Música não encontrada e não foi possível baixar:', request.song);
          
          if (socket && socket.connected) {
            socket.emit('chat:request:reject', request.id);
          }

          if (onRejectRequest) {
            onRejectRequest(request.id);
          }

          setStats(prev => ({ ...prev, notFound: prev.notFound + 1 }));
          setActivityLog(prev => [
            {
              id: Date.now(),
              message: `❌ ${request.song}${request.artist ? ` - ${request.artist}` : ''} não encontrada`,
              type: 'error',
              time: new Date().toLocaleTimeString('pt-BR')
            },
            ...prev.slice(0, 9)
          ]);
        }
      });
    };

    // Processar imediatamente
    processRequests();

    // Verificar novos pedidos a cada 2 segundos
    const interval = setInterval(processRequests, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, socket, findTrackInLibrary, onAddToQueue, onRejectRequest, onDownloadAndAddMusic]);

  // Resetar estatísticas quando desativar
  useEffect(() => {
    if (!isActive) {
      setProcessedRequests(new Set());
      setStats({ processed: 0, found: 0, notFound: 0 });
      setActivityLog([]);
    }
  }, [isActive]);

  // Calcular taxa de sucesso
  const successRate = stats.processed > 0 
    ? Math.round((stats.found / stats.processed) * 100) 
    : 0;
  
  // Verificar se socket está conectado
  const isConnected = socket && socket.connected;

  return (
    <Container>
      <Header>
        <Title>
          <span>🤖</span> Sistema de Busca Automática
        </Title>
        <ToggleContainer>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isConnected ? (
              <ConnectedIndicator>● CONECTADO</ConnectedIndicator>
            ) : (
              <DisconnectedIndicator>● DESCONECTADO</DisconnectedIndicator>
            )}
            <ToggleLabel $active={isActive}>{isActive ? '[ONLINE]' : '[OFFLINE]'}</ToggleLabel>
          </div>
          <Switch onClick={(e) => {
            e.preventDefault();
            const newValue = !isActive;
            console.log('AutoRequestProcessor: Toggle clicado, alterando para:', newValue);
            setIsActive(newValue);
          }}>
            <SwitchInput
              type="checkbox"
              checked={isActive}
              onChange={(e) => {
                e.stopPropagation();
                const newValue = e.target.checked;
                console.log('AutoRequestProcessor: Toggle alterado para:', newValue);
                setIsActive(newValue);
              }}
            />
            <SwitchSlider className="slider" />
          </Switch>
        </ToggleContainer>
      </Header>

      {isActive && (
        <>
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '4px',
            fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
            fontSize: '0.7rem',
            color: '#00cccc',
            letterSpacing: '1px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 1
          }}>
            <span>📚 Biblioteca: <span style={{color: '#00ffff', fontWeight: 900}}>{tracksRef.current.length}</span> músicas</span>
            {stats.processed > 0 && (
              <span style={{
                color: successRate >= 70 ? '#00ff00' : successRate >= 40 ? '#ffff00' : '#ff4444',
                fontWeight: 900,
                textShadow: successRate >= 70 
                  ? '0 0 10px rgba(0, 255, 0, 0.8)' 
                  : successRate >= 40 
                  ? '0 0 10px rgba(255, 255, 0, 0.8)' 
                  : '0 0 10px rgba(255, 68, 68, 0.8)'
              }}>
                Taxa de Sucesso: {successRate}%
              </span>
            )}
          </div>

          <StatusContainer>
            <StatusRow>
              <StatusLabel>📊 Processados</StatusLabel>
              <StatusValue $active={true}>{stats.processed}</StatusValue>
            </StatusRow>
            <StatusRow>
              <StatusLabel>✅ Encontradas</StatusLabel>
              <StatusValue $active={true}>{stats.found}</StatusValue>
            </StatusRow>
            <StatusRow>
              <StatusLabel>❌ Não Encontradas</StatusLabel>
              <StatusValue $active={false}>{stats.notFound}</StatusValue>
            </StatusRow>
          </StatusContainer>

          {activityLog.length > 0 && (
            <ActivityLog>
              {activityLog.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'rgba(0, 204, 204, 0.5)',
                  fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
                  fontSize: '0.7rem',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>
                  [Aguardando atividade...]
                </div>
              ) : (
                activityLog.map(log => (
                  <LogEntry key={log.id} $type={log.type}>
                    <span style={{ 
                      color: '#00aaaa', 
                      marginRight: '12px',
                      marginLeft: '12px',
                      fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
                      fontSize: '0.65rem',
                      textShadow: '0 0 8px rgba(0, 170, 170, 0.7)',
                      fontWeight: 700
                    }}>[{log.time}]</span>
                    {log.message}
                  </LogEntry>
                ))
              )}
            </ActivityLog>
          )}
        </>
      )}

      {!isActive && (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: '#00cccc',
          fontSize: '0.85rem',
          fontFamily: "'Courier New', 'Consolas', 'Monaco', monospace",
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: '0 0 15px rgba(0, 204, 204, 0.7), 0 0 30px rgba(0, 204, 204, 0.4)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(0, 200, 255, 0.05) 0%, transparent 70%)',
          border: '2px dashed rgba(0, 255, 255, 0.2)',
          borderRadius: '4px',
          margin: '16px 0',
          position: 'relative',
          zIndex: 1
        }}>
          <StandbyIcon>⚙</StandbyIcon>
          <div style={{
            marginBottom: '12px',
            fontWeight: 900,
            letterSpacing: '3px'
          }}>[SYSTEM STANDBY]</div>
          <div style={{
            fontSize: '0.65rem',
            color: '#00aaaa',
            letterSpacing: '1.5px',
            fontWeight: 600,
            opacity: 0.8
          }}>
            Aguardando ativação do sistema...
          </div>
          <div style={{
            fontSize: '0.6rem',
            color: '#006666',
            marginTop: '16px',
            letterSpacing: '1px',
            fontStyle: 'italic'
          }}>
            Sistema pronto para processar pedidos automaticamente
          </div>
        </div>
      )}
    </Container>
  );
};

export default AutoRequestProcessor;

