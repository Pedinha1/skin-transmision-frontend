import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

// Graphic EQ Digital - Estilo Moderno
const EQContainer = styled.div`
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -2px 4px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(6, 182, 212, 0.2),
    0 0 20px rgba(6, 182, 212, 0.1);
  width: 100%;
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
    background: linear-gradient(90deg, 
      transparent, 
      rgba(6, 182, 212, 0.6), 
      rgba(34, 211, 238, 0.8),
      rgba(6, 182, 212, 0.6),
      transparent
    );
  }
`;

const EQHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
`;

const EQTitle = styled.div`
  color: #22d3ee;
  font-size: 0.9rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EQControls = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ToggleButton = styled.button`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(34, 211, 238, 0.2) 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: 1px solid ${props => props.$active ? 'rgba(34, 211, 238, 0.5)' : 'rgba(6, 182, 212, 0.3)'};
  color: ${props => props.$active ? '#22d3ee' : '#64748b'};
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active 
    ? '0 0 10px rgba(34, 211, 238, 0.3), 0 2px 4px rgba(0, 0, 0, 0.3)'
    : '0 2px 4px rgba(0, 0, 0, 0.3)'
  };
  
  &:hover {
    border-color: rgba(34, 211, 238, 0.6);
    color: #22d3ee;
  }
`;

const ResetButton = styled.button`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(6, 182, 212, 0.3);
  color: #22d3ee;
  width: 32px;
  height: 32px;
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
  }
`;

const EQBank = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: flex-end;
  padding: 16px 8px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.6) 0%,
    rgba(30, 41, 59, 0.6) 50%,
    rgba(15, 23, 42, 0.6) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.6);
  min-height: 200px;
  position: relative;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent,
      rgba(6, 182, 212, 0.4),
      rgba(34, 211, 238, 0.6),
      rgba(6, 182, 212, 0.4),
      transparent
    );
    transform: translateY(-50%);
    z-index: 1;
  }
`;

const EQChannel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
  position: relative;
  overflow: visible;
  max-width: 100%;
`;

const EQSliderTrack = styled.div`
  width: 20px;
  height: 180px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.9) 0%,
    rgba(30, 41, 59, 0.9) 50%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border-radius: 10px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  position: relative;
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.8),
    inset 0 -1px 2px rgba(255, 255, 255, 0.05),
    0 1px 3px rgba(6, 182, 212, 0.2);
  overflow: hidden;
  box-sizing: border-box;
  cursor: pointer;
`;

const EQSliderFill = styled.div`
  position: absolute;
  bottom: 50%;
  left: 0;
  right: 0;
  width: 100%;
  height: ${props => {
    const diff = Math.abs(props.$value - 50);
    return `${Math.min(diff * 1.8, 90)}%`;
  }};
  max-height: 90%;
  background: ${props => {
    if (props.$value > 50) {
      return 'linear-gradient(180deg, rgba(34, 211, 238, 0.9) 0%, rgba(6, 182, 212, 0.7) 50%, rgba(6, 182, 212, 0.5) 100%)';
    } else if (props.$value < 50) {
      return 'linear-gradient(0deg, rgba(251, 191, 36, 0.9) 0%, rgba(245, 158, 11, 0.7) 50%, rgba(245, 158, 11, 0.5) 100%)';
    } else {
      return 'transparent';
    }
  }};
  border-radius: ${props => props.$value > 50 ? '0 0 8px 8px' : props.$value < 50 ? '8px 8px 0 0' : '0'};
  box-shadow: ${props => {
    if (props.$value > 50) {
      return '0 -2px 10px rgba(34, 211, 238, 0.7), inset 0 1px 2px rgba(255, 255, 255, 0.2)';
    } else if (props.$value < 50) {
      return '0 2px 10px rgba(251, 191, 36, 0.7), inset 0 -1px 2px rgba(255, 255, 255, 0.2)';
    }
    return 'none';
  }};
  transition: height 0.1s ease, background 0.1s ease;
  z-index: 2;
  ${props => props.$value !== 50 && `
    border: 1px solid ${props.$value > 50 ? 'rgba(34, 211, 238, 0.6)' : 'rgba(251, 191, 36, 0.6)'};
  `}
`;

const EQSliderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
  margin: 0;
  padding: 0;
`;

const EQFrequencyLabel = styled.div`
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 700;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 0;
  min-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
