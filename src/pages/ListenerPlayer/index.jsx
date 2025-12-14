import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import io from 'socket.io-client';
import ChatPanel from '../../components/ChatPanel';
import ConnectionStatusLED from '../../components/ConnectionStatusLED';
import { Link } from 'react-router-dom';

// ============================================
// ANIMAÇÕES - TODAS CORRIGIDAS COM CSS HELPER
// ============================================
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.5); }
  50% { box-shadow: 0 0 40px rgba(34, 211, 238, 0.8); }
`;

// ============================================
// STYLED COMPONENTS - MOBILE FIRST
// ============================================
const PageContainer = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  background-size: 200% 200%;
  ${css`animation: ${gradientShift} 20s ease infinite;`}
  position: relative;
  overflow-x: hidden;
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom);

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(34, 211, 238, 0.15) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  @media (min-width: 768px) {
    max-width: 480px;
    margin: 0 auto;
    box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
  }
`;

const TopBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  padding-top: env(safe-area-inset-top);
  padding-top: constant(safe-area-inset-top);
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 1rem;
  padding-right: 1rem;
  z-index: 1000;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const Logo = styled.div`
  font-size: 1.1rem;
  font-weight: 900;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MainContent = styled.div`
  padding-top: 60px;
  padding-top: calc(60px + env(safe-area-inset-top));
  padding-top: calc(60px + constant(safe-area-inset-top));
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
`;

const TabNavigation = styled.div`
  display: flex;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
  position: sticky;
  top: 60px;
  top: calc(60px + env(safe-area-inset-top));
  z-index: 100;
  padding: 0 1rem;
`;

const Tab = styled.button`
  flex: 1;
  padding: 1rem;
  background: ${props => props.$active ? 'rgba(6, 182, 212, 0.2)' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#06b6d4' : 'transparent'};
  color: ${props => props.$active ? '#22d3ee' : '#94a3b8'};
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const TabContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  ${css`animation: ${slideUp} 0.3s ease;`}
`;

const PlayerContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem 1.5rem;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  background: ${props => props.$isLive 
    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)' 
    : 'rgba(100, 116, 139, 0.15)'};
  border: 2px solid ${props => props.$isLive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
  border-radius: 50px;
  margin-bottom: 2rem;
  ${props => props.$isLive ? css`animation: ${pulse} 2s infinite;` : css`animation: none;`}
`;

const StatusDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.$isLive ? '#ef4444' : '#64748b'};
  box-shadow: ${props => props.$isLive 
    ? '0 0 15px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.4)' 
    : 'none'};
  ${props => props.$isLive ? css`animation: ${pulse} 2s infinite;` : css`animation: none;`}
`;

const StatusText = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${props => props.$isLive ? '#fca5a5' : '#94a3b8'};
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const AlbumArt = styled.div`
  width: 100%;
  max-width: 320px;
  aspect-ratio: 1;
  margin: 0 auto 2rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(6, 182, 212, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  ${css`animation: ${float} 6s ease-in-out infinite;`}

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, 
      transparent 30%, 
      rgba(6, 182, 212, 0.1) 50%, 
      transparent 70%);
    ${css`animation: ${gradientShift} 3s linear infinite;`}
  }
`;

const VisualizerContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 24px;
  overflow: hidden;
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  display: block;
`;

const MusicIcon = styled.div`
  font-size: 5rem;
  opacity: 0.3;
  filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.5));
`;

const TrackInfo = styled.div`
  text-align: center;
  margin-bottom: 2.5rem;
`;

const NowPlayingLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 1rem;
`;

const TrackTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0.5rem 0;
  line-height: 1.3;
  word-wrap: break-word;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 360px) {
    font-size: 1.3rem;
  }
`;

const TrackArtist = styled.p`
  font-size: 0.95rem;
  color: #94a3b8;
  margin: 0.5rem 0 0;
  font-weight: 500;
`;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ControlButton = styled.button`
  width: 48px;
  height: 48px;
  border: 2px solid rgba(6, 182, 212, 0.3);
  background: rgba(15, 23, 42, 0.6);
  color: #06b6d4;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  
  &:active:not(:disabled) {
    transform: scale(0.95);
    background: rgba(6, 182, 212, 0.3);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const PlayPauseButton = styled(ControlButton)`
  width: 72px;
  height: 72px;
  font-size: 2rem;
  background: ${props => props.$playing 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' 
    : 'rgba(15, 23, 42, 0.8)'};
  border-color: ${props => props.$playing ? '#22d3ee' : 'rgba(6, 182, 212, 0.5)'};
  box-shadow: ${props => props.$playing 
    ? '0 0 30px rgba(6, 182, 212, 0.6), 0 8px 24px rgba(0, 0, 0, 0.4)' 
    : '0 4px 12px rgba(0, 0, 0, 0.3)'};
  ${props => props.$playing ? css`animation: ${glow} 2s ease-in-out infinite;` : css`animation: none;`}
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 16px;
  backdrop-filter: blur(10px);
