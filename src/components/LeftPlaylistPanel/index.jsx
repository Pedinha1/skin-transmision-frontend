import React, { useState, useRef, useCallback, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { pulse } from '../../styles/animations';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PanelContainer = styled.div`
  width: 280px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(15px);
  border-right: 1px solid rgba(6, 182, 212, 0.3);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  flex-shrink: 0;
  box-shadow: 
    10px 0 40px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(6, 182, 212, 0.08),
    inset -1px 0 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  position: relative;
`;

const PlaylistHeader = styled.div`
  padding: 1.2rem;
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

const HeaderTitle = styled.div`
  color: #f1f5f9;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  
  span {
    font-size: 1.2rem;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 8px rgba(6, 182, 212, 0.5));
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const IconButton = styled.button`
  background: ${props => props.$primary 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: ${props => props.$primary 
    ? '1px solid rgba(6, 182, 212, 0.5)'
    : '1px solid rgba(6, 182, 212, 0.3)'
  };
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$primary 
    ? '0 4px 15px rgba(6, 182, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s;
  }

  &:hover {
    box-shadow: ${props => props.$primary 
      ? '0 6px 25px rgba(6, 182, 212, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 20px rgba(6, 182, 212, 0.4)'
      : '0 4px 15px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    };
    border-color: #22d3ee;
    
    &::before {
      left: 100%;
    }
  }

  &:active {
    transform: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

// Área de Upload Profissional
const UploadSection = styled.div`
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
`;

const UploadArea = styled.div`
  border: 1px dashed ${props => props.$isDragging 
    ? 'rgba(6, 182, 212, 0.8)' 
    : 'rgba(6, 182, 212, 0.3)'
  };
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$isDragging 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%)'
    : 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(30, 41, 59, 0.4) 100%)'
  };
  position: relative;
  overflow: hidden;
  animation: ${props => props.$isDragging ? pulse : 'none'} 1.5s infinite;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.$isDragging 
      ? 'radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, transparent 70%)'
      : 'none'
    };
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(6, 182, 212, 0.6);
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.2);
  }
`;

const UploadIcon = styled.div`
  font-size: 1.2rem;
  margin-bottom: 4px;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.5));
`;

const UploadText = styled.div`
  color: #cbd5e1;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 2px;
  letter-spacing: 0.3px;
  line-height: 1.2;
`;

const UploadSubtext = styled.div`
  color: #64748b;
  font-size: 0.6rem;
  margin-top: 2px;
  line-height: 1.2;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const QuickButton = styled.button`
  flex: 1;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #22d3ee;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
    border-color: #22d3ee;
    color: #67e8f9;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
  }
`;

// Modal de Criar Playlist
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(5px);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: ${fadeIn} 0.3s ease;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(6, 182, 212, 0.4);
  border-radius: 16px;
  padding: 2rem;
  width: 90%;
  max-width: 450px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.9),
    0 0 40px rgba(6, 182, 212, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: ${fadeIn} 0.3s ease;
`;

const ModalTitle = styled.h3`
  color: #f1f5f9;
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0 0 1.5rem 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ModalInput = styled.input`
  width: 100%;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 2px solid rgba(6, 182, 212, 0.4);
  border-radius: 10px;
  padding: 14px 16px;
  color: #f1f5f9;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);

  &::placeholder {
    color: #64748b;
  }

  &:focus {
    border-color: #22d3ee;
    box-shadow: 
      0 0 0 4px rgba(6, 182, 212, 0.2),
      inset 0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(6, 182, 212, 0.2);
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const ModalButton = styled.button`
  flex: 1;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(6, 182, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(6, 182, 212, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }
  ` : `
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
    color: #94a3b8;
    border: 1px solid rgba(6, 182, 212, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
      color: #cbd5e1;
      border-color: rgba(6, 182, 212, 0.5);
    }
  `}
`;

const ControlsSection = styled.div`
  padding: 1.2rem;
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.6) 0%, rgba(30, 41, 59, 0.6) 100%);
`;

const SearchBar = styled.input`
  width: 100%;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
  border: 2px solid rgba(6, 182, 212, 0.4);
  padding: 12px 16px;
  border-radius: 10px;
  color: #fff;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
  
  &::placeholder {
    color: #64748b;
  }
  
  &:focus {
    border-color: #22d3ee;
    box-shadow: 
      0 0 0 3px rgba(6, 182, 212, 0.2),
      inset 0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(6, 182, 212, 0.1);
  }
`;

const StatsBadge = styled.div`
  margin-top: 12px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
  border-radius: 10px;
  text-align: center;
  border: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.1);
`;

const StatsText = styled.div`
  font-size: 0.8rem;
  color: #22d3ee;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const StatsNumber = styled.span`
  font-size: 1.1rem;
  color: #fbbf24;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  margin-left: 6px;
  text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
`;

const MusicListContainer = styled.div`
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 200px;
  height: 100%;
  padding: 0;
  position: relative;
  
  /* Barra de rolagem sempre visível e estilizada */
  &::-webkit-scrollbar {
    width: 12px;
  }
  &::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 6px;
    margin: 8px 4px;
    border: 1px solid rgba(6, 182, 212, 0.2);
  }
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #06b6d4, #22d3ee);
    border-radius: 6px;
    border: 2px solid rgba(15, 23, 42, 0.5);
    box-shadow: 
      0 2px 8px rgba(6, 182, 212, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transition: all 0.3s ease;
    min-height: 40px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #22d3ee, #67e8f9);
    box-shadow: 
      0 4px 15px rgba(6, 182, 212, 0.7),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(6, 182, 212, 0.6);
  }
  &::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, #0891b2, #06b6d4);
  }
  
  /* Para Firefox */
  scrollbar-width: thin;
  scrollbar-color: #06b6d4 rgba(15, 23, 42, 0.8);
