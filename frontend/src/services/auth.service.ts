import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

class AuthService {
  private tokenKey = 'access_token';
  private userKey = 'user';

  async login(data: LoginData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${API_BASE_URL}/auth/login`,
      data
    );
    
    const { access_token, user } = response.data;
    
    // Store token and user data
    localStorage.setItem(this.tokenKey, access_token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${API_BASE_URL}/auth/register`,
      data
    );
    
    const { access_token, user } = response.data;
    
    // Store token and user data
    localStorage.setItem(this.tokenKey, access_token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    
    return response.data;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  setupAxiosInterceptors(): void {
    // Add token to all requests
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle 401 responses
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
}

export default new AuthService(); 