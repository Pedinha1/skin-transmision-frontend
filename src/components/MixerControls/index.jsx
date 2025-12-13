import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { pulse } from '../../styles/animations';

// VU Meter
const VUMeterContainer = styled.div`
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 10px;
  padding: 4px;
  width: 100%;
  max-width: 210px;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`;

const VUTitle = styled.div`
  color: #22d3ee;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 2px;
`;

const VUDisplay = styled.div`
  display: flex;
  gap: 2px;
  height: 112px;
  align-items: flex-end;
  justify-content: center;
  padding: 2px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 6px;
  border: 1px solid rgba(6, 182, 212, 0.2);
`;

const VULED = styled.div`
  width: 8px;
  height: ${props => props.$height}%;
  background: ${props => {
    const h = props.$height;
    if (h > 90) return 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)';
    if (h > 75) return 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)';
    if (h > 50) return 'linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%)';
    return 'linear-gradient(180deg, #06b6d4 0%, #0891b2 100%)';
  }};
  border-radius: 2px;
  box-shadow: ${props => {
    const h = props.$height;
    if (h > 90) return '0 0 8px rgba(239, 68, 68, 0.8)';
    if (h > 75) return '0 0 6px rgba(251, 191, 36, 0.6)';
    if (h > 50) return '0 0 4px rgba(34, 211, 238, 0.5)';
    return '0 0 2px rgba(6, 182, 212, 0.3)';
  }};
  transition: height 0.1s ease;
`;

const VULabels = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  font-size: 0.6rem;
  color: #64748b;
  font-weight: 600;
`;

// Canais
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
  box-shadow: 
    0 8px 25px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  height: 100%;
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
    rgba(15, 23, 42, 0.9) 0%,
    rgba(30, 41, 59, 0.9) 50%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border-radius: 5px;
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
    return 'linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%)';
  }};
  border-radius: 5px;
  box-shadow: ${props => {
    if (props.$value > 90) return '0 -3px 15px rgba(239, 68, 68, 0.8)';
    if (props.$value > 75) return '0 -3px 12px rgba(251, 191, 36, 0.6)';
    return '0 -3px 10px rgba(34, 211, 238, 0.5)';
  }};
  transition: height 0.1s ease;
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
  font-weight: 700;
  color: ${props => {
    if (props.$value > 90) return '#ef4444';
    if (props.$value > 75) return '#fbbf24';
    return '#22d3ee';
  }};
  text-align: center;
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.3);
  min-width: 40px;
`;

// Master Channel
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
  box-shadow: 
    0 8px 25px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  height: 100%;
`;

const MasterDeviceSelector = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
`;

const MasterDeviceLabel = styled.label`
  font-size: 0.6rem;
  color: #ef4444;
  font-weight: 600;
  text-transform: uppercase;
`;

const MasterDeviceSelectWrapper = styled.div`
  display: flex;
  gap: 2px;
  width: 100%;
  align-items: center;
`;

const MasterDeviceSelect = styled.select`
  flex: 1;
  min-width: 0;
  padding: 2px 3px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.8);
  color: #f1f5f9;
  font-size: 0.55rem;
  font-weight: 600;
  cursor: pointer;
  height: 18px;
`;

const RefreshDevicesButton = styled.button`
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%);
  border: 1px solid rgba(6, 182, 212, 0.4);
  color: #22d3ee;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  transition: all 0.1s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
`;

// MIC Section
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
  box-shadow: 
    0 8px 25px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  height: 100%;
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

const MicDeviceSelector = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 6px;
`;

const MicDeviceLabel = styled.label`
  font-size: 0.6rem;
  color: #fbbf24;
  font-weight: 600;
  text-transform: uppercase;
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
  height: 18px;
`;

const MicButtonContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 4px;
`;

const MicButton = styled.button`
  width: 45px;
  height: 45px;
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)'
  };
  border: 2px solid ${props => props.$active ? '#fbbf24' : 'rgba(251, 191, 36, 0.4)'};
  color: ${props => props.$active ? '#0f172a' : '#fbbf24'};
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  transition: all 0.3s ease;
  box-shadow: ${props => props.$active 
    ? '0 0 25px rgba(251, 191, 36, 0.8), 0 4px 15px rgba(0, 0, 0, 0.3)'
    : '0 4px 15px rgba(0, 0, 0, 0.3)'
  };
`;