`;

const MusicItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 1.2rem;
  min-height: 60px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.1);
  cursor: pointer;
  background: ${props => props.$active 
    ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%)' 
    : 'transparent'
  };
  border-left: 3px solid ${props => props.$active 
    ? '#06b6d4' 
    : 'transparent'
  };
  user-select: none;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: ${props => props.$active 
    ? '0 2px 8px rgba(6, 182, 212, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
    : 'none'
  };

  &:hover {
    background: ${props => props.$active 
      ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.25) 0%, rgba(34, 211, 238, 0.15) 100%)'
      : 'linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%)'
    };
    border-left-color: ${props => props.$active ? '#22d3ee' : '#06b6d4'};
    box-shadow: ${props => props.$active 
      ? '0 4px 12px rgba(6, 182, 212, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.08)' 
      : '0 2px 6px rgba(6, 182, 212, 0.15)'
    };
    transform: translateX(3px);
  }

  &:active {
    transform: translateX(0);
  }
`;

const MusicInfo = styled.div`
  display: flex;
  flex-direction: column;
  overflow: visible;
  flex: 1;
  gap: 4px;
  min-width: 0;
`;

const MusicTitle = styled.span`
  color: ${props => props.$active ? '#f1f5f9' : '#cbd5e1'};
  font-size: 0.8rem;
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: hidden;
  font-weight: ${props => props.$active ? '700' : '500'};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
`;

const MusicMeta = styled.span`
  color: #64748b;
  font-size: 0.65rem;
  font-weight: 500;
`;

const PlayIcon = styled.span`
  color: ${props => props.$active ? '#22d3ee' : '#64748b'};
  font-size: 1rem;
  margin-right: 10px;
  transition: all 0.2s;
  text-shadow: ${props => props.$active ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none'};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #475569;
  text-align: center;
  padding: 2rem;
`;

// Notificação de Sucesso
const Notification = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%);
  backdrop-filter: blur(20px);
  border: 2px solid rgba(6, 182, 212, 0.5);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.8),
    0 0 30px rgba(6, 182, 212, 0.3);
  z-index: 10001;
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  gap: 12px;
  animation: ${fadeIn} 0.3s ease;
  min-width: 250px;
`;

const NotificationIcon = styled.div`
  font-size: 1.5rem;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NotificationText = styled.div`
  color: #f1f5f9;
  font-weight: 600;
  font-size: 0.9rem;
  flex: 1;
`;

const NotificationCount = styled.span`
  color: #fbbf24;
  font-weight: 900;
  font-family: 'Courier New', monospace;
  margin-left: 6px;
`;

