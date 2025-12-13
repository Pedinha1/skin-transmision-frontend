import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { pulse } from '../../styles/animations';

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(34, 211, 238, 0.5); }
  50% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.8); }
`;

const SmartButtonsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
  margin-bottom: 8px;
`;

const SmartChannelButton = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid ${props => props.$color || 'rgba(6, 182, 212, 0.3)'};
  border-radius: 12px;
  padding: 12px 8px;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -2px 4px rgba(0, 0, 0, 0.8),
    0 2px 8px ${props => props.$color ? `${props.$color}33` : 'rgba(6, 182, 212, 0.2)'},
    ${props => props.$active ? `0 0 20px ${props.$color || 'rgba(34, 211, 238, 0.5)'}` : 'none'};
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 100px;
  max-width: 140px;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent, 
      ${props => props.$color || 'rgba(34, 211, 238, 0.8)'}, 
      transparent
    );
    opacity: ${props => props.$active ? '1' : '0.5'};
  }
  
  &:hover {
    border-color: ${props => props.$color || '#22d3ee'};
    box-shadow: 
      inset 0 1px 2px rgba(255, 255, 255, 0.1),
      inset 0 -2px 4px rgba(0, 0, 0, 0.8),
      0 4px 16px ${props => props.$color ? `${props.$color}66` : 'rgba(34, 211, 238, 0.4)'},
      0 0 25px ${props => props.$color ? `${props.$color}44` : 'rgba(34, 211, 238, 0.3)'};
    transform: translateY(-2px);
  }
`;

const ChannelHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
`;

const ChannelLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${props => props.$color || '#22d3ee'};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 0 10px ${props => props.$color ? `${props.$color}66` : 'rgba(34, 211, 238, 0.5)'};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ChannelIcon = styled.span`
  font-size: 1.1rem;
  filter: drop-shadow(0 0 4px ${props => props.$color ? `${props.$color}88` : 'rgba(34, 211, 238, 0.6)'});
`;

const ControlButtons = styled.div`
  display: flex;
  gap: 4px;
  width: 100%;
  justify-content: center;
`;

const ControlButton = styled.button`
  background: ${props => props.$active 
    ? `linear-gradient(135deg, ${props.$color || 'rgba(34, 211, 238, 0.3)'} 0%, ${props.$color || 'rgba(6, 182, 212, 0.2)'} 100%)`
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: 1px solid ${props => props.$active 
    ? (props.$color || 'rgba(34, 211, 238, 0.5)') 
    : 'rgba(6, 182, 212, 0.3)'
  };
  color: ${props => props.$active ? (props.$color || '#22d3ee') : '#64748b'};
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active 
    ? `0 0 10px ${props.$color ? `${props.$color}44` : 'rgba(34, 211, 238, 0.3)'}, 0 2px 4px rgba(0, 0, 0, 0.3)`
    : '0 2px 4px rgba(0, 0, 0, 0.3)'
  };
  
  &:hover {
    border-color: ${props => props.$color || '#22d3ee'};
    color: ${props => props.$color || '#22d3ee'};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const FaderContainer = styled.div`
  position: relative;
  width: 32px;
  flex: 1;
  min-height: 180px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    inset 0 -1px 2px rgba(255, 255, 255, 0.05),
    0 1px 3px rgba(6, 182, 212, 0.2);
  padding: 8px 4px;
`;

const FaderTrack = styled.div`
  width: 12px;
  height: 100%;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.9) 0%,
    rgba(30, 41, 59, 0.9) 50%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border-radius: 6px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
`;

const FaderFill = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.$value}%;
  background: ${props => {
    if (props.$value > 90) return 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
    if (props.$value > 75) return 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)';
    return props.$colorGradient || 'linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%)';
  }};
  border-radius: 6px;
  box-shadow: ${props => {
    if (props.$value > 90) return '0 -3px 15px rgba(239, 68, 68, 0.8)';
    if (props.$value > 75) return '0 -3px 12px rgba(251, 191, 36, 0.6)';
    return `0 -3px 10px ${props.$glowColor || 'rgba(34, 211, 238, 0.5)'}`;
  }};
  transition: height 0.1s ease;
  animation: ${props => props.$active ? glow : 'none'} 2s ease-in-out infinite;
`;

const FaderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
`;

const ValueDisplay = styled.div`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${props => {
    if (props.$value > 90) return '#ef4444';
    if (props.$value > 75) return '#fbbf24';
    return props.$color || '#22d3ee';
  }};
  text-align: center;
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid ${props => {
    if (props.$value > 90) return 'rgba(239, 68, 68, 0.5)';
    if (props.$value > 75) return 'rgba(251, 191, 36, 0.5)';
    return props.$color ? `${props.$color}66` : 'rgba(34, 211, 238, 0.3)';
  }};
  min-width: 50px;
  box-shadow: ${props => props.$value > 75 ? `0 0 8px ${props.$value > 90 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(251, 191, 36, 0.3)'}` : 'none'};
  text-shadow: ${props => props.$value > 75 ? '0 0 6px currentColor' : 'none'};