const MicVULEDContainer = styled.div`
  display: flex;
  gap: 2px;
  flex: 1;
  height: 45px;
  align-items: flex-end;
  justify-content: center;
  padding: 2px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
`;

const MicVULED = styled.div`
  width: 4px;
  height: ${props => props.$level}%;
  background: ${props => props.$active 
    ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
    : 'rgba(100, 116, 139, 0.3)'
  };
  border-radius: 2px;
  box-shadow: ${props => props.$active && props.$level > 50
    ? '0 0 4px rgba(251, 191, 36, 0.6)'
    : 'none'
  };
  transition: height 0.1s ease;
`;

const MicStatus = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  color: ${props => props.$active ? '#fbbf24' : '#64748b'};
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: ${props => props.$active ? '0 0 8px rgba(251, 191, 36, 0.5)' : 'none'};
`;

const PeakMeter = styled.div`
  width: 100%;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: ${props => props.$peak}%;
    height: 100%;
    background: ${props => {
      if (props.$peak > 90) return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
      if (props.$peak > 75) return 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)';
      return 'linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%)';
    }};
    transition: width 0.1s ease;
    box-shadow: ${props => props.$peak > 75 
      ? '0 0 8px rgba(251, 191, 36, 0.6)'
      : 'none'
    };
  }
`;

// EQ Section
const EQSection = styled.div`
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -2px 4px rgba(0, 0, 0, 0.8),
    0 2px 8px rgba(6, 182, 212, 0.2);
`;

const EQHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const EQTitle = styled.div`
  color: #22d3ee;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
`;

const EQControls = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const EQRow = styled.div`
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: flex-end;
  height: 180px;
  padding: 4px;
`;

const EQFader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 24px;
`;

const EQFaderTrack = styled.div`
  width: 16px;
  height: 180px;
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.9) 0%,
    rgba(30, 41, 59, 0.9) 50%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
`;

const EQFaderInput = styled.input`
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
  transform: rotate(-90deg);
  transform-origin: center;
  writing-mode: vertical-lr;
`;

const EQLabel = styled.div`
  font-size: 0.5rem;
  color: #94a3b8;
  font-weight: 600;
  text-align: center;
  writing-mode: horizontal-tb;
`;

const EffectsSection = styled.div`
  background: linear-gradient(180deg, 
    rgba(15, 23, 42, 0.95) 0%, 
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 4px;
  padding: 4px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
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
  border-radius: 2px;
  background: rgba(15, 23, 42, 0.8);
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
    cursor: pointer;
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
  }
  
  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: linear-gradient(135deg, #a78bfa, #8b5cf6);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
  }
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

// Container principal
const ControlsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

const ControlsRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: stretch;
`;

const Fader = ({ label, color, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const faderRef = useRef(null);
  const startValueRef = useRef(0);
  const startYRef = useRef(0);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && faderRef.current) {
      const rect = faderRef.current.getBoundingClientRect();
      const deltaY = startYRef.current - e.clientY;
      const height = rect.height;
      const deltaPercent = (deltaY / height) * 100;
      const newValue = Math.max(0, Math.min(100, startValueRef.current + deltaPercent));
      onChange(newValue);
    }
  }, [isDragging, onChange]);

  return (
    <ChannelStrip>
      <ChannelLabel $color={color}>{label}</ChannelLabel>
      <FaderWrapper>
        <FaderInput
          ref={faderRef}
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => {
            if (!isDragging) {
              const newValue = parseInt(e.target.value);
              startValueRef.current = newValue;
              onChange(newValue);
            }
          }}
          onMouseDown={(e) => {
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
            setIsDragging(true);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
          }}
        />
        <FaderTrack>
          <FaderFill $value={value} />
        </FaderTrack>
      </FaderWrapper>
      <ValueDisplay $value={value}>
        {value}%
      </ValueDisplay>
    </ChannelStrip>
  );
};