// Indicador de Carregamento
const LoadingIndicator = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, 
    transparent,
    rgba(6, 182, 212, 0.5),
    rgba(34, 211, 238, 0.8),
    rgba(6, 182, 212, 0.5),
    transparent
  );
  background-size: 200% 100%;
  animation: ${props => props.$loading ? 'loading 1.5s linear infinite' : 'none'};
  z-index: 1000;
  
  @keyframes loading {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// Barra de Progresso
const ProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  width: ${props => props.$progress || 0}%;
  background: linear-gradient(90deg, #06b6d4, #22d3ee, #67e8f9);
  transition: width 0.3s ease;
  z-index: 1001;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
`;

// Status de Carregamento
const LoadingStatus = styled.div`
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 1002;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  display: ${props => props.$show ? 'block' : 'none'};
  max-width: 90%;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LeftPlaylistPanel = ({ 
  playlists, 
  onCreatePlaylist, 
  onAddMusic,
  tracks,
  currentTrackId,
  onPlay,
  onDeepCleanup
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const filteredTracks = tracks.filter(t => {
    // Sempre mostrar todas as músicas (sem filtro de playlist)
    const matchesSearch = searchTerm === '' || t.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Debug: log para verificar se as músicas estão sendo filtradas corretamente
  useEffect(() => {
    console.log('LeftPlaylistPanel - Total de tracks:', tracks.length);
    console.log('LeftPlaylistPanel - Tracks filtradas:', filteredTracks.length);
    console.log('LeftPlaylistPanel - searchTerm:', searchTerm);
  }, [tracks.length, filteredTracks.length, searchTerm]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFilesFromItems = useCallback(async (items) => {
    const audioFiles = [];
    const validExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'];
    
    const processItem = async (item) => {
      if (item.kind === 'file') {
        return new Promise((resolve) => {
          const file = item.getAsFile();
          if (file) {
            const ext = file.name.toLowerCase().split('.').pop();
            if (validExtensions.includes(ext)) {
              audioFiles.push(file);
            }
            resolve();
          } else {
            resolve();
          }
        });
      } else if (item.kind === 'directory') {
        // Para diretórios, usar a File System Access API se disponível
        try {
          if (item.getAsFileSystemHandle) {
            const dirHandle = await item.getAsFileSystemHandle();
            if (dirHandle && dirHandle.kind === 'directory') {
              await processDirectory(dirHandle);
            }
          }
        } catch (err) {
          // Se a API não estiver disponível, ignorar silenciosamente
          // O navegador já fornece os arquivos recursivamente em dataTransfer.files
        }
      }
    };

    const processDirectory = async (dirHandle) => {
      try {
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            const ext = file.name.toLowerCase().split('.').pop();
            if (validExtensions.includes(ext)) {
              audioFiles.push(file);
            }
          } else if (entry.kind === 'directory') {
            await processDirectory(entry);
          }
        }
      } catch (err) {
        console.warn('Erro ao processar diretório:', err);
      }
    };

    // Processar todos os itens
    for (const item of items) {
      await processItem(item);
    }

    return audioFiles;
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!onAddMusic) return;

    setIsLoading(true);

    try {
      let audioFiles = [];

      // Quando uma pasta é arrastada, o navegador já fornece todos os arquivos recursivamente
      // em dataTransfer.files. Vamos processar isso primeiro.
      const allFiles = Array.from(e.dataTransfer.files);
      
      // Filtrar apenas arquivos de áudio válidos
      audioFiles = allFiles.filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'].includes(ext);
      });

      // Se não encontrou arquivos em files, tentar processar items (para suporte a File System Access API)
      if (audioFiles.length === 0 && e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const items = Array.from(e.dataTransfer.items);
        audioFiles = await processFilesFromItems(items);
      }

      if (audioFiles.length > 0) {
        // Criar um objeto FileList simulado usando DataTransfer
        const dataTransfer = new DataTransfer();
        audioFiles.forEach(file => {
          try {
            dataTransfer.items.add(file);
          } catch (err) {
            // Se DataTransfer não suportar, usar abordagem alternativa
            console.warn('Erro ao adicionar arquivo ao DataTransfer:', err);
          }
        });
        
        const event = { 
          target: { 
            files: dataTransfer.files.length > 0 ? dataTransfer.files : audioFiles 
          } 
        };
        
        setTimeout(() => {
          onAddMusic(event);
          setIsLoading(false);
          setNotificationCount(audioFiles.length);
          setShowNotification(true);
          
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        }, 500);
      } else {
        setIsLoading(false);
        alert('Nenhum arquivo de áudio válido encontrado! Verifique se a pasta contém arquivos de áudio (MP3, WAV, OGG, etc).');
      }
    } catch (error) {
      console.error('Erro ao processar arquivos arrastados:', error);
      setIsLoading(false);
      alert('Erro ao processar arquivos. Tente usar o botão 📁 Pasta para selecionar a pasta inteira.');
    }
  }, [onAddMusic, processFilesFromItems]);

  // Função para processar diretório recursivamente usando File System Access API (OTIMIZADA)
  const processDirectoryRecursive = async (dirHandle, audioFiles = [], processedCount = { count: 0, dirs: 0 }, maxFiles = 10000, currentPath = '') => {
    try {
      processedCount.dirs++;
      
      // Cache de extensões válidas para validação rápida
      const validExts = new Set(['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus']);
      
      // Processar em lotes para não bloquear a UI
      const BATCH_SIZE = 50; // Processar 50 arquivos antes de dar respiro à UI
      let batchCount = 0;
      let lastUpdateTime = Date.now();
      const UPDATE_INTERVAL = 200; // Atualizar UI a cada 200ms no máximo
      
      // Tentar ler as entradas do diretório com tratamento robusto de erros
      let entries = [];
      try {
        for await (const entry of dirHandle.values()) {
          if (entry) {
            entries.push(entry);
          }
        }
      } catch (readError) {
        // Se o diretório não puder ser lido (deletado, movido, sem permissão), retornar silenciosamente
        // Não mostrar warning para cada diretório inacessível - apenas continuar
        return audioFiles;
      }
      
      // Processar arquivos primeiro (mais rápido)
      const fileEntries = entries.filter(e => e && e.kind === 'file');
      const dirEntries = entries.filter(e => e && e.kind === 'directory');
      
      // Processar arquivos em lotes
      for (let i = 0; i < fileEntries.length; i++) {
        if (audioFiles.length >= maxFiles) {
          setLoadingStatus(`Limite atingido: ${maxFiles} arquivos processados`);
          break;
        }
        
        const entry = fileEntries[i];
        if (!entry) continue;
        
        try {
          // Validar extensão ANTES de chamar getFile() (muito mais rápido)
          const fileName = entry.name || '';
          const ext = fileName.toLowerCase().split('.').pop();
          
          if (!validExts.has(ext)) {
            continue; // Pular arquivos não-audio sem processar
          }
          
          try {
            const file = await entry.getFile();
            
            if (file && file.name && file instanceof File) {
              audioFiles.push(file);
              processedCount.count++;
              batchCount++;
              
              // Atualizar UI apenas periodicamente para não bloquear
              const now = Date.now();
              if (now - lastUpdateTime >= UPDATE_INTERVAL || batchCount >= BATCH_SIZE) {
                const progress = Math.min(95, 5 + (processedCount.count / maxFiles) * 90);
                setLoadingProgress(progress);
                setLoadingStatus(`${processedCount.count} músicas | ${processedCount.dirs} pastas`);
                lastUpdateTime = now;
                batchCount = 0;
                
                // Dar respiro à UI a cada lote
                if (i % BATCH_SIZE === 0) {
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
              }
            }
          } catch (fileError) {
            // Ignorar silenciosamente arquivos que não podem ser lidos
            // (deletados, movidos, sem permissão, etc.)
            // Continuar processando outros arquivos
            continue;
          }
        } catch (entryError) {
          // Ignorar silenciosamente erros de entrada individual
          // (arquivo deletado, movido, sem permissão, etc.)
          // Continuar processando outros arquivos
          continue;
        }
      }
      
      // Processar diretórios em paralelo (mais rápido) com tratamento robusto
      const dirPromises = dirEntries.map(async (entry) => {
        if (!entry) return;
        
        try {
          const dirName = entry.name;
          const newPath = currentPath ? `${currentPath}/${dirName}` : dirName;
          
          // Processar diretório recursivamente
          // Se houver erro (diretório deletado, movido, sem permissão), simplesmente pular
          await processDirectoryRecursive(entry, audioFiles, processedCount, maxFiles, newPath).catch(() => {
            // Ignorar silenciosamente erros ao processar subdiretórios
            // Continuar processando outros diretórios
          });
        } catch (dirError) {
          // Ignorar silenciosamente erros ao processar diretórios
          // (deletados, movidos, sem permissão, etc.)
          // Continuar processando outros diretórios
        }
      });
      
      // Aguardar todos os diretórios serem processados (com tratamento de erros)
      await Promise.allSettled(dirPromises);
      
    } catch (error) {
      // Ignorar silenciosamente erros ao processar diretórios
      // (não encontrado, sem permissão, etc.)
      // Retornar os arquivos já processados
    }
    return audioFiles;
  };

  // Função para acessar pastas de mídia local
  const handleAccessRootDrive = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert('Seu navegador não suporta acesso ao sistema de arquivos.\n\nUse Chrome, Edge ou outro navegador compatível para acessar pastas de mídia local.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingStatus('Aguardando seleção da pasta de mídia...');
      
      // Solicitar acesso ao diretório - permite navegar até qualquer pasta do sistema
      // Tenta abrir em locais comuns de mídia primeiro (se suportado pelo navegador)
      const dirHandle = await window.showDirectoryPicker({
        mode: 'read',
        // Tentar abrir em pastas comuns de mídia (suportado em alguns navegadores)
        startIn: 'music' // Tenta abrir na pasta de Música do usuário
      }).catch(() => {
        // Se 'music' não funcionar, tentar sem startIn para permitir navegação completa
        return window.showDirectoryPicker({
          mode: 'read'
        });
      });
      
      // Obter nome da pasta selecionada para feedback
      const folderName = dirHandle.name || 'pasta selecionada';
      setLoadingStatus(`Lendo pasta: ${folderName}...`);
      setLoadingProgress(5);
      
      // Processar recursivamente (limite de 10000 arquivos para evitar travamento)
      // Usar processamento otimizado em lotes
      const processedCount = { count: 0, dirs: 0 };
      const startTime = Date.now();
      
      const audioFiles = await processDirectoryRecursive(dirHandle, [], processedCount, 10000, folderName);
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Processamento concluído em ${elapsedTime}s: ${audioFiles.length} arquivos de ${processedCount.dirs} pastas`);
      
      setLoadingProgress(98);
      setLoadingStatus(`Encontrados ${audioFiles.length} arquivos de áudio`);
      
      if (audioFiles.length > 0) {
        console.log('✅ Arquivos processados:', audioFiles.length);
        console.log('📁 Primeiros arquivos:', audioFiles.slice(0, 3).map(f => ({ 
          name: f.name, 
          size: f.size, 
          type: f.type,
          isFile: f instanceof File 
        })));
        
        // Validar que todos os arquivos são File objects válidos
        const validFiles = audioFiles.filter(file => {
          const isValid = file instanceof File && file.name && file.size !== undefined;
          if (!isValid) {
            console.warn('Arquivo inválido encontrado:', file);
          }
          return isValid;
        });
        
        console.log('✅ Arquivos válidos:', validFiles.length, 'de', audioFiles.length);
        
        if (validFiles.length === 0) {
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingStatus('');
          alert('Nenhum arquivo válido encontrado. Verifique o console para mais detalhes.');
          return;
        }
        
        setLoadingProgress(100);
        setLoadingStatus('Adicionando músicas...');
        
        // Criar um FileList simulado usando DataTransfer (mais compatível)
        let fileListToPass = validFiles;
        
        try {
          // Tentar criar um DataTransfer para simular um FileList real
          const dataTransfer = new DataTransfer();
          validFiles.forEach(file => {
            try {
              dataTransfer.items.add(file);
            } catch (err) {
              console.warn('Não foi possível adicionar arquivo ao DataTransfer, usando array direto:', err);
            }
          });
          
          // Se DataTransfer funcionou e tem arquivos, usar ele
          if (dataTransfer.files.length > 0) {
            fileListToPass = dataTransfer.files;
            console.log('✅ Usando DataTransfer com', dataTransfer.files.length, 'arquivos');
          } else {
            console.log('⚠️ DataTransfer vazio, usando array direto');
          }
        } catch (dtError) {
          console.warn('DataTransfer não disponível, usando array direto:', dtError);
        }
        
        // Criar objeto de evento compatível com handleAddMusic
        // handleAddMusic aceita: e?.target?.files || e?.files || (Array.isArray(e) ? e : [])
        const event = {
          target: {
            files: fileListToPass
          },
          files: validFiles  // Fallback direto como array
        };
        
        setTimeout(() => {
          try {
            console.log('🔄 Chamando onAddMusic com', validFiles.length, 'arquivos válidos');
            console.log('📦 Tipo do objeto files:', Array.isArray(fileListToPass) ? 'Array' : fileListToPass.constructor.name);
            console.log('📦 Primeiro arquivo:', validFiles[0] ? {
              name: validFiles[0].name,
              size: validFiles[0].size,
              type: validFiles[0].type,
              isFile: validFiles[0] instanceof File
            } : 'N/A');
            
            if (onAddMusic && typeof onAddMusic === 'function') {
              // Chamar onAddMusic
              const result = onAddMusic(event);
              
              console.log('✅ onAddMusic chamado com sucesso');
              
              // Aguardar um pouco para garantir que o estado foi atualizado
              setTimeout(() => {
                setIsLoading(false);
                setLoadingProgress(0);
                setLoadingStatus('');
                setNotificationCount(validFiles.length);
                setShowNotification(true);
                
                setTimeout(() => {
                  setShowNotification(false);
                }, 3000);
              }, 100);
            } else {
              console.error('❌ onAddMusic não está definido ou não é uma função');
              console.error('onAddMusic:', onAddMusic);
              setIsLoading(false);
              setLoadingProgress(0);
              setLoadingStatus('');
              alert('Erro: função de adicionar músicas não está disponível');
            }
          } catch (error) {
            console.error('❌ Erro ao adicionar músicas:', error);
            console.error('Stack trace:', error.stack);
            console.error('Arquivos que causaram erro:', validFiles.slice(0, 3).map(f => ({
              name: f.name,
              size: f.size,
              type: f.type
            })));
            setIsLoading(false);
            setLoadingProgress(0);
            setLoadingStatus('');
            alert('Erro ao adicionar músicas: ' + error.message + '\nVerifique o console para mais detalhes.');
          }
        }, 500);
      } else {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingStatus('');
        alert('Nenhum arquivo de áudio encontrado na pasta selecionada!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao acessar sistema de arquivos:', error);
        alert('Erro ao acessar o sistema de arquivos. Certifique-se de permitir o acesso quando solicitado.');
      }
      setIsLoading(false);
      setLoadingProgress(0);
      setLoadingStatus('');
    }
  };

  const handleFileSelect = (e) => {
    if (onAddMusic && e.target.files && e.target.files.length > 0) {
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingStatus('Processando arquivos...');
      
      // Contar arquivos de áudio válidos
      const audioFiles = Array.from(e.target.files).filter(file => {
        const ext = file.name.toLowerCase().split('.').pop();
        return ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma', 'opus'].includes(ext);
      });
      
      if (audioFiles.length > 0) {
        setLoadingProgress(50);
        setLoadingStatus(`Adicionando ${audioFiles.length} músicas...`);
        
        // Simular delay para feedback visual
        setTimeout(() => {
          onAddMusic(e);
          setIsLoading(false);
          setLoadingProgress(0);
          setLoadingStatus('');
          setNotificationCount(audioFiles.length);
          setShowNotification(true);
          
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        }, 500);
      } else {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingStatus('');
        alert('Nenhum arquivo de áudio válido encontrado!');
      }
    }
  };

  const handleCreatePlaylist = () => {
    setShowModal(true);
    setNewPlaylistName('');
  };

  const handleConfirmCreate = () => {
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setShowModal(false);
      setNewPlaylistName('');
      setNotificationCount(1);
      setShowNotification(true);
      
      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
    }
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + N para nova playlist
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreatePlaylist();
      }
      // Ctrl/Cmd + O para abrir arquivos
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      // ESC para fechar modal
      if (e.key === 'Escape' && showModal) {
        setShowModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showModal]);

  const handleMusicClick = (e, trackId) => {
    e.stopPropagation();
    if (onPlay && typeof onPlay === 'function') {
      onPlay(trackId);
    }
  };

  return (
    <>
      <PanelContainer
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading && (
          <>
            <LoadingIndicator $loading={isLoading} />
            <ProgressBar $progress={loadingProgress} />
            <LoadingStatus $show={loadingStatus}>{loadingStatus}</LoadingStatus>
          </>
        )}
        <PlaylistHeader>
          <HeaderTitle>
            <span>🎵</span> Biblioteca
          </HeaderTitle>
        </PlaylistHeader>

        {onDeepCleanup && (
          <div style={{
            padding: '0 1.2rem',
            marginTop: '4px',
            marginBottom: '4px',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onDeepCleanup}
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
                opacity: 0.6
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
              title="Limpar e validar todas as músicas, recriar URLs e remover duplicatas"
            >
              🧹 Limpeza
            </button>
          </div>
        )}

        <UploadSection>
          <UploadArea
            $isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleAccessRootDrive}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {isLoading && (
              <>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  zIndex: 1
                }}>
                  <div style={{
                    height: '100%',
                    width: `${loadingProgress}%`,
                    background: 'linear-gradient(90deg, #06b6d4 0%, #22d3ee 50%, #67e8f9 100%)',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
                  }} />
                </div>
                {loadingStatus && (
                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(15, 23, 42, 0.95)',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '0.7rem',
                    color: '#22d3ee',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    maxWidth: '90%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    zIndex: 2
                  }}>
                    {loadingStatus}
                  </div>
                )}
              </>
            )}
            <UploadIcon>📤</UploadIcon>
            <UploadText>
              {isDragging ? 'Solte a pasta completa aqui' : isLoading ? 'Processando...' : 'Arraste pasta completa aqui'}
            </UploadText>
            <UploadSubtext>
              {isLoading 
                ? `${Math.round(loadingProgress)}% concluído` 
                : 'Suporta pastas inteiras com todas as músicas • Clique para acessar pastas de mídia local'
              }
            </UploadSubtext>
          </UploadArea>
        </UploadSection>

        <input 
          ref={fileInputRef}
          type="file" 
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.wma,.opus"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <input 
          ref={folderInputRef}
          type="file" 
          webkitdirectory="true"
          directory=""
          multiple
          accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.wma,.opus"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <ControlsSection>
          <SearchBar 
            placeholder="🔍 Buscar música..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {filteredTracks.length > 0 && (
            <StatsBadge>
              <StatsText>
                {filteredTracks.length} {filteredTracks.length === 1 ? 'música encontrada' : 'músicas encontradas'}
                <StatsNumber>{filteredTracks.length}</StatsNumber>
              </StatsText>
            </StatsBadge>
          )}
        </ControlsSection>

        <MusicListContainer>
          {filteredTracks.length === 0 ? (
            <EmptyState>
              <div style={{fontSize: '3.5rem', marginBottom: '15px', opacity: 0.3}}>🎵</div>
              <div style={{fontSize: '0.95rem', fontWeight: 'bold', color: '#94a3b8'}}>Nenhuma música</div>
              <small style={{fontSize: '0.75rem', marginTop: '8px', color: '#64748b'}}>
                Arraste pasta completa aqui para adicionar
              </small>
            </EmptyState>
          ) : (
            filteredTracks.map((track, index) => (
              <MusicItem 
                key={`${track.id}_${index}`} 
                $active={currentTrackId === track.id}
                onClick={(e) => handleMusicClick(e, track.id)}
              >
                <PlayIcon $active={currentTrackId === track.id}>
                  {currentTrackId === track.id ? '▶' : '♪'}
                </PlayIcon>
                <MusicInfo>
                  <MusicTitle $active={currentTrackId === track.id}>
                    {index + 1}. {track.name || track.title || track.filename || 'Sem nome'}
                  </MusicTitle>
                  {track.artist && (
                    <MusicMeta style={{ marginTop: '2px', color: '#06b6d4' }}>
                      🎤 {track.artist}
                    </MusicMeta>
                  )}
                  <MusicMeta>{(track.file?.size / 1024 / 1024).toFixed(1)} MB</MusicMeta>
                </MusicInfo>
              </MusicItem>
            ))
          )}
        </MusicListContainer>
      </PanelContainer>

      <ModalOverlay $show={showModal} onClick={() => setShowModal(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalTitle>Nova Playlist</ModalTitle>
          <ModalInput
            type="text"
            placeholder="Digite o nome da playlist..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleConfirmCreate();
              }
            }}
            autoFocus
          />
          <ModalButtons>
            <ModalButton onClick={() => setShowModal(false)}>
              Cancelar
            </ModalButton>
            <ModalButton $primary onClick={handleConfirmCreate}>
              Criar
            </ModalButton>
          </ModalButtons>
        </ModalContent>
      </ModalOverlay>

      <Notification $show={showNotification}>
        <NotificationIcon>✓</NotificationIcon>
        <NotificationText>
          {notificationCount === 1 && playlists.length > 0 
            ? 'Playlist criada com sucesso!'
            : `${notificationCount} ${notificationCount === 1 ? 'música adicionada' : 'músicas adicionadas'}!`
          }
          {notificationCount > 1 && (
            <NotificationCount>{notificationCount}</NotificationCount>
          )}
        </NotificationText>
      </Notification>
    </>
  );
};

export default LeftPlaylistPanel;