`;

const LevelIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${props => {
    if (props.$value > 90) return '#ef4444';
    if (props.$value > 75) return '#fbbf24';
    if (props.$value > 0) return props.$color || '#22d3ee';
    return '#64748b';
  }};
  box-shadow: ${props => props.$value > 0 ? `0 0 8px ${props.$value > 90 ? 'rgba(239, 68, 68, 0.8)' : props.$value > 75 ? 'rgba(251, 191, 36, 0.6)' : props.$color ? `${props.$color}66` : 'rgba(34, 211, 238, 0.5)'}` : 'none'};
  animation: ${props => props.$value > 75 ? pulse : 'none'} 1s ease-in-out infinite;
`;

const MasterDeviceSelector = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
`;

const MasterDeviceLabel = styled.label`
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MasterDeviceSelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const DeviceSelectRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  width: 100%;
`;

const MasterDeviceSelect = styled.select`
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 0.6rem;
  padding: 4px 6px;
  cursor: pointer;
  outline: none;
  
  &:hover {
    border-color: rgba(34, 211, 238, 0.5);
  }
  
  &:focus {
    border-color: #22d3ee;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.3);
  }
`;

const ScanButton = styled.button`
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.15) 100%);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.65rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  
  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(34, 211, 238, 0.25) 100%);
    border-color: #22d3ee;
    box-shadow: 0 0 10px rgba(6, 182, 212, 0.4);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RefreshDevicesButton = styled.button`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #22d3ee;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  
  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(34, 211, 238, 0.1) 100%);
    border-color: #22d3ee;
    box-shadow: 0 0 10px rgba(34, 211, 238, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3);
    transform: rotate(180deg);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MicDeviceSelector = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
`;

