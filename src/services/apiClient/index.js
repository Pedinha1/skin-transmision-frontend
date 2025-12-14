import axios from 'axios';

// Garantir que a URL do backend está correta
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE;
  
  // Se não estiver configurado, usar localhost em desenvolvimento
  if (!envUrl) {
    if (import.meta.env.DEV) {
      return 'http://localhost:8080';
    }
    // Em produção, se não estiver configurado, mostrar erro
    console.error('❌ VITE_API_BASE não está configurado! Configure a variável de ambiente.');
    return '';
  }
  
  // Remover barra no final se houver
  return envUrl.replace(/\/$/, '');
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`📡 [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log de erro em desenvolvimento
    if (import.meta.env.DEV) {
      console.error('❌ [API] Erro na requisição:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        status: error.response?.status,
        message: error.message
      });
    }
    
    // Se for erro 404 e a baseURL estiver vazia, mostrar mensagem mais clara
    if (error.config?.baseURL === '' || !error.config?.baseURL) {
      console.error('❌ [API] VITE_API_BASE não está configurado! Configure a variável de ambiente no seu serviço de hospedagem.');
    }
    
    return Promise.reject(error);
  }
);

export default api;

