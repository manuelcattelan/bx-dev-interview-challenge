import axios, { AxiosResponse } from "axios";

const API_BASE_URL = "http://localhost:3000/api";

export interface AuthResponse {
  accessToken: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private accessTokenStorageKey = "accessToken";

  async register(data: RegisterData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${API_BASE_URL}/auth/register`,
      data,
    );

    const { accessToken } = response.data;
    localStorage.setItem(this.accessTokenStorageKey, accessToken);

    return response.data;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await axios.post(
      `${API_BASE_URL}/auth/login`,
      data,
    );

    const { accessToken } = response.data;
    localStorage.setItem(this.accessTokenStorageKey, accessToken);

    return response.data;
  }

  logout(): void {
    localStorage.removeItem(this.accessTokenStorageKey);
  }

  getAuthenticationToken(): string | null {
    return localStorage.getItem(this.accessTokenStorageKey);
  }

  isAuthenticated(): boolean {
    return this.getAuthenticationToken() !== null;
  }

  setupAxiosInterceptors(): void {
    axios.interceptors.request.use(
      (config) => {
        const token = this.getAuthenticationToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );
  }
}

export default new AuthService();
