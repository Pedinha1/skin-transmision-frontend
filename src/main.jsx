import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Suprimir erros de WebSocket globalmente antes de qualquer inicialização
(function suppressWebSocketErrors() {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Função para verificar se é um erro de WebSocket que deve ser suprimido
  const isWebSocketError = (message) => {
    if (!message) return false;
    const messageStr = typeof message === 'string' ? message : 
                      message?.message || message?.toString() || JSON.stringify(message);
    const lowerMessage = messageStr.toLowerCase();
    
    // Verificar padrões específicos do erro reportado
    // Exemplo: "socket__io-client.js WebSocket connection to 'ws://localhost:8080/socket.io/?EIO=4&transport=websocket' failed:"
    const socketIOPatterns = [
      'socket__io-client',
      'socket.io-client',
      'websocket connection to',
      'ws://localhost:8080/socket.io',
      'socket.io/?eio=4',
      'transport=websocket',
      'websocket',
      'socket.io'
    ];
    
    const errorPatterns = [
      'failed',
      'closed',
      'connection',
      'before the connection is established',
      'websocket is closed',
      'websocket is closed before',
      'transport',
      'eio=4',
      'eio=',
      'localhost:8080',
      'err_connection_refused',
      'connection_refused',
      'net::err_connection_refused',
      'get http://localhost:8080/socket.io',
      'transport=polling'
    ];
    
    // Verificar se contém padrões do Socket.IO
    const hasSocketIOPattern = socketIOPatterns.some(pattern => 
      lowerMessage.includes(pattern)
    );
    
    // Verificar se contém padrões de erro
    const hasErrorPattern = errorPatterns.some(pattern => 
      lowerMessage.includes(pattern)
    );
    
    // Verificar padrão de URL WebSocket
    const hasWebSocketURL = /ws:\/\/|wss:\/\//.test(messageStr);
    
    // Verificar se é erro de conexão recusada
    const isConnectionRefused = lowerMessage.includes('connection_refused') || 
                                lowerMessage.includes('err_connection_refused') ||
                                lowerMessage.includes('net::err');
    
    return (hasSocketIOPattern || hasWebSocketURL || isConnectionRefused) && 
           (hasErrorPattern || hasWebSocketURL || isConnectionRefused);
  };
  
  console.error = (...args) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || JSON.stringify(arg)
    ).join(' ');
    
    if (isWebSocketError(message)) {
      return; // Suprimir erro silenciosamente
    }
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || JSON.stringify(arg)
    ).join(' ');
    
    if (isWebSocketError(message)) {
      return; // Suprimir aviso silenciosamente
    }
    originalWarn.apply(console, args);
  };
  
  const originalLog = console.log;
  console.log = (...args) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : 
      arg?.message || arg?.toString() || JSON.stringify(arg)
    ).join(' ');
    
    // Suprimir logs relacionados a tentativas de conexão Socket.IO quando o servidor não está disponível
    if (isWebSocketError(message) || 
        (message.includes('🔌 [Socket] Tentativa') && message.includes('Transports')) ||
        (message.includes('🔄 [Socket] WebSocket falhou'))) {
      return; // Suprimir log silenciosamente
    }
    originalLog.apply(console, args);
  };
  
  // Também interceptar eventos de erro não tratados
  window.addEventListener('error', (event) => {
    const errorMessage = event.message || event.error?.message || event.filename || '';
    if (isWebSocketError(errorMessage)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);
  
  // Interceptar erros não tratados em Promises
  window.addEventListener('unhandledrejection', (event) => {
    const errorMessage = event.reason?.message || event.reason?.toString() || '';
    if (isWebSocketError(errorMessage)) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Interceptar erros de rede (fetch, XMLHttpRequest, etc.)
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
      const errorMessage = error?.message || error?.toString() || '';
      if (isWebSocketError(errorMessage) || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        // Suprimir erro silenciosamente
        return Promise.reject(new Error('Connection refused (suppressed)'));
      }
      return Promise.reject(error);
    });
  };
  
  // Interceptar XMLHttpRequest errors
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(...args) {
    this._url = args[1];
    return originalXHROpen.apply(this, args);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('error', function(event) {
      const errorMessage = this._url || event?.message || '';
      if (isWebSocketError(errorMessage) || errorMessage.includes('socket.io') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        event.stopPropagation();
        event.preventDefault();
      }
    }, true);
    
    return originalXHRSend.apply(this, args);
  };
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)

