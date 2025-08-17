const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  async logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Game endpoints
  async startGameSession(gameType, difficulty = 'beginner') {
    return this.request('/games/start-session', {
      method: 'POST',
      body: JSON.stringify({
        gameType,
        sessionData: {
          startTime: new Date().toISOString(),
          difficulty,
        },
      }),
    });
  }

  async endGameSession(sessionId, performance, gameSpecificData) {
    return this.request(`/games/end-session/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify({
        performance,
        gameSpecificData,
      }),
    });
  }

  // User endpoints
  async getUserProfile() {
    return this.request('/users/profile');
  }

  async getUserStats() {
    return this.request('/users/stats');
  }

  // Analysis endpoints (will work when AI services are available)
  async analyzeSpeech(audioData, gameType) {
    return this.request('/analysis/speech', {
      method: 'POST',
      body: JSON.stringify({
        audioData,
        gameType,
      }),
    });
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch('http://localhost:5000/health');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new ApiService();
