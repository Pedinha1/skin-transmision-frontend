import apiClient from './apiClient';

const mascotService = {
  // Obter ou criar mascote
  async getOrCreateMascot() {
    try {
      const response = await apiClient.get('/api/mascot');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter mascote:', error);
      throw error;
    }
  },

  // Obter estatísticas do mascote
  async getStats() {
    try {
      const response = await apiClient.get('/api/mascot/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  },

  // Atualizar mascote
  async updateMascot(id, updates) {
    try {
      const response = await apiClient.put(`/api/mascot/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar mascote:', error);
      throw error;
    }
  },

  // Processar mensagem (com filtro de profanidade)
  async processMessage(message) {
    try {
      const response = await apiClient.post('/api/mascot/process-message', { message });
      return response.data;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      throw error;
    }
  },

  // Processar pedido (com filtro de profanidade)
  async processRequest(request) {
    try {
      const response = await apiClient.post('/api/mascot/process-request', { request });
      return response.data;
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      throw error;
    }
  },

  // Adicionar comando
  async addCommand(id, command, action) {
    try {
      const response = await apiClient.post(`/api/mascot/${id}/commands`, { command, action });
      return response.data;
    } catch (error) {
      console.error('Erro ao adicionar comando:', error);
      throw error;
    }
  }
};

export default mascotService;