const SmartChannelButtons = ({
  channels,
  onChannelChange,
  onMute,
  onSolo,
  audioOutputDevices = [],
  selectedOutputDeviceId,
  onOutputDeviceChange,
  onEnumerateDevices,
  musicAudioRef,
  jingleAudioRefs,
  onInputDeviceChange,
  micActive = false,
  onMicToggle = null
}) => {
  const [isDragging, setIsDragging] = useState({});
  const [muted, setMuted] = useState({ master: false, music: false, fx: false, mic: false });
  const [solo, setSolo] = useState({ master: false, music: false, fx: false, mic: false });
  const [isScanning, setIsScanning] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState(null);
  const [isScanningInputs, setIsScanningInputs] = useState(false);
  const faderRefs = useRef({});
  const startValuesRef = useRef({});
  const startYRef = useRef({});

  const channelsConfig = [
    // Todos os canais removidos (master, music, fx, mic)
  ];

  const handleSliderMouseDown = (channelKey, e) => {
    const slider = faderRefs.current[channelKey];
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const height = rect.height;
    const clickPercent = ((height - clickY) / height) * 100;
    const newValue = Math.round(Math.max(0, Math.min(100, clickPercent)));
    
    startValuesRef.current[channelKey] = newValue;
    startYRef.current[channelKey] = e.clientY;
    setIsDragging(prev => ({ ...prev, [channelKey]: true }));
    onChannelChange(channelKey, newValue);

    const handleMouseMove = (e) => {
      const deltaY = startYRef.current[channelKey] - e.clientY;
      const height = rect.height;
      const deltaPercent = (deltaY / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, startValuesRef.current[channelKey] + deltaPercent)));
      onChannelChange(channelKey, newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(prev => ({ ...prev, [channelKey]: false }));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleMute = (channelKey) => {
    const newMuted = { ...muted, [channelKey]: !muted[channelKey] };
    setMuted(newMuted);
    if (onMute) {
      onMute(channelKey, newMuted[channelKey]);
    }
  };

  const handleSolo = (channelKey) => {
    const newSolo = { ...solo, [channelKey]: !solo[channelKey] };
    setSolo(newSolo);
    if (onSolo) {
      onSolo(channelKey, newSolo[channelKey]);
    }
  };

  // Escanear dispositivos de entrada de áudio
  const scanInputDevices = useCallback(async () => {
    setIsScanningInputs(true);
    try {
      // Solicitar permissão de microfone
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permError) {
        console.warn('⚠️ Permissão de microfone não concedida:', permError);
        setIsScanningInputs(false);
        return;
      }
      
      // Enumerar dispositivos
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioInputDevices(audioInputs);
      
      // Selecionar dispositivo padrão se não houver seleção
      if (audioInputs.length > 0 && !selectedInputDeviceId) {
        const defaultDevice = audioInputs.find(d => d.deviceId === 'default') || audioInputs[0];
        if (defaultDevice) {
          setSelectedInputDeviceId(defaultDevice.deviceId);
          if (onInputDeviceChange) {
            onInputDeviceChange(defaultDevice.deviceId);
          }
        }
      }
      
      console.log('✅ Dispositivos de entrada escaneados:', audioInputs.length);
    } catch (error) {
      console.error('❌ Erro ao escanear dispositivos de entrada:', error);
    } finally {
      setIsScanningInputs(false);
    }
  }, [selectedInputDeviceId, onInputDeviceChange]);

  // Escanear dispositivos quando o componente montar
  useEffect(() => {
    scanInputDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler para mudança de dispositivo de entrada
  const handleInputDeviceChange = (deviceId) => {
    setSelectedInputDeviceId(deviceId);
    if (onInputDeviceChange) {
      onInputDeviceChange(deviceId);
    }
  };

  // Apply volume changes to audio elements
  useEffect(() => {
    if (musicAudioRef && musicAudioRef.current) {
      const volume = muted.music ? 0 : (channels.music / 100);
      musicAudioRef.current.volume = volume;
    }
  }, [channels.music, muted.music, musicAudioRef]);

  useEffect(() => {
    if (jingleAudioRefs) {
      Object.values(jingleAudioRefs).forEach(audioRef => {
        if (audioRef && audioRef.current) {
          const volume = muted.fx ? 0 : (channels.fx / 100);
          audioRef.current.volume = volume;
        }
      });
    }
  }, [channels.fx, muted.fx, jingleAudioRefs]);

  return (
    <SmartButtonsContainer>
      {channelsConfig.map(config => (
        <SmartChannelButton
          key={config.key}
          $color={config.color}
          $active={channels[config.key] > 0 && !muted[config.key]}
        >
          <LevelIndicator 
            $value={muted[config.key] ? 0 : channels[config.key]} 
            $color={config.color}
          />
          
          <ChannelHeader>
            <ChannelLabel $color={config.color}>
              <ChannelIcon $color={config.color}>{config.icon}</ChannelIcon>
              {config.label}
            </ChannelLabel>
            
            {/* Seletor de dispositivo de entrada para MIC */}
            {config.key === 'mic' && (
              <MicDeviceSelector>
                <DeviceSelectRow>
                  <MasterDeviceSelect
                    value={selectedInputDeviceId || ''}
                    onChange={(e) => handleInputDeviceChange(e.target.value)}
                    style={{ fontSize: '0.55rem', padding: '3px 5px' }}
                  >
                    {audioInputDevices.length === 0 ? (
                      <option value="">Nenhum dispositivo</option>
                    ) : (
                      audioInputDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microfone ${device.deviceId.substring(0, 8)}`}
                        </option>
                      ))
                    )}
                  </MasterDeviceSelect>
                  <RefreshDevicesButton
                    onClick={scanInputDevices}
                    disabled={isScanningInputs}
                    title="Escanear dispositivos"
                  >
                    {isScanningInputs ? '⏳' : '🔄'}
                  </RefreshDevicesButton>
                </DeviceSelectRow>
              </MicDeviceSelector>
            )}
            
            <ControlButtons>
              {/* Botão ON/OFF para MIC */}
              {config.key === 'mic' && onMicToggle && (
                <ControlButton
                  $active={micActive}
                  $color={config.color}
                  onClick={() => onMicToggle()}
                  title={micActive ? 'Desligar Microfone' : 'Ligar Microfone'}
                  style={{
                    minWidth: '40px',
                    fontSize: '0.6rem',
                    fontWeight: 800
                  }}
                >
                  {micActive ? 'ON' : 'OFF'}
                </ControlButton>
              )}
              <ControlButton
                $active={muted[config.key]}
                $color={config.color}
                onClick={() => handleMute(config.key)}
                title={muted[config.key] ? 'Desmutar' : 'Mutar'}
              >
                M
              </ControlButton>
              <ControlButton
                $active={solo[config.key]}
                $color={config.color}
                onClick={() => handleSolo(config.key)}
                title={solo[config.key] ? 'Desativar Solo' : 'Ativar Solo'}
              >
                S
              </ControlButton>
            </ControlButtons>
          </ChannelHeader>
          
          <FaderContainer>
            <FaderTrack
              ref={el => faderRefs.current[config.key] = el}
              onMouseDown={(e) => handleSliderMouseDown(config.key, e)}
            >
              <FaderInput
                type="range"
                min="0"
                max="100"
                value={muted[config.key] ? 0 : channels[config.key]}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value);
                  onChannelChange(config.key, newValue);
                }}
              />
              <FaderFill
                $value={muted[config.key] ? 0 : channels[config.key]}
                $colorGradient={config.colorGradient}
                $glowColor={config.glowColor}
                $active={channels[config.key] > 75}
              />
            </FaderTrack>
          </FaderContainer>
          
          <ValueDisplay 
            $value={muted[config.key] ? 0 : channels[config.key]}
            $color={config.color}
          >
            {muted[config.key] ? 'MUTED' : `${channels[config.key]}%`}
          </ValueDisplay>
        </SmartChannelButton>
      ))}
    </SmartButtonsContainer>
  );
};

export default SmartChannelButtons;

