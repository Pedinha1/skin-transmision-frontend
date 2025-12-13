import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background: transparent;
  backdrop-filter: none;
  border: none;
  border-radius: 0;
  padding: 0;
  margin: 0;
  box-shadow: none;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  font-weight: 900;
  background: linear-gradient(135deg, #ff0050 0%, #ff4081 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  
  span {
    font-size: 1.4rem;
  }
`;

const StatusBadge = styled.div`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  background: ${props => props.$connected 
    ? 'linear-gradient(135deg, rgba(255, 0, 80, 0.2) 0%, rgba(255, 64, 129, 0.15) 100%)'
    : 'linear-gradient(135deg, rgba(100, 116, 139, 0.2) 0%, rgba(71, 85, 105, 0.15) 100%)'
  };
  border: 2px solid ${props => props.$connected ? 'rgba(255, 0, 80, 0.5)' : 'rgba(100, 116, 139, 0.3)'};
  color: ${props => props.$connected ? '#ff4081' : '#94a3b8'};
  display: flex;
  align-items: center;
  gap: 8px;
  
  &::before {
    content: '●';
    font-size: 0.7rem;
    color: ${props => props.$connected ? '#ff0050' : '#64748b'};
    animation: ${props => props.$connected ? 'pulse 2s infinite' : 'none'};
  }
`;

const Form = styled.form`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border-radius: 10px;
  border: 2px solid rgba(255, 0, 80, 0.3);
  background: rgba(15, 23, 42, 0.8);
  color: #f1f5f9;
  font-size: 0.9rem;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: rgba(255, 0, 80, 0.6);
    box-shadow: 0 0 15px rgba(255, 0, 80, 0.2);
  }
  
  &::placeholder {
    color: #64748b;
  }
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 10px;
  border: none;
  background: ${props => props.$connected 
    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
    : 'linear-gradient(135deg, #ff0050 0%, #ff4081 100%)'
  };
  color: white;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255, 0, 80, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Info = styled.div`
  padding: 12px;
  background: rgba(255, 0, 80, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 0, 80, 0.2);
  font-size: 0.85rem;
  color: #cbd5e1;
  line-height: 1.6;
  
  strong {
    color: #ff4081;
  }
  
  a {
    color: #ff4081;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const TikTokIntegration = () => {
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

  // Verificar status ao montar
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/tiktok/status`);
      const data = await response.json();
      
      if (data.success && data.status) {
        setIsConnected(data.status.connected || false);
        setStatus(data.status);
      }
    } catch (error) {
      // Silenciar erro se não houver conexão
      console.warn('Erro ao verificar status TikTok:', error);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Por favor, informe o nome de usuário do TikTok');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/tiktok/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim().replace('@', ''), // Remover @ se houver
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setError(null);
        await checkStatus();
      } else {
        setError(data.message || 'Erro ao conectar ao TikTok');
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setError('Erro ao conectar ao TikTok. Verifique se o servidor está rodando.');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/tiktok/disconnect`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(false);
        setStatus(null);
        setError(null);
      } else {
        setError(data.message || 'Erro ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setError('Erro ao desconectar do TikTok');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>
          <span>🎵</span> TikTok Live Chat
        </Title>
        <StatusBadge $connected={isConnected}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </StatusBadge>
      </Header>

      <Form onSubmit={handleConnect}>
        <Input
          type="text"
          placeholder="@seu_usuario_tiktok (sem @)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isConnected || isConnecting}
        />
        <Button
          type={isConnected ? 'button' : 'submit'}
          $connected={isConnected}
          onClick={isConnected ? handleDisconnect : null}
          disabled={isConnecting}
        >
          {isConnecting 
            ? 'Conectando...' 
            : isConnected 
              ? 'Desconectar' 
              : 'Conectar'
          }
        </Button>
      </Form>

      {error && (
        <Info style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
          ⚠️ {error}
        </Info>
      )}

      {status && isConnected && (
        <Info>
          <strong>Status:</strong> Conectado como @{status.username || 'N/A'}<br/>
          {status.roomId && <><strong>Room ID:</strong> {status.roomId}</>}
        </Info>
      )}

      <Info>
        <strong>📌 Instruções:</strong><br/>
        1. Para usar, instale a biblioteca: <code>npm install tiktok-live-connector</code> no backend<br/>
        2. Informe seu nome de usuário do TikTok (sem @)<br/>
        3. Certifique-se de que está ao vivo no TikTok<br/>
        4. As mensagens do chat aparecerão automaticamente aqui e o robô as lerá
      </Info>
    </Container>
  );
};

export default TikTokIntegration;

