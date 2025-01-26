import api from './api.service';

class AuthService {
  async login(email, password) {
    const response = await api.post('/users/login', {
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response;
  }

  async register(name, email, password) {
    const response = await api.post('/users/register', {
      name,
      email,
      password,
    });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response;
  }

  async verifyEmail(token) {
    return await api.post('/auth/verify-email', { token });
  }

  async forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email });
  }

  async resetPassword(token, password) {
    return await api.post('/auth/reset-password', { token, password });
  }

  async changePassword(currentPassword, newPassword) {
    return await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  async updateProfile(userData) {
    return await api.patch('/auth/profile', userData);
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post('/auth/refresh-token', { refreshToken });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response;
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem('user'));
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export default new AuthService();
