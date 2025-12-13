import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const WebcamContainer = styled.div`
  width: 100%;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(6, 182, 212, 0.3);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const WebcamHeader = styled.div`
  padding: 0.8rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%);
  border-bottom: 1px solid rgba(6, 182, 212, 0.2);
`;

const WebcamTitle = styled.div`
  color: #f1f5f9;
  font-weight: 700;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 1px;
  text-transform: uppercase;
  
  span {
    font-size: 1.1rem;
    background: linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
`;

const ToggleButton = styled.button`
  background: ${props => props.$active 
    ? 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
  };
  border: ${props => props.$active 
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
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: ${props => props.$active 
    ? '0 4px 15px rgba(6, 182, 212, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
  };

  &:hover {
    box-shadow: ${props => props.$active 
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

const VideoContainer = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  position: relative;
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Espelha horizontalmente para efeito espelho */
`;

const Placeholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.8) 100%);
  color: #64748b;
  font-size: 2rem;
  gap: 12px;
`;

const PlaceholderText = styled.div`
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 6px;
  color: #fca5a5;
  font-size: 0.75rem;
  text-align: center;
  margin: 0.5rem;
`;

const WebcamPanel = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      startWebcam();
    } else {
      stopWebcam();
    }

    return () => {
      stopWebcam();
    };
  }, [isActive]);

  const startWebcam = async () => {
    try {
      setError(null);
      
      // Solicitar acesso à webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 360 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Erro ao acessar webcam:', err);
      setError('Não foi possível acessar a webcam. Verifique as permissões.');
      setIsActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleWebcam = () => {
    setIsActive(!isActive);
  };

  return (
    <WebcamContainer>
      <WebcamHeader>
        <WebcamTitle>
          <span>📹</span> Webcam
        </WebcamTitle>
        <ToggleButton $active={isActive} onClick={toggleWebcam}>
          {isActive ? '● Ligada' : '○ Desligada'}
        </ToggleButton>
      </WebcamHeader>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {isActive ? (
        <VideoContainer $show={true}>
          <Video ref={videoRef} autoPlay playsInline muted />
        </VideoContainer>
      ) : (
        <VideoContainer $show={true}>
          <Placeholder>
            <div>📹</div>
            <PlaceholderText>Webcam Desligada</PlaceholderText>
          </Placeholder>
        </VideoContainer>
      )}
    </WebcamContainer>
  );
};

export default WebcamPanel;

