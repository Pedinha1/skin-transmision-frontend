import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 6px;
  background: transparent;
  backdrop-filter: none;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
`;

const VignetteButton = styled.button`
  background: ${props => props.$playing 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: ${props => props.$playing 
    ? '1px solid rgba(6, 182, 212, 0.5)'
    : '1px solid rgba(6, 182, 212, 0.3)'
  };
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: ${props => props.$playing 
    ? '0 4px 15px rgba(6, 182, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  height: auto;
  min-height: 60px;

  &:hover {
    box-shadow: ${props => props.$playing 
      ? '0 6px 25px rgba(6, 182, 212, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25)'
      : '0 4px 15px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
    };
    border-color: #22d3ee;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const KeyLabel = styled.span`
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 0.6rem;
  color: ${props => props.$playing ? '#fff' : '#64748b'};
  font-family: 'Courier New', monospace;
  font-weight: 700;
  text-shadow: ${props => props.$playing ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'};
`;

const Icon = styled.div`
  font-size: 1.2rem;
  animation: ${props => props.$playing ? 'pulse 0.5s infinite' : 'none'};
  margin-bottom: 2px;
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }
`;

const SubLabel = styled.span`
  font-size: 0.65rem;
  color: white;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

const Container = styled.div`
  flex: 1;
  margin-top: 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #f1f5f9;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 1.5px;
`;

const AddButton = styled.button`
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%);
  border: 2px dashed rgba(6, 182, 212, 0.5);
  color: #22d3ee;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
  font-weight: 800;
  font-size: 1.1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;

  &:hover {
    background: linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(34, 211, 238, 0.3) 100%);
    border-style: solid;
    border-color: #22d3ee;
    box-shadow: 0 4px 15px rgba(6, 182, 212, 0.4);
  }
`;

const FileInput = styled.input`
  display: none;
`;

const AddJingleButton = styled.div`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  background: rgba(6, 182, 212, 0.3);
  border: 1px solid rgba(6, 182, 212, 0.5);
  color: #22d3ee;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  box-sizing: border-box;
  
  &:hover {
    background: rgba(6, 182, 212, 0.5);
    border-color: #22d3ee;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const AudioIndicator = styled.div`
  position: absolute;
  bottom: 2px;
  left: 2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 4px #10b981;
  animation: pulse 1.5s infinite;
`;

const VignettePanel = ({ jingles, onPlayJingle, onAddJingle, onAddJingleToSlot, currentlyPlaying, jingleAudios }) => {
  const fileInputRefs = useRef({});

  const defaultJingles = [
    { id: 'f1', key: 'F1', name: 'Applause', type: 'SFX', color: '#ef4444', icon: '👏' },
    { id: 'f2', key: 'F2', name: 'Laugh', type: 'SFX', color: '#f59e0b', icon: '😂' },
    { id: 'f3', key: 'F3', name: 'Boas Vindas', type: 'JINGLE', color: '#8b5cf6', icon: '🎺' },
    { id: 'f4', key: 'F4', name: 'Station ID', type: 'ID', color: '#10b981', icon: '📻' },
    { id: 'f5', key: 'F5', name: 'Hora Certa', type: 'TIME', color: '#06b6d4', icon: '🕐' },
    { id: 'f6', key: 'F6', name: 'News', type: 'BREAK', color: '#ec4899', icon: '📰' },
    { id: 'f7', key: 'F7', name: 'Alert', type: 'SFX', color: '#ef4444', icon: '🚨' },
    { id: 'f8', key: 'F8', name: 'Outro', type: 'JINGLE', color: '#10b981', icon: '🎵' },
  ];

  const handleAddJingle = () => {
    fileInputRefs.current['general']?.click();
  };

  const handleAddJingleToSlot = (jingleId, e) => {
    e.stopPropagation(); // Evitar que o clique no botão dispare o jingle
    fileInputRefs.current[jingleId]?.click();
  };

  const handleFileChange = (e, jingleId = null) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (jingleId && onAddJingleToSlot) {
        // Adicionar MP3 a um jingle específico
        onAddJingleToSlot(jingleId, files[0]);
      } else if (onAddJingle) {
        // Adicionar jingles gerais
        onAddJingle(files);
      }
    }
    e.target.value = ''; // Reset input
  };

  const handleJingleClick = (jingleId) => {
    if (onPlayJingle) {
      onPlayJingle(jingleId);
    }
  };

  // Combinar jingles padrão com jingles adicionados pelo usuário
  const allJingles = [...defaultJingles, ...(jingles || [])];

  return (
    <Container>
      <FileInput
        ref={el => fileInputRefs.current['general'] = el}
        type="file"
        accept="audio/*"
        multiple
        onChange={(e) => handleFileChange(e)}
      />
      <Grid>
        {allJingles.slice(0, 8).map(jingle => {
          const isPlaying = currentlyPlaying === jingle.id;
          const hasAudio = jingleAudios && jingleAudios[jingle.id];
          return (
            <VignetteButton
              key={jingle.id}
              color={jingle.color}
              $playing={isPlaying}
              onClick={() => handleJingleClick(jingle.id)}
              title={`${jingle.name} - Pressione ${jingle.key}${hasAudio ? ' (MP3 carregado)' : ''}`}
            >
              <KeyLabel $playing={isPlaying}>{jingle.key}</KeyLabel>
              <Icon color={jingle.color} $playing={isPlaying}>{jingle.icon}</Icon>
              <SubLabel color={jingle.color} $playing={isPlaying}>{jingle.name}</SubLabel>
              {hasAudio && <AudioIndicator />}
              <AddJingleButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddJingleToSlot(jingle.id, e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddJingleToSlot(jingle.id, e);
                  }
                }}
                role="button"
                tabIndex={0}
                title="Adicionar MP3 para este jingle"
              >
                +
              </AddJingleButton>
              <FileInput
                ref={el => fileInputRefs.current[jingle.id] = el}
                type="file"
                accept="audio/*"
                onChange={(e) => handleFileChange(e, jingle.id)}
              />
            </VignetteButton>
          );
        })}
      </Grid>
    </Container>
  );
};

export default VignettePanel;