`;

const VolumeIcon = styled.span`
  font-size: 1.2rem;
  color: #94a3b8;
  min-width: 24px;
`;

const VolumeSlider = styled.input`
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(6, 182, 212, 0.2);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    cursor: pointer;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.6);
    transition: all 0.2s ease;
  
    &:active {
      transform: scale(1.3);
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 15px rgba(6, 182, 212, 0.6);
  }
`;

const VolumeValue = styled.span`
  color: #94a3b8;
  min-width: 45px;
  text-align: right;
  font-size: 0.85rem;
  font-weight: 700;
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const StatCard = styled.div`
  background: rgba(6, 182, 212, 0.05);
  border: 1px solid rgba(6, 182, 212, 0.2);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  backdrop-filter: blur(10px);
`;

const StatLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
  font-weight: 700;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 800;
  color: #22d3ee;
`;

const PlayButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
  color: #0f172a;
  border: none;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.4);
  margin-bottom: 1.5rem;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 10px rgba(6, 182, 212, 0.3);
  }
`;

const ChatWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const ListenerPlayer = () => {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const masterVolumeRef = useRef(100);
  const isProcessingOfferRef = useRef(false);
  
  const [status, setStatus] = useState('Conectando...');
  const [isLive, setIsLive] = useState(false);
  const [volume, setVolume] = useState(80);
  const [needsManualPlay, setNeedsManualPlay] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({
    title: 'Aguardando transmissão...',
    artist: 'Rádio Play DJ'
  });
  const [listenerCount, setListenerCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const [activeTab, setActiveTab] = useState('player');
  const [connectionStatus, setConnectionStatus] = useState('waiting'); // waiting, connecting, connected, error
  const [radioName, setRadioName] = useState('🎵 PLAY DJ'); // Nome da rádio que está transmitindo
  const [userName, setUserName] = useState(() => {
    const stored = localStorage.getItem('listenerName');
    return stored || `Ouvinte${Math.floor(Math.random() * 1000)}`;
  });

  // Funções de Icecast removidas - agora usamos streaming direto via Socket.IO

  // Visualizador de áudio
  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const updateCanvasSize = () => {
        try {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
        } catch (e) {
          console.warn('⚠️ Erro ao atualizar tamanho do canvas:', e);
        }
    };
    
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const draw = () => {
        try {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
      
      const barWidth = (canvas.width / 2 / bufferLength) * 2.5;
      let barHeight;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * (canvas.height / 2) * 0.9;
        
        const gradient = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height / 2 - barHeight);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#22d3ee');
        gradient.addColorStop(1, '#a78bfa');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height / 2 - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
          }
        } catch (e) {
          console.warn('⚠️ Erro ao desenhar visualizador:', e);
      }
    };
    
    draw();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    } catch (error) {
      console.error('❌ Erro ao configurar visualizador:', error);
    }
  }, []);

  // Conexão Socket.IO e WebRTC
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout = null;
    let connectionAttempts = 0;
    const MAX_ATTEMPTS = 10;
    
    // Limpeza inicial
    if (socketRef.current) {
      try {
        socketRef.current.removeAllListeners();
        // Verificar se o socket está conectado antes de desconectar
        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }
      } catch (e) {
        // Ignorar erros de cleanup silenciosamente
      }
      socketRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch (e) {
        // Ignorar erros de cleanup
      }
      peerConnectionRef.current = null;
    }
    
    isProcessingOfferRef.current = false;
    
    const socketUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
    
    // Função para criar conexão Socket.IO
    const createSocketConnection = () => {
      if (!isMounted) return;
      
      // Limpar socket anterior se existir
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          // Verificar se o socket está conectado antes de desconectar
          if (socketRef.current.connected) {
            socketRef.current.disconnect();
          }
        } catch (e) {
          // Ignorar erros silenciosamente
        }
        socketRef.current = null;
      }
      
      try {
        // Tentar conectar com polling primeiro se websocket falhar várias vezes
        const usePollingFirst = connectionAttempts > 3;
        const transports = usePollingFirst ? ['polling', 'websocket'] : ['websocket', 'polling'];
        
        // Não logar tentativas - serão suprimidas pelo main.jsx se necessário
    
    socketRef.current = io(socketUrl, {
          transports: transports,
      reconnection: true,
          reconnectionDelay: 1000 + (connectionAttempts * 500), // Backoff exponencial
          reconnectionAttempts: MAX_ATTEMPTS,
          reconnectionDelayMax: 10000,
          timeout: 15000,
          forceNew: false,
          autoConnect: true,
          // Suprimir erros de transporte
          upgrade: true,
          rememberUpgrade: false
        });
        
        // Handler de conexão bem-sucedida
    socketRef.current.on('connect', () => {
          if (!isMounted) return;
          
          try {
            connectionAttempts = 0; // Reset contador
            console.log('✅ [Socket] Conectado com sucesso:', socketRef.current.id);
      setSocketReady(true);
      setStatus('Conectado - Verificando transmissão...');
      
            // Emitir watcher após um pequeno delay para garantir que tudo está pronto
      setTimeout(() => {
              if (socketRef.current?.connected && isMounted) {
                try {
          socketRef.current.emit('watcher');
                  console.log('📡 [Socket] Watcher emitido');
                } catch (e) {
                  console.warn('⚠️ [Socket] Erro ao emitir watcher:', e);
                }
              }
            }, 300);
          } catch (error) {
            console.error('❌ [Socket] Erro no handler de connect:', error);
          }
        });
        
        // Handler de erro de conexão
        socketRef.current.on('connect_error', (error) => {
          if (!isMounted) return;
          
          connectionAttempts++;
          
          // Só logar após algumas tentativas para evitar spam
          if (connectionAttempts <= 3) {
            // Silenciar primeiras tentativas
            return;
          }
          
          try {
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
            
            // Só mostrar erro após várias tentativas
            if (connectionAttempts >= MAX_ATTEMPTS) {
              setStatus('Servidor não disponível - Verifique se o backend está rodando');
              console.warn('⚠️ [Socket] Não foi possível conectar após', connectionAttempts, 'tentativas');
            } else {
              setStatus(`Tentando conectar... (${connectionAttempts}/${MAX_ATTEMPTS})`);
            }
          } catch (e) {
            console.error('❌ [Socket] Erro no handler de connect_error:', e);
          }
        });
        
        // Handler de desconexão
        socketRef.current.on('disconnect', (reason) => {
          if (!isMounted) return;
          
          try {
            console.log('❌ [Socket] Desconectado:', reason);
            setSocketReady(false);
            
            // Só atualizar status se não for uma desconexão intencional
            if (reason !== 'io client disconnect') {
              setStatus('Desconectado - Reconectando...');
          setIsLive(false);
            }
          } catch (error) {
            console.error('❌ [Socket] Erro no handler de disconnect:', error);
          }
        });
        
        // Handler de reconexão
        socketRef.current.on('reconnect', (attemptNumber) => {
          if (!isMounted) return;
          
          try {
            connectionAttempts = 0; // Reset contador
            console.log('✅ [Socket] Reconectado após', attemptNumber, 'tentativas');
            setSocketReady(true);
            setStatus('Reconectado - Verificando transmissão...');
            
            // Emitir watcher novamente
              setTimeout(() => {
              if (socketRef.current?.connected && isMounted) {
                socketRef.current.emit('watcher');
                }
              }, 300);
          } catch (error) {
            console.error('❌ [Socket] Erro no handler de reconnect:', error);
          }
        });
        
        // Handler de falha de reconexão
        socketRef.current.on('reconnect_failed', () => {
          if (!isMounted) return;
          
          try {
            console.warn('⚠️ [Socket] Falha ao reconectar após', MAX_ATTEMPTS, 'tentativas');
            setStatus('Servidor não disponível - Verifique se o backend está rodando');
            setSocketReady(false);
          } catch (error) {
            console.error('❌ [Socket] Erro no handler de reconnect_failed:', error);
          }
        });
        
        // Adicionar todos os outros handlers de eventos
        socketRef.current.on('broadcaster', (data) => {
        try {
          const broadcasterData = typeof data === 'object' ? data : { broadcasterId: data };
          console.log('📡 Broadcaster detectado:', broadcasterData.broadcasterId);
          
          // Atualizar nome da rádio se fornecido
          if (broadcasterData.radioName) {
            setRadioName(broadcasterData.radioName);
            console.log('✅ Nome da rádio recebido:', broadcasterData.radioName);
          }
          
          // Verificar se é streaming direto via Socket.IO
          if (broadcasterData.directStream || broadcasterData.streaming) {
            console.log('✅ Streaming direto detectado - preparando para receber chunks de áudio');
            setConnectionStatus('connecting');
            setStatus('Conectando ao stream direto...');
            setIsLive(true);
            
            // Preparar para receber chunks de áudio
            if (audioRef.current) {
              // Limpar qualquer stream anterior
              audioRef.current.pause();
              
              // Limpar handlers anteriores se existirem
              if (socketRef.current) {
                socketRef.current.off('audio:chunk');
              }
              
              // Usar MediaSource API para streaming contínuo
              if ('MediaSource' in window) {
                const mimeType = 'audio/webm;codecs=opus';
                if (MediaSource.isTypeSupported(mimeType)) {
                  // Limpar MediaSource anterior se existir
                  if (audioRef.current.src) {
                    try {
                      URL.revokeObjectURL(audioRef.current.src);
                    } catch (e) {
                      // Ignorar erro
                    }
                  }
                  
                  const mediaSource = new MediaSource();
                  const url = URL.createObjectURL(mediaSource);
                  audioRef.current.src = url;
                  
                  let sourceBuffer = null;
                  const audioChunksQueue = [];
                  let isPlayingStarted = false;
                  
                  // Handler para receber chunks de áudio (definido antes do sourceopen)
                  const audioChunkHandler = (chunkData) => {
                    try {
                      if (!chunkData || !chunkData.data) {
                        console.warn('⚠️ Chunk recebido sem dados');
                        return;
                      }
                      
                      if (!sourceBuffer) {
                        console.warn('⚠️ SourceBuffer ainda não está pronto, adicionando à fila');
                        // Tentar converter e adicionar à fila mesmo sem sourceBuffer
                        try {
                          const binaryString = atob(chunkData.data);
                          const bytes = new Uint8Array(binaryString.length);
                          for (let i = 0; i < binaryString.length; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                          }
                          audioChunksQueue.push(bytes.buffer);
                        } catch (e) {
                          console.error('❌ Erro ao converter chunk para fila:', e);
                        }
                        return;
                      }
                      
                      // Converter base64 para ArrayBuffer
                      const binaryString = atob(chunkData.data);
                      const bytes = new Uint8Array(binaryString.length);
                      for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                      }
                      
                      // Verificar se o sourceBuffer está pronto
                      if (sourceBuffer.readyState === 'open') {
                        if (!sourceBuffer.updating) {
                          try {
                            sourceBuffer.appendBuffer(bytes.buffer);
                            console.log('✅ Chunk adicionado ao buffer:', bytes.buffer.byteLength, 'bytes');
                          } catch (err) {
                            console.error('❌ Erro ao adicionar buffer:', err);
                            // Adicionar à fila se falhar
                            audioChunksQueue.push(bytes.buffer);
                          }
                        } else {
                          audioChunksQueue.push(bytes.buffer);
                        }
                        
                        // Iniciar reprodução quando tiver dados suficientes
                        if (!isPlayingStarted && audioRef.current && mediaSource.readyState === 'open') {
                          // Aguardar um pouco para ter dados suficientes
                          setTimeout(() => {
                            if (audioRef.current && !audioRef.current.paused) {
                              return; // Já está tocando
                            }
                            audioRef.current.play().then(() => {
                              console.log('✅ Reprodução iniciada');
                              isPlayingStarted = true;
                              setConnectionStatus('connected');
                              setStatus('Transmissão ao vivo');
                              setIsPlaying(true);
                            }).catch(err => {
                              console.warn('⚠️ Erro ao iniciar reprodução:', err);
                            });
                          }, 500);
                        }
                      } else {
                        console.warn('⚠️ SourceBuffer não está aberto, estado:', sourceBuffer.readyState);
                        audioChunksQueue.push(bytes.buffer);
                      }
                    } catch (error) {
                      console.error('❌ Erro ao processar chunk:', error);
                    }
                  };
                  
                  // Registrar handler ANTES de abrir o MediaSource
                  socketRef.current.on('audio:chunk', audioChunkHandler);
                  console.log('✅ Handler de audio:chunk registrado');
                  
                  mediaSource.addEventListener('sourceopen', () => {
                    try {
                      if (mediaSource.sourceBuffers.length === 0) {
                        sourceBuffer = mediaSource.addSourceBuffer(mimeType);
                        console.log('✅ MediaSource aberto, SourceBuffer criado');
                        
                        // Processar fila de chunks pendentes
                        const processQueue = () => {
                          if (sourceBuffer && !sourceBuffer.updating && audioChunksQueue.length > 0) {
                            const chunk = audioChunksQueue.shift();
                            try {
                              sourceBuffer.appendBuffer(chunk);
                              console.log('✅ Chunk da fila adicionado:', chunk.byteLength, 'bytes');
                            } catch (err) {
                              console.error('❌ Erro ao adicionar buffer da fila:', err);
                              // Recolocar na fila
                              audioChunksQueue.unshift(chunk);
                            }
                          }
                        };
                        
                        sourceBuffer.addEventListener('updateend', processQueue);
                        sourceBuffer.addEventListener('error', (e) => {
                          console.error('❌ Erro no SourceBuffer:', e);
                        });
                        
                        // Processar fila inicial
                        processQueue();
                      }
                    } catch (error) {
                      console.error('❌ Erro ao configurar MediaSource:', error);
                    }
                  });
                  
                  mediaSource.addEventListener('error', (e) => {
                    console.error('❌ Erro no MediaSource:', e);
                    setConnectionStatus('error');
                    setStatus('Erro no stream de áudio');
                  });
                  
                  // Limpar handler quando desconectar
                  socketRef.current.on('broadcaster_left', () => {
                    console.log('🛑 Broadcaster desconectado, limpando handlers');
                    socketRef.current.off('audio:chunk', audioChunkHandler);
                    if (audioRef.current) {
                      audioRef.current.pause();
                    }
                    if (url) {
                      try {
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        // Ignorar
                      }
                    }
                  });
                  
                  setConnectionStatus('connecting');
                  setStatus('Aguardando dados do stream...');
                } else {
                  console.warn('⚠️ MediaSource não suporta o formato de áudio');
                  setConnectionStatus('error');
                  setStatus('Formato de áudio não suportado');
                }
              } else {
                console.warn('⚠️ MediaSource não disponível neste navegador');
                setConnectionStatus('error');
                setStatus('Navegador não suporta streaming direto');
              }
            }
          } else {
            setConnectionStatus('waiting');
            setStatus('Aguardando transmissão...');
          }
        } catch (error) {
          console.error('❌ Erro no handler de broadcaster:', error);
        }
      });
      
      // Handlers WebRTC removidos - agora usamos streaming direto via Socket.IO

      socketRef.current.on('broadcaster_left', () => {
        try {
          setStatus('Transmissão encerrada');
          setIsLive(false);
          setIsPlaying(false);
          setCurrentTrack({
            title: 'Aguardando transmissão...',
            artist: 'Rádio Play DJ'
          });
          
          // Parar o áudio
          if (audioRef.current) {
            audioRef.current.pause();
            // Não definir src como vazio - isso causa erro MEDIA_ELEMENT_ERROR
            // Apenas pausar é suficiente
          }
          
          setConnectionStatus('waiting');
        } catch (error) {
          console.error('❌ Erro no handler de broadcaster_left:', error);
        }
      });

      // Código WebRTC removido - agora usamos streaming direto via Socket.IO
    
    socketRef.current.on('listenerCount', (count) => {
        try {
      setListenerCount(count);
        } catch (e) {
          console.warn('⚠️ Erro no handler de listenerCount:', e);
        }
    });
    
    socketRef.current.on('trackUpdate', (data) => {
        try {
      if (data.trackName) {
        setCurrentTrack({
          title: data.trackName,
          artist: data.artist || 'Rádio Play DJ'
        });
          }
        } catch (e) {
          console.warn('⚠️ Erro no handler de trackUpdate:', e);
      }
    });
    
    socketRef.current.on('masterVolumeUpdate', (data) => {
        try {
      let newMasterVolume;
      if (typeof data === 'number') {
        newMasterVolume = data;
      } else if (data?.volume !== undefined) {
        if (data.channel === 'master' || !data.channel) {
          newMasterVolume = data.volume;
        } else {
          return;
        }
      } else {
        return;
      }
      
      masterVolumeRef.current = newMasterVolume;
      
      if (audioRef.current) {
        const finalVolume = (volume / 100) * (newMasterVolume / 100);
        audioRef.current.volume = finalVolume;
          }
        } catch (e) {
          console.warn('⚠️ Erro no handler de masterVolumeUpdate:', e);
      }
    });
    
    socketRef.current.on('musicVolumeUpdate', (data) => {
        try {
      let newVolume;
      if (typeof data === 'number') {
        newVolume = data;
      } else if (data?.volume !== undefined) {
        if (data.channel === 'music' || !data.channel) {
          newVolume = data.volume;
        } else {
          return;
        }
      } else {
        return;
      }
      
      setVolume(newVolume);
      
      if (audioRef.current) {
        const finalVolume = (newVolume / 100) * (masterVolumeRef.current / 100);
        audioRef.current.volume = finalVolume;
          }
        } catch (e) {
          console.warn('⚠️ Erro no handler de musicVolumeUpdate:', e);
        }
      });
      
      } catch (error) {
        console.error('❌ [Socket] Erro ao configurar handlers:', error);
      }
    }; // Fim da função createSocketConnection
    
    // Iniciar conexão
    try {
      createSocketConnection();
    } catch (error) {
      console.error('❌ [Socket] Erro ao criar conexão:', error);
      setStatus('Erro ao conectar - Verifique se o servidor está rodando');
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
      
      // Limpar timeout de reconexão
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      isProcessingOfferRef.current = false;
      
      // Remover todos os listeners e desconectar socket
      if (socketRef.current) {
        try {
          socketRef.current.removeAllListeners();
          // Verificar se o socket está conectado antes de desconectar
          if (socketRef.current.connected) {
            socketRef.current.disconnect();
          }
        } catch (e) {
          // Ignorar erros de cleanup silenciosamente
        }
        socketRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        try {
          peerConnectionRef.current.onconnectionstatechange = null;
          peerConnectionRef.current.oniceconnectionstatechange = null;
          peerConnectionRef.current.ontrack = null;
          peerConnectionRef.current.onicecandidate = null;
          if (peerConnectionRef.current.connectionState !== 'closed') {
            peerConnectionRef.current.close();
          }
        } catch (error) {
          console.warn('⚠️ Erro ao fechar PeerConnection no cleanup:', error);
        }
        peerConnectionRef.current = null;
      }
      
      if (audioRef.current) {
        try {
        audioRef.current.srcObject = null;
        } catch (e) {
          console.warn('⚠️ Erro ao limpar srcObject:', e);
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!socketReady || !socketRef.current?.connected) return;
    
    // Evitar verificar se já está connected
    if (connectionStatus === 'connected') return;
    
    let intervalId = null;
    
    const checkBroadcaster = () => {
      try {
        // Só verificar se não estiver connected, não estiver processando e não estiver live
        if (socketRef.current?.connected && 
            !isLive && 
            !isProcessingOfferRef.current && 
            connectionStatus !== 'connected') {
        socketRef.current.emit('watcher');
        }
      } catch (e) {
        console.warn('⚠️ Erro ao verificar broadcaster:', e);
      }
    };
    
    // Aguardar um pouco antes da primeira verificação
    const timeout = setTimeout(() => {
    checkBroadcaster();
      intervalId = setInterval(() => {
        // Verificar novamente o status antes de emitir
        if (connectionStatus === 'connected' || isLive || isProcessingOfferRef.current) {
          return;
        }
        checkBroadcaster();
      }, 10000); // Aumentar intervalo para 10s
    }, 2000);
    
    return () => {
      clearTimeout(timeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [socketReady]);

  useEffect(() => {
    if (audioRef.current) {
      try {
      const finalVolume = (volume / 100) * (masterVolumeRef.current / 100);
      audioRef.current.volume = finalVolume;
      } catch (e) {
        console.warn('⚠️ Erro ao atualizar volume:', e);
      }
    }
  }, [volume]);

  useEffect(() => {
    try {
    localStorage.setItem('listenerName', userName);
    } catch (e) {
      console.warn('⚠️ Erro ao salvar nome:', e);
    }
  }, [userName]);

  const handleManualPlay = async () => {
    try {
    if (!audioRef.current || !audioRef.current.srcObject) {
      alert('Aguardando transmissão...');
      return;
    }
    
      await audioRef.current.play();
      setIsPlaying(true);
      setNeedsManualPlay(false);
      console.log('✅ Áudio iniciado manualmente');
    } catch (err) {
      console.error('❌ Erro ao reproduzir:', err);
      alert(`Erro ao reproduzir áudio: ${err.message || 'Erro desconhecido'}`);
      setNeedsManualPlay(true);
    }
  };

  const togglePlayPause = useCallback(async () => {
    try {
    if (!audioRef.current) {
      console.warn('⚠️ AudioRef não disponível');
      return;
    }
    
    if (!audioRef.current.srcObject) {
      console.warn('⚠️ Nenhum stream disponível');
      alert('Aguardando transmissão...');
      return;
    }
      
      if (audioRef.current.paused) {
        await audioRef.current.play();
        setIsPlaying(true);
        setNeedsManualPlay(false);
        console.log('✅ Reproduzindo áudio');
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log('⏸ Pausando áudio');
      }
    } catch (err) {
      console.error('❌ Erro ao alternar play/pause:', err);
      if (err.name === 'NotAllowedError') {
        setNeedsManualPlay(true);
        alert('⚠️ Clique no botão "Reproduzir Áudio" para iniciar a reprodução');
      }
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    let isMounted = true;
    
    const handlePlay = () => {
      if (isMounted) {
        setIsPlaying(prev => prev ? prev : true);
        setNeedsManualPlay(false);
        console.log('▶️ Áudio iniciado');
      }
    };
    
    const handlePause = () => {
      if (isMounted) {
        setIsPlaying(false);
        console.log('⏸ Áudio pausado');
      }
    };
    
    const handleEnded = () => {
      if (isMounted) {
        setIsPlaying(false);
        console.log('⏹ Áudio finalizado');
      }
    };
    
    const handleError = (e) => {
      // Ignorar erros de src vazio (isso é normal durante limpeza/reconfiguração)
      if (audio.error && audio.error.code === 4 && audio.error.message?.includes('Empty src')) {
        return; // Ignorar silenciosamente
      }
      
      // Ignorar erros quando o src está vazio intencionalmente
      if (!audio.src || audio.src === '' || audio.src === 'about:blank') {
        return; // Ignorar silenciosamente
      }
      
      console.error('❌ Erro no elemento de áudio:', e, audio.error);
      if (isMounted) {
        setIsPlaying(false);
      }
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      isMounted = false;
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <PageContainer>
      <TopBar>
        <Logo>{radioName || '🎵 PLAY DJ'}</Logo>
        <Link to="/login" style={{ 
          color: '#22d3ee', 
          textDecoration: 'none',
          fontSize: '0.85rem',
          fontWeight: '700'
        }}>
          DJ Login
        </Link>
      </TopBar>
      
      <MainContent>
        <TabNavigation>
          <Tab 
            $active={activeTab === 'player'} 
            onClick={() => setActiveTab('player')}
          >
            🎵 Player
          </Tab>
          <Tab 
            $active={activeTab === 'chat'} 
            onClick={() => setActiveTab('chat')}
          >
            💬 Chat
          </Tab>
        </TabNavigation>

        {activeTab === 'player' && (
          <TabContent>
            <PlayerContent>
              <StatusBadge $isLive={isLive}>
                <StatusDot $isLive={isLive} />
                <StatusText $isLive={isLive}>
                  {isLive ? '● AO VIVO' : '○ OFFLINE'}
                </StatusText>
                <div style={{ 
                  marginLeft: '12px', 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <ConnectionStatusLED 
                    status={connectionStatus}
                    size={10}
                    fontSize="0.65rem"
                    showLabel={true}
                    showStatusText={false}
                  />
                </div>
              </StatusBadge>

              {needsManualPlay && isLive && (
                <PlayButton onClick={handleManualPlay}>
                  ▶ Reproduzir Áudio
                </PlayButton>
              )}

              <AlbumArt>
                <VisualizerContainer>
                  <Canvas ref={canvasRef} />
                  {!isPlaying && (
                    <MusicIcon style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                      🎵
                    </MusicIcon>
                  )}
                </VisualizerContainer>
              </AlbumArt>

              <TrackInfo>
                <NowPlayingLabel>♫ TOCANDO AGORA</NowPlayingLabel>
                <TrackTitle>{currentTrack.title}</TrackTitle>
                <TrackArtist>{currentTrack.artist}</TrackArtist>
              </TrackInfo>

              <PlayerControls>
                <ControlButton disabled title="Anterior (indisponível)">
                  ⏮️
                </ControlButton>
                
                <PlayPauseButton 
                  $playing={isPlaying}
                  onClick={togglePlayPause}
                  disabled={!isLive || !audioRef.current?.srcObject}
                  title={isPlaying ? 'Pausar' : (isLive ? 'Tocar' : 'Aguardando transmissão...')}
                >
                  {isPlaying ? '⏸' : '▶'}
                </PlayPauseButton>
                
                <ControlButton disabled title="Próxima (indisponível)">
                  ⏭️
                </ControlButton>
              </PlayerControls>

              <VolumeControl>
                <VolumeIcon>🔊</VolumeIcon>
                <VolumeSlider
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                />
                <VolumeValue>{volume}%</VolumeValue>
              </VolumeControl>

              <StatsContainer>
                <StatCard>
                  <StatLabel>Status</StatLabel>
                  <StatValue>{isLive ? 'LIVE' : 'OFF'}</StatValue>
                </StatCard>
                <StatCard>
                  <StatLabel>Ouvintes</StatLabel>
                  <StatValue>{listenerCount}</StatValue>
                </StatCard>
              </StatsContainer>
            </PlayerContent>
          </TabContent>
        )}

        {activeTab === 'chat' && (
          <TabContent>
            <ChatWrapper>
              <ChatPanel 
                userName={userName}
                socket={socketRef.current}
                isDJ={false}
              />
            </ChatWrapper>
          </TabContent>
        )}
      </MainContent>

      <audio 
        ref={audioRef}
        onError={(e) => {
          try {
            // Ignorar erros de src vazio (isso é normal durante limpeza/reconfiguração)
            if (audioRef.current?.error) {
              const error = audioRef.current.error;
              // Código 4 = MEDIA_ELEMENT_ERROR: Empty src attribute
              if (error.code === 4 && error.message?.includes('Empty src')) {
                return; // Ignorar silenciosamente
              }
              // Ignorar se o src está vazio intencionalmente
              if (!audioRef.current.src || audioRef.current.src === '' || audioRef.current.src === 'about:blank') {
                return; // Ignorar silenciosamente
              }
            }
            
            console.error('❌ Erro no elemento de áudio:', e, audioRef.current?.error);
            if (audioRef.current?.error) {
              const error = audioRef.current.error;
              if (error.code === error.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                setStatus('Formato de áudio não suportado');
              } else if (error.code === error.MEDIA_ERR_NETWORK) {
                setStatus('Erro de rede - Reconectando...');
              } else {
                setStatus('Erro de áudio - Tentando reconectar...');
              }
            }
          } catch (err) {
            console.error('❌ Erro no handler de erro de áudio:', err);
          }
        }}
      />

      {/* Modal de Configuração do Icecast */}
      {false && (
        <div
          onClick={() => setShowIcecastConfigModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              border: '2px solid rgba(6, 182, 212, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
            }}
          >
            <h2 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '1.5rem' }}>
              📡 Configurar Stream Icecast
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '0.9rem', fontWeight: '700' }}>
                URL do Stream Icecast:
              </label>
              <input
                type="text"
                value={icecastStreamUrl}
                onChange={(e) => setIcecastStreamUrl(e.target.value)}
                placeholder="Ex: http://icecast.example.com:8000/stream"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ marginTop: '8px', fontSize: '0.8rem', color: '#94a3b8' }}>
                Insira a URL completa do stream Icecast (ex: http://servidor:porta/mountpoint)
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowIcecastConfigModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#cbd5e1',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('icecastStreamUrl', icecastStreamUrl);
                  setShowIcecastConfigModal(false);
                  if (isLive) {
                    connectToIcecastStream();
                  }
                  alert('URL do stream salva!');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid rgba(6, 182, 212, 0.5)',
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%)',
                  color: '#22d3ee',
                  fontSize: '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

// Error Boundary para evitar que erros fechem o componente
class ListenerPlayerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erro capturado pelo Error Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color: '#fff',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#ef4444', marginBottom: '20px', fontSize: '1.5rem' }}>⚠️ Erro no Player</h2>
          <p style={{ marginBottom: '20px', color: '#cbd5e1', maxWidth: '400px' }}>
            Ocorreu um erro inesperado. Por favor, recarregue a página para continuar ouvindo.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 24px',
              background: 'rgba(6, 182, 212, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(6, 182, 212, 1)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(6, 182, 212, 0.8)'}
          >
            🔄 Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper com Error Boundary
const ListenerPlayerWithErrorBoundary = () => {
  return (
    <ListenerPlayerErrorBoundary>
      <ListenerPlayer />
    </ListenerPlayerErrorBoundary>
  );
};

export default ListenerPlayerWithErrorBoundary;

