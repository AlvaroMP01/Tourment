import axios from 'axios';

const API_BASE = '/api';

// Backend API Service
export const backendApi = {
  // Test connection
  async testConnection() {
    try {
      const response = await axios.get(`${API_BASE}/`);
      return response.data;
    } catch (error) {
      console.error('Error connecting to backend:', error);
      return null;
    }
  },

  // Test database connection
  async testDatabase() {
    try {
      const response = await axios.get(`${API_BASE}/test-db`);
      return response.data;
    } catch (error) {
      console.error('Error testing database:', error);
      return null;
    }
  },

  // Future endpoints can be added here as the backend develops
  // For example:
  // async getTournaments() { ... }
  // async createTournament(data) { ... }
  // async getTeams() { ... }
  // etc.
};

export default backendApi;