`;

const EQValueDisplay = styled.div`
  font-size: 0.55rem;
  color: ${props => {
    if (props.$value > 50) return '#22d3ee';
    if (props.$value < 50) return '#fbbf24';
    return '#64748b';
  }};
  font-weight: 800;
  text-align: center;
  padding: 2px 4px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 4px;
  border: 1px solid ${props => {
    if (props.$value > 50) return 'rgba(34, 211, 238, 0.3)';
    if (props.$value < 50) return 'rgba(251, 191, 36, 0.3)';
    return 'rgba(6, 182, 212, 0.2)';
  }};
  min-width: 36px;
  box-shadow: ${props => props.$value !== 50 ? '0 0 6px rgba(34, 211, 238, 0.3)' : 'none'};
`;

const EffectsRack = styled.div`
  margin-top: 12px;
  padding: 10px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.5) 0%,
    rgba(30, 41, 59, 0.5) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.2);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const EffectModule = styled.div`
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
`;

const EffectHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
`;

const EffectLabel = styled.label`
  font-size: 0.65rem;
  color: #cbd5e1;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  
  input[type="checkbox"] {
    cursor: pointer;
    width: 12px;
    height: 12px;
    accent-color: #22d3ee;
  }
`;

const EffectControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EffectControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EffectControlLabel = styled.label`
  font-size: 0.6rem;
  color: #94a3b8;
  font-weight: 600;
