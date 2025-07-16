import axios, { AxiosResponse } from "axios";
import { API_BASE_URL } from "../common/config";

export interface AuthenticationResponse {
  accessToken: string;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  private accessTokenStorageKey = "accessToken";

  async signUp(data: SignUpData): Promise<AuthenticationResponse> {
    const response: AxiosResponse<AuthenticationResponse> = await axios.post(
      `${API_BASE_URL}/auth/sign-up`,
      data
    );

    const { accessToken } = response.data;
    localStorage.setItem(this.accessTokenStorageKey, accessToken);

    return response.data;
  }

  async signIn(data: SignInData): Promise<AuthenticationResponse> {
    const response: AxiosResponse<AuthenticationResponse> = await axios.post(
      `${API_BASE_URL}/auth/sign-in`,
      data
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
      (error) => {
        return Promise.reject(error);
      }
    );
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          this.logout();
          window.location.href = "/sign-in";
        }
        return Promise.reject(error);
      }
    );
  }
}

export default new AuthService();