const MixerControls = ({
  musicAudioRef = null,
  jingleAudioRefs = null,
  onMicStreamChange = () => {},
  micGain = 0,
  audioContext = null,
  mediaElementSource = null
}) => {
  const [channels, setChannels] = useState({
    master: 80,
    music: 75,
    mic: 0,
    fx: 65
  });

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
  const [vuLevels, setVuLevels] = useState(new Array(20).fill(0));
  const [micActive, setMicActive] = useState(false);
  const [micVuLevel, setMicVuLevel] = useState(0);
  const [micLEDLevels, setMicLEDLevels] = useState(new Array(12).fill(0));
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [selectedMicDeviceId, setSelectedMicDeviceId] = useState(null);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState(null);
  const [isDraggingMic, setIsDraggingMic] = useState(false);
  const [isDraggingEQ, setIsDraggingEQ] = useState({
    band31: false, band62: false, band125: false, band250: false, band500: false,
    band1k: false, band2k: false, band4k: false, band8k: false, band16k: false
  });

  const micFaderRef = useRef(null);
  const micStartValueRef = useRef(0);
  const micStartYRef = useRef(0);
  const micMediaStreamRef = useRef(null);
  const micAudioContextRef = useRef(null);
  const micAnalyserRef = useRef(null);
  const micAnimationRef = useRef(null);
  const micGainNodeRef = useRef(null);
  const micSourceRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioSourceRef = useRef(null);
  const eqNodesRef = useRef({});
  const compressorNodeRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const masterGainNodeRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  // Enumerate devices
  const enumerateDevices = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    } catch (permError) {
      console.warn('Permissão não concedida:', permError);
    }
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
    
    setAudioInputDevices(audioInputs);
    setAudioOutputDevices(audioOutputs);
    
    if (audioInputs.length > 0 && !selectedMicDeviceId) {
      setSelectedMicDeviceId(audioInputs[0].deviceId);
    }
    if (audioOutputs.length > 0 && !selectedOutputDeviceId) {
      setSelectedOutputDeviceId(audioOutputs[0].deviceId);
    }
  }, [selectedMicDeviceId, selectedOutputDeviceId]);

  useEffect(() => {
    enumerateDevices();
  }, []);

  // Apply audio output
  const applyAudioOutput = useCallback(async (deviceId) => {
    if (!deviceId) return;
    
    try {
      const allAudioElements = document.querySelectorAll('audio');
      for (const audio of allAudioElements) {
        if (audio.setSinkId) {
          await audio.setSinkId(deviceId);
        }
      }
    } catch (error) {
      console.error('Erro ao aplicar saída de áudio:', error);
    }
  }, []);

  const handleOutputDeviceChange = useCallback((deviceId) => {
    setSelectedOutputDeviceId(deviceId);
    applyAudioOutput(deviceId);
  }, [applyAudioOutput]);

  // Control music volume
  useEffect(() => {
    if (musicAudioRef && musicAudioRef.current) {
      musicAudioRef.current.volume = channels.music / 100;
    }
  }, [channels.music, musicAudioRef]);

  // Control jingles volume
  useEffect(() => {
    if (jingleAudioRefs) {
      Object.values(jingleAudioRefs).forEach(audio => {
        if (audio && audio.current) {
          audio.current.volume = channels.fx / 100;
        }
      });
    }
  }, [channels.fx, jingleAudioRefs]);

  // VU Meter animation
  useEffect(() => {
    if (!musicAudioRef || !musicAudioRef.current) {
      setVuLevels(new Array(20).fill(0));
      return;
    }

    const audio = musicAudioRef.current;
    
    // Limpar referências anteriores se necessário
    if (audioContextRef.current && (!audioContext || !mediaElementSource)) {
      // Se não temos props, mas temos contexto antigo, limpar
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    // Inicializar ou reutilizar AudioContext e Analyser
    if (!audioContextRef.current || !analyserRef.current) {
      // Se recebemos AudioContext e MediaElementSource como props, usar eles
      if (audioContext && mediaElementSource) {
        // Usar AudioContext e MediaElementSource existentes
        audioContextRef.current = audioContext;
        
        // Criar um GainNode para dividir o sinal do MediaElementSource existente
        const vuInputGain = audioContext.createGain();
        vuInputGain.gain.value = 1.0;
        
        // Conectar o MediaElementSource existente ao vuInputGain
        try {
          mediaElementSource.connect(vuInputGain);
          audioSourceRef.current = vuInputGain;
          
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 64;
          analyserRef.current.smoothingTimeConstant = 0.8;
          audioSourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContext.destination);
          
          console.log('✅ VU Meter conectado ao MediaElementSource existente via GainNode');
        } catch (error) {
          console.warn('⚠️ Erro ao conectar MediaElementSource ao VU Meter:', error);
          setVuLevels(new Array(20).fill(0));
          return;
        }
      } else {
        // Tentar criar novo MediaElementSource - pode falhar se já estiver conectado
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          audioSourceRef.current = audioContextRef.current.createMediaElementSource(audio);
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 64;
          analyserRef.current.smoothingTimeConstant = 0.8;
          audioSourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          console.log('✅ VU Meter criado com novo AudioContext');
        } catch (error) {
          // Elemento já está conectado - não podemos criar outro MediaElementSource
          console.warn('⚠️ VU Meter desabilitado: elemento de áudio já está conectado. Passe audioContext e mediaElementSource como props.');
          setVuLevels(new Array(20).fill(0));
          return;
        }
      }
    }

    // Função de atualização do VU Meter
    const updateVU = () => {
      if (analyserRef.current && audio && !audio.paused && audio.currentTime > 0) {
        try {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const levels = [];
          for (let i = 0; i < 20; i++) {
            const index = Math.floor((i / 20) * dataArray.length);
            const value = (dataArray[index] / 255) * 100;
            levels.push(Math.max(0, Math.min(100, value)));
          }
          
          setVuLevels(prev => {
            // Só atualizar se houver mudança significativa
            const hasChange = levels.some((level, i) => Math.abs(level - prev[i]) > 1);
            return hasChange ? levels : prev;
          });
        } catch (error) {
          console.warn('⚠️ Erro ao ler dados do VU Meter:', error);
          setVuLevels(new Array(20).fill(0));
        }
      } else {
        setVuLevels(prev => {
          // Resetar gradualmente se não estiver tocando
          const allZero = prev.every(level => level === 0);
          return allZero ? prev : new Array(20).fill(0);
        });
      }
      
      animationRef.current = requestAnimationFrame(updateVU);
    };

    // Iniciar animação
    if (!animationRef.current) {
      updateVU();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [musicAudioRef, audioContext, mediaElementSource]);

  // Mic toggle
  const handleMicToggle = useCallback(async () => {
    // Função desativada - não faz nada
    return;
    
    // Código original comentado
    /*
    if (micActive) {
      if (micMediaStreamRef.current) {
        micMediaStreamRef.current.getTracks().forEach(track => track.stop());
        micMediaStreamRef.current = null;
      }
      if (micAudioContextRef.current) {
        await micAudioContextRef.current.close();
        micAudioContextRef.current = null;
      }
      if (micAnimationRef.current) {
        cancelAnimationFrame(micAnimationRef.current);
        micAnimationRef.current = null;
      }
      setMicActive(false);
      setMicVuLevel(0);
      setMicLEDLevels(new Array(12).fill(0));
      if (onMicStreamChange) {
        onMicStreamChange(null);
      }
    } else {
      try {
        const constraints = {
          audio: selectedMicDeviceId ? { deviceId: { exact: selectedMicDeviceId } } : true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        micMediaStreamRef.current = stream;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        micAudioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        micSourceRef.current = source;
        
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 32;
        micAnalyserRef.current = analyser;
        
        const gainNode = audioContext.createGain();
        gainNode.gain.value = channels.mic / 100;
        micGainNodeRef.current = gainNode;
        
        source.connect(gainNode);
        gainNode.connect(analyser);
        analyser.connect(audioContext.destination);
        
        const updateMicVU = () => {
          if (analyser && micActive) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            const level = (average / 255) * 100;
            setMicVuLevel(level);
            
            const ledLevels = [];
            for (let i = 0; i < 12; i++) {
              const threshold = (i / 12) * 100;
              ledLevels.push(level > threshold ? 100 : 0);
            }
            setMicLEDLevels(ledLevels);
          }
          micAnimationRef.current = requestAnimationFrame(updateMicVU);
        };
        updateMicVU();
        
        setMicActive(true);
        if (onMicStreamChange) {
          onMicStreamChange(stream);
        }
      } catch (error) {
        console.error('Erro ao ativar microfone:', error);
        alert('Erro ao ativar microfone: ' + error.message);
      }
    }
    */
  }, []);

  const handleMicDeviceChange = useCallback((deviceId) => {
    setSelectedMicDeviceId(deviceId);
    if (micActive) {
      handleMicToggle();
      setTimeout(() => handleMicToggle(), 100);
    }
  }, [micActive, handleMicToggle]);

  // EQ render function
  const renderEQFader = (bandName, frequency, label) => {
    const value = eq[bandName] || 50;
    const isDragging = isDraggingEQ[bandName] || false;
    
    return (
      <EQFader key={bandName}>
        <EQFaderTrack>
          <EQFaderInput
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => {
              const newValue = parseInt(e.target.value);
              setEq(prev => ({ ...prev, [bandName]: newValue }));
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: `${value}%`,
            left: 0,
            right: 0,
            height: `${Math.abs(value - 50) * 2}%`,
            background: value > 50 
              ? 'linear-gradient(180deg, rgba(34, 211, 238, 0.4) 0%, rgba(34, 211, 238, 0.2) 100%)'
              : 'linear-gradient(0deg, rgba(251, 191, 36, 0.4) 0%, rgba(251, 191, 36, 0.2) 100%)',
            borderRadius: '2px',
          }} />
        </EQFaderTrack>
        <EQLabel>{label}</EQLabel>
      </EQFader>
    );
  };

  const handleReset = () => {
    setChannels({ master: 80, music: 75, mic: 0, fx: 65 });
    setEq({
      band31: 50, band62: 50, band125: 50, band250: 50, band500: 50,
      band1k: 50, band2k: 50, band4k: 50, band8k: 50, band16k: 50
    });
    setEffects({
      compressor: { enabled: false, threshold: -24, ratio: 4, attack: 0.003, release: 0.25 },
      reverb: { enabled: false, roomSize: 0.5, dampening: 0.5, wet: 0.3 },
      delay: { enabled: false, time: 0.25, feedback: 0.3, wet: 0.2 }
    });
  };

  return (
    <ControlsContainer>
      <ControlsRow>
        <MasterChannelContainer>
          <MasterDeviceSelector>
            <MasterDeviceLabel>Saída:</MasterDeviceLabel>
            <MasterDeviceSelectWrapper>
              <MasterDeviceSelect
                value={selectedOutputDeviceId || ''}
                onChange={(e) => handleOutputDeviceChange(e.target.value)}
              >
                {audioOutputDevices.length === 0 ? (
                  <option value="">Nenhum dispositivo encontrado</option>
                ) : (
                  audioOutputDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Saída ${device.deviceId.substring(0, 8)}`}
                    </option>
                  ))
                )}
              </MasterDeviceSelect>
              <RefreshDevicesButton
                onClick={enumerateDevices}
                title="Atualizar lista de dispositivos de áudio"
              >
                🔄
              </RefreshDevicesButton>
            </MasterDeviceSelectWrapper>
          </MasterDeviceSelector>
          <Fader
            label="MASTER"
            color="#ef4444"
            value={channels.master}
            onChange={(v) => setChannels({ ...channels, master: v })}
          />
        </MasterChannelContainer>

        {/* VU Meter */}
        <VUMeterContainer>
          <VUTitle>VU METER</VUTitle>
          <VUDisplay>
            {vuLevels.map((level, index) => (
              <VULED key={index} $height={level} />
            ))}
          </VUDisplay>
          <VULabels>
            <span>0</span>
            <span>100</span>
          </VULabels>
        </VUMeterContainer>

        <Fader
          label="MUSIC"
          color="#22d3ee"
          value={channels.music}
          onChange={(v) => setChannels({ ...channels, music: v })}
        />

        <Fader
          label="FX"
          color="#06b6d4"
          value={channels.fx}
          onChange={(v) => setChannels({ ...channels, fx: v })}
        />

        <MicSection>
          <MicTitle>🎤 MIC</MicTitle>
          
          <MicDeviceSelector>
            <MicDeviceLabel>Dispositivo:</MicDeviceLabel>
            <MicDeviceSelect
              value={selectedMicDeviceId || ''}
              onChange={(e) => handleMicDeviceChange(e.target.value)}
              disabled={micActive}
            >
              {audioInputDevices.length === 0 ? (
                <option value="">Nenhum dispositivo encontrado</option>
              ) : (
                audioInputDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microfone ${device.deviceId.substring(0, 8)}`}
                  </option>
                ))
              )}
            </MicDeviceSelect>
          </MicDeviceSelector>
          
          <MicButtonContainer>
            <MicButton $active={micActive} onClick={() => {}} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              {micActive ? 'ON' : 'OFF'}
            </MicButton>
            
            <MicVULEDContainer>
              {micLEDLevels.map((ledLevel, index) => (
                <MicVULED
                  key={index}
                  $level={ledLevel}
                  $active={micActive}
                />
              ))}
            </MicVULEDContainer>
          </MicButtonContainer>
          
          <MicStatus $active={micActive}>
            {micActive ? '● LIVE' : '○ MUTED'}
          </MicStatus>
          
          <PeakMeter $peak={micActive ? micVuLevel : 0} />
          <FaderWrapper>
            <FaderInput
              ref={micFaderRef}
              type="range"
              min="0"
              max="100"
              value={channels.mic}
              onChange={(e) => {
                if (!isDraggingMic) {
                  const newValue = parseInt(e.target.value);
                  micStartValueRef.current = newValue;
                  setChannels({ ...channels, mic: newValue });
                }
              }}
              onMouseDown={(e) => {
                if (micFaderRef.current) {
                  const rect = micFaderRef.current.getBoundingClientRect();
                  const clickY = e.clientY - rect.top;
                  const height = rect.height;
                  const clickPercent = ((height - clickY) / height) * 100;
                  const newValue = Math.round(Math.max(0, Math.min(100, clickPercent)));
                  micStartValueRef.current = newValue;
                  micStartYRef.current = e.clientY;
                  setChannels({ ...channels, mic: newValue });
                }
                setIsDraggingMic(true);
                const handleMouseMove = (e) => {
                  if (micFaderRef.current) {
                    const rect = micFaderRef.current.getBoundingClientRect();
                    const deltaY = micStartYRef.current - e.clientY;
                    const height = rect.height;
                    const deltaPercent = (deltaY / height) * 100;
                    const newValue = Math.round(Math.max(0, Math.min(100, micStartValueRef.current + deltaPercent)));
                    setChannels({ ...channels, mic: newValue });
                  }
                };
                const handleMouseUp = () => {
                  setIsDraggingMic(false);
                  window.removeEventListener('mousemove', handleMouseMove);
                  window.removeEventListener('mouseup', handleMouseUp);
                };
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
              }}
            />
            <FaderTrack 
              $isDragging={isDraggingMic}
              style={{
                background: 'linear-gradient(180deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.3) 30%, rgba(251, 191, 36, 0.4) 70%, rgba(251, 191, 36, 0.5) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.4)'
              }}
            >
              <FaderFill 
                $value={channels.mic} 
                $isDragging={isDraggingMic}
                style={{
                  background: 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                  boxShadow: isDraggingMic 
                    ? '0 -3px 20px rgba(251, 191, 36, 0.9), 0 0 30px rgba(251, 191, 36, 0.5)' 
                    : '0 -3px 15px rgba(251, 191, 36, 0.6)'
                }} 
              />
            </FaderTrack>
          </FaderWrapper>
          <ValueDisplay $value={channels.mic} style={{
            color: '#fbbf24',
            textShadow: '0 0 8px rgba(251, 191, 36, 0.5)',
            border: '1px solid rgba(251, 191, 36, 0.4)'
          }}>
            {channels.mic}%
          </ValueDisplay>
        </MicSection>
      </ControlsRow>
    </ControlsContainer>
  );
};

export default MixerControls;

