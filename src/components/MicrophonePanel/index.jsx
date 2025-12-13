import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { pulseScale as pulse } from '../../styles/animations';

const Container = styled.div`
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.6) 0%, rgba(20, 20, 40, 0.6) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.4);
  }
`;

const Header = styled.div`
  color: #94a3b8;
  font-size: 0.7rem;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  letter-spacing: 1.5px;
`;

const MicButton = styled.button`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
  };
  border: 3px solid ${props => props.$active ? '#ef4444' : '#475569'};
  color: white;
  font-size: 1.1rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active 
    ? '0 0 30px rgba(239, 68, 68, 0.6), 0 8px 20px rgba(0, 0, 0, 0.4)'
    : '0 4px 15px rgba(0, 0, 0, 0.3)'
  };
  margin-bottom: 1rem;
  animation: ${props => props.$active ? pulse : 'none'} 2s infinite;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 0 40px ${props => props.$active ? 'rgba(239, 68, 68, 0.8)' : 'rgba(99, 102, 241, 0.5)'};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StatusText = styled.div`
  color: ${props => props.$active ? '#ef4444' : '#64748b'};
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
  letter-spacing: 1.5px;
  text-shadow: ${props => props.$active ? '0 0 10px rgba(239, 68, 68, 0.5)' : 'none'};
`;

const VUMeter = styled.div`
  width: 12px;
  height: 110px;
  background: rgba(20, 20, 40, 0.8);
  border-radius: 6px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const VUMeterFill = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${props => props.$level}%;
  background: linear-gradient(
    to top, 
    #10b981 0%, 
    #10b981 60%,
    #f59e0b 60%, 
    #f59e0b 85%,
    #ef4444 85%, 
    #ef4444 100%
  );
  transition: height 0.1s ease;
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
`;

const GainKnob = styled.div`
  margin-top: 1.5rem;
  text-align: center;
`;

const GainLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
`;

const GainValue = styled.div`
  font-size: 0.9rem;
  color: ${props => props.$active ? '#10b981' : '#475569'};
  font-weight: 700;
  font-family: 'Courier New', monospace;
  text-shadow: ${props => props.$active ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'};
`;

const MicrophonePanel = ({ onMicStreamChange, micGain = 1.0 }) => {
  const [isActive, setIsActive] = useState(false);
  const [vuLevel, setVuLevel] = useState(0);
  const [gain, setGain] = useState(2.5);
  
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationRef = useRef(null);

  // Inicializar AudioContext e Analyser
  useEffect(() => {
    if (isActive) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Criar gain node para controlar volume
      const gainNode = audioContext.createGain();
      gainNode.gain.value = micGain;
      gainNodeRef.current = gainNode;

      // Solicitar acesso ao microfone
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaStreamRef.current = stream;
          
          // Criar source do stream
          const source = audioContext.createMediaStreamSource(stream);
          sourceNodeRef.current = source;
          
          // Conectar: source -> gain -> analyser -> destination
          source.connect(gainNode);
          gainNode.connect(analyser);
          analyser.connect(audioContext.destination); // Para monitoramento local
          
          // Notificar o componente pai sobre o stream
          if (onMicStreamChange) {
            onMicStreamChange(stream);
          }

          // Animar VU Meter
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          
          const updateVU = () => {
            if (!isActive) return;
            
            analyser.getByteFrequencyData(dataArray);
            
            // Calcular nível médio
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            
            // Converter para porcentagem (0-100)
            const level = Math.min(100, (average / 255) * 100 * 1.5);
            setVuLevel(level);
            
            animationRef.current = requestAnimationFrame(updateVU);
          };
          
          updateVU();
        })
        .catch(err => {
          console.error('Erro ao acessar microfone:', err);
          alert('Erro ao acessar o microfone. Verifique as permissões do navegador.');
          setIsActive(false);
        });
    } else {
      // Parar captura
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch (e) {}
        sourceNodeRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      setVuLevel(0);
      
      // Notificar componente pai
      if (onMicStreamChange) {
        onMicStreamChange(null);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  // Atualizar gain quando prop mudar
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = micGain;
    }
  }, [micGain]);

  const handleToggle = async () => {
    // Função desativada - não faz nada
    return;
  };

  // Calcular gain em dB
  const gainDb = isActive ? gain : 0.0;

  return (
    <Container>
      <Header>
        <span>🎤 Microphone</span>
      </Header>
      
      <MicButton $active={isActive} onClick={() => {}} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
        {isActive ? 'ON' : 'OFF'}
      </MicButton>
      
      <StatusText $active={isActive}>
        {isActive ? '● LIVE' : '○ MUTED'}
      </StatusText>

      <VUMeter>
        <VUMeterFill $level={isActive ? vuLevel : 8} />
      </VUMeter>

      <GainKnob>
        <GainLabel>Gain</GainLabel>
        <GainValue $active={isActive}>
          {gainDb > 0 ? '+' : ''}{gainDb.toFixed(1)} dB
        </GainValue>
      </GainKnob>
    </Container>
  );
};

export default MicrophonePanel;