`;

const EffectSlider = styled.input`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: rgba(15, 23, 42, 0.8);
  outline: none;
  -webkit-appearance: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: linear-gradient(135deg, #22d3ee, #06b6d4);
    cursor: pointer;
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.2s ease;
  }
  
  &::-webkit-slider-thumb:hover {
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
  
  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: linear-gradient(135deg, #22d3ee, #06b6d4);
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 0 8px rgba(34, 211, 238, 0.6), 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  &::-moz-range-thumb:hover {
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.8), 0 2px 6px rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
  
  &::-webkit-slider-runnable-track {
    background: linear-gradient(90deg, 
      rgba(15, 23, 42, 0.8) 0%,
      rgba(6, 182, 212, 0.3) 50%,
      rgba(15, 23, 42, 0.8) 100%
    );
    height: 4px;
    border-radius: 2px;
  }
  
  &::-moz-range-track {
    background: linear-gradient(90deg, 
      rgba(15, 23, 42, 0.8) 0%,
      rgba(6, 182, 212, 0.3) 50%,
      rgba(15, 23, 42, 0.8) 100%
    );
    height: 4px;
    border-radius: 2px;
  }
`;

const GraphicEQ = ({ 
  musicAudioRef = null,
  audioContext = null,
  mediaElementSource = null
}) => {
  const [eq, setEq] = useState({
    band31: 50, band62: 50, band125: 50, band250: 50, band500: 50,
    band1k: 50, band2k: 50, band4k: 50, band8k: 50, band16k: 50
  });

  const [effects, setEffects] = useState({
    compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
    reverb: { enabled: false, roomSize: 0.5, dampening: 0.5, wet: 0.3 },
    delay: { enabled: false, time: 0.25, feedback: 0.3, wet: 0.2 }
  });

  const [eqEnabled, setEqEnabled] = useState(true);
  const [isDragging, setIsDragging] = useState({});
  const sliderRefs = useRef({});
  const startValuesRef = useRef({});
  const startYRef = useRef({});

  // Audio processing nodes
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const eqNodesRef = useRef({});
  const compressorNodeRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const masterGainNodeRef = useRef(null);

  // Initialize audio processing
  useEffect(() => {
    if (!musicAudioRef || !musicAudioRef.current) return;

    const audio = musicAudioRef.current;
    
    try {
      if (!audioContextRef.current) {
        // Se recebemos AudioContext e MediaElementSource como props, usar eles
        // Priorizar usar as props passadas para evitar conflitos
        if (audioContext && mediaElementSource) {
          // Usar AudioContext e MediaElementSource existentes
          audioContextRef.current = audioContext;
          
          // Criar um GainNode para dividir o sinal do MediaElementSource existente
          // O MediaElementSource pode ter múltiplas conexões, então podemos conectar diretamente
          const eqInputGain = audioContext.createGain();
          eqInputGain.gain.value = 1.0;
          
          // Conectar o MediaElementSource existente ao eqInputGain
          // Isso divide o sinal: uma parte vai para as conexões existentes, outra para o EQ
          try {
            mediaElementSource.connect(eqInputGain);
            audioSourceRef.current = eqInputGain;
            console.log('✅ EQ conectado ao MediaElementSource existente via GainNode');
          } catch (error) {
            console.warn('⚠️ Erro ao conectar MediaElementSource ao EQ:', error);
            audioContextRef.current = null;
            return;
          }
        } else {
          // Se não temos as props necessárias, aguardar até que estejam disponíveis
          // Não tentar criar um novo MediaElementSource pois pode causar conflitos
          // O componente será reinicializado quando as props estiverem disponíveis
          return;
        }
        
        if (!audioContextRef.current) return;
        
        masterGainNodeRef.current = audioContextRef.current.createGain();
        
        // Create EQ nodes for 10 bands
        const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
        frequencies.forEach((freq, index) => {
          const filter = audioContextRef.current.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1;
          filter.gain.value = 0;
          eqNodesRef.current[`band${freq === 1000 ? '1k' : freq}`] = filter;
        });
        
        // Create effects nodes
        compressorNodeRef.current = audioContextRef.current.createDynamicsCompressor();
        compressorNodeRef.current.threshold.value = -24;
        compressorNodeRef.current.ratio.value = 4;
        compressorNodeRef.current.attack.value = 0.003;
        compressorNodeRef.current.release.value = 0.25;
        
        reverbNodeRef.current = audioContextRef.current.createConvolver();
        delayNodeRef.current = audioContextRef.current.createDelay(1.0);
        delayNodeRef.current.delayTime.value = 0.25;
        
        // Connect: source -> EQ -> effects -> master -> destination
        let currentNode = audioSourceRef.current;
        
        // Connect EQ bands in series
        Object.values(eqNodesRef.current).forEach(node => {
          currentNode.connect(node);
          currentNode = node;
        });
        
        // Connect to compressor
        currentNode.connect(compressorNodeRef.current);
        currentNode = compressorNodeRef.current;
        
        // Connect to delay
        const delayGain = audioContextRef.current.createGain();
        const delayWetGain = audioContextRef.current.createGain();
        delayGain.gain.value = 1 - effects.delay.wet;
        delayWetGain.gain.value = effects.delay.wet;
        
        currentNode.connect(delayGain);
        currentNode.connect(delayNodeRef.current);
        delayNodeRef.current.connect(delayWetGain);
        
        const delayMerge = audioContextRef.current.createGain();
        delayGain.connect(delayMerge);
        delayWetGain.connect(delayMerge);
        currentNode = delayMerge;
        
        // Connect to master gain
        currentNode.connect(masterGainNodeRef.current);
        masterGainNodeRef.current.connect(audioContextRef.current.destination);
      }
    } catch (error) {
      console.warn('Erro ao inicializar processamento de áudio:', error);
    }

    return () => {
      // Cleanup será feito quando necessário
    };
  }, [musicAudioRef, audioContext, mediaElementSource, effects.delay.wet]);

  // Apply EQ changes
  useEffect(() => {
    if (!eqEnabled || !eqNodesRef.current) return;

    Object.keys(eq).forEach(bandName => {
      const node = eqNodesRef.current[bandName];
      if (node) {
        const value = eq[bandName];
        const dbValue = ((value - 50) / 50) * 12; // -12dB to +12dB
        node.gain.value = dbValue;
      }
    });
  }, [eq, eqEnabled]);

  // Apply effects
  useEffect(() => {
    if (compressorNodeRef.current) {
      compressorNodeRef.current.threshold.value = effects.compressor.enabled ? effects.compressor.threshold : -1000;
      compressorNodeRef.current.ratio.value = effects.compressor.ratio;
    }
  }, [effects.compressor]);

  useEffect(() => {
    if (delayNodeRef.current) {
      delayNodeRef.current.delayTime.value = effects.delay.enabled ? effects.delay.time : 0;
    }
  }, [effects.delay.time, effects.delay.enabled]);

  const handleSliderMouseDown = (bandName, e) => {
    const slider = sliderRefs.current[bandName];
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const height = rect.height;
    const clickPercent = ((height - clickY) / height) * 100;
    const newValue = Math.round(Math.max(0, Math.min(100, clickPercent)));
    
    startValuesRef.current[bandName] = newValue;
    startYRef.current[bandName] = e.clientY;
    setIsDragging(prev => ({ ...prev, [bandName]: true }));
    setEq(prev => ({ ...prev, [bandName]: newValue }));

    const handleMouseMove = (e) => {
      const deltaY = startYRef.current[bandName] - e.clientY;
      const height = rect.height;
      const deltaPercent = (deltaY / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, startValuesRef.current[bandName] + deltaPercent)));
      setEq(prev => ({ ...prev, [bandName]: newValue }));
    };

    const handleMouseUp = () => {
      setIsDragging(prev => ({ ...prev, [bandName]: false }));
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleSliderTouchStart = (bandName, e) => {
    const slider = sliderRefs.current[bandName];
    if (!slider) return;

    const touch = e.touches[0];
    const rect = slider.getBoundingClientRect();
    const touchY = touch.clientY - rect.top;
    const height = rect.height;
    const touchPercent = ((height - touchY) / height) * 100;
    const newValue = Math.round(Math.max(0, Math.min(100, touchPercent)));
    
    startValuesRef.current[bandName] = newValue;
    startYRef.current[bandName] = touch.clientY;
    setIsDragging(prev => ({ ...prev, [bandName]: true }));
    setEq(prev => ({ ...prev, [bandName]: newValue }));

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const deltaY = startYRef.current[bandName] - touch.clientY;
      const height = rect.height;
      const deltaPercent = (deltaY / height) * 100;
      const newValue = Math.round(Math.max(0, Math.min(100, startValuesRef.current[bandName] + deltaPercent)));
      setEq(prev => ({ ...prev, [bandName]: newValue }));
    };

    const handleTouchEnd = () => {
      setIsDragging(prev => ({ ...prev, [bandName]: false }));
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const renderEQChannel = (bandName, frequency, label) => {
    const value = eq[bandName] || 50;
    const dbValue = ((value - 50) / 50) * 12; // -12dB a +12dB
    const isDraggingBand = isDragging[bandName] || false;
    
    return (
      <EQChannel key={bandName}>
        <EQSliderTrack
          ref={el => sliderRefs.current[bandName] = el}
          onMouseDown={(e) => handleSliderMouseDown(bandName, e)}
          onTouchStart={(e) => handleSliderTouchStart(bandName, e)}
        >
          <EQSliderInput
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setEq(prev => ({ ...prev, [bandName]: newValue }));
            }}
            onInput={(e) => {
              const newValue = parseInt(e.target.value);
              setEq(prev => ({ ...prev, [bandName]: newValue }));
            }}
          />
          <EQSliderFill $value={value} $isDragging={isDraggingBand} />
        </EQSliderTrack>
        <EQFrequencyLabel>{label}</EQFrequencyLabel>
        <EQValueDisplay $value={value}>
          {dbValue > 0 ? '+' : ''}{dbValue.toFixed(1)}dB
        </EQValueDisplay>
      </EQChannel>
    );
  };

  const handleResetEQ = () => {
    setEq({
      band31: 50, band62: 50, band125: 50, band250: 50, band500: 50,
      band1k: 50, band2k: 50, band4k: 50, band8k: 50, band16k: 50
    });
  };

  return (
    <EQContainer>
      <EQHeader>
        <EQTitle>🎚️ Graphic Equalizer</EQTitle>
        <EQControls>
          <ToggleButton
            $active={eqEnabled}
            onClick={() => setEqEnabled(!eqEnabled)}
          >
            {eqEnabled ? '● ON' : '○ OFF'}
          </ToggleButton>
          <ResetButton onClick={handleResetEQ} title="Reset EQ">
            ↺
          </ResetButton>
        </EQControls>
      </EQHeader>
      
      <EQBank style={{ opacity: eqEnabled ? 1 : 0.4 }}>
        {renderEQChannel('band31', 31, '31Hz')}
        {renderEQChannel('band62', 62, '62Hz')}
        {renderEQChannel('band125', 125, '125Hz')}
        {renderEQChannel('band250', 250, '250Hz')}
        {renderEQChannel('band500', 500, '500Hz')}
        {renderEQChannel('band1k', 1000, '1kHz')}
        {renderEQChannel('band2k', 2000, '2kHz')}
        {renderEQChannel('band4k', 4000, '4kHz')}
        {renderEQChannel('band8k', 8000, '8kHz')}
        {renderEQChannel('band16k', 16000, '16kHz')}
      </EQBank>
      
      <EffectsRack>
        <EffectModule>
          <EffectHeader>
            <EffectLabel>
              <input
                type="checkbox"
                checked={effects.compressor.enabled}
                onChange={(e) => setEffects(prev => ({
                  ...prev,
                  compressor: { ...prev.compressor, enabled: e.target.checked }
                }))}
              />
              Compressor
            </EffectLabel>
          </EffectHeader>
          {effects.compressor.enabled && (
            <EffectControls>
              <EffectControl>
                <EffectControlLabel>Threshold: {effects.compressor.threshold}dB</EffectControlLabel>
                <EffectSlider
                  type="range"
                  min="-60"
                  max="0"
                  value={effects.compressor.threshold}
                  onChange={(e) => setEffects(prev => ({
                    ...prev,
                    compressor: { ...prev.compressor, threshold: parseFloat(e.target.value) }
                  }))}
                />
              </EffectControl>
              <EffectControl>
                <EffectControlLabel>Ratio: {effects.compressor.ratio}:1</EffectControlLabel>
                <EffectSlider
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={effects.compressor.ratio}
                  onChange={(e) => setEffects(prev => ({
                    ...prev,
                    compressor: { ...prev.compressor, ratio: parseFloat(e.target.value) }
                  }))}
                />
              </EffectControl>
            </EffectControls>
          )}
        </EffectModule>
        
        <EffectModule>
          <EffectHeader>
            <EffectLabel>
              <input
                type="checkbox"
                checked={effects.reverb.enabled}
                onChange={(e) => setEffects(prev => ({
                  ...prev,
                  reverb: { ...prev.reverb, enabled: e.target.checked }
                }))}
              />
              Reverb
            </EffectLabel>
          </EffectHeader>
          {effects.reverb.enabled && (
            <EffectControls>
              <EffectControl>
                <EffectControlLabel>Wet: {Math.round(effects.reverb.wet * 100)}%</EffectControlLabel>
                <EffectSlider
                  type="range"
                  min="0"
                  max="100"
                  value={effects.reverb.wet * 100}
                  onChange={(e) => setEffects(prev => ({
                    ...prev,
                    reverb: { ...prev.reverb, wet: parseFloat(e.target.value) / 100 }
                  }))}
                />
              </EffectControl>
            </EffectControls>
          )}
        </EffectModule>
        
        <EffectModule>
          <EffectHeader>
            <EffectLabel>
              <input
                type="checkbox"
                checked={effects.delay.enabled}
                onChange={(e) => setEffects(prev => ({
                  ...prev,
                  delay: { ...prev.delay, enabled: e.target.checked }
                }))}
              />
              Delay
            </EffectLabel>
          </EffectHeader>
          {effects.delay.enabled && (
            <EffectControls>
              <EffectControl>
                <EffectControlLabel>Tempo: {effects.delay.time.toFixed(2)}s</EffectControlLabel>
                <EffectSlider
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.01"
                  value={effects.delay.time}
                  onChange={(e) => setEffects(prev => ({
                    ...prev,
                    delay: { ...prev.delay, time: parseFloat(e.target.value) }
                  }))}
                />
              </EffectControl>
              <EffectControl>
                <EffectControlLabel>Feedback: {Math.round(effects.delay.feedback * 100)}%</EffectControlLabel>
                <EffectSlider
                  type="range"
                  min="0"
                  max="90"
                  value={effects.delay.feedback * 100}
                  onChange={(e) => setEffects(prev => ({
                    ...prev,
                    delay: { ...prev.delay, feedback: parseFloat(e.target.value) / 100 }
                  }))}
                />
              </EffectControl>
              <EffectControl>
                <EffectControlLabel>Wet: {Math.round(effects.delay.wet * 100)}%</EffectControlLabel>
                <EffectSlider
                  type="range"
                  min="0"
                  max="100"
                  value={effects.delay.wet * 100}
                  onChange={(e) => setEffects(prev => ({
                    ...prev,
                    delay: { ...prev.delay, wet: parseFloat(e.target.value) / 100 }
                  }))}
                />
              </EffectControl>
            </EffectControls>
          )}
        </EffectModule>
      </EffectsRack>
    </EQContainer>
  );
};

export default GraphicEQ;
