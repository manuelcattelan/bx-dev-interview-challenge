/**
 * @jest-environment jsdom
 */
import axios from "axios";
import authService from "./auth";
import { SignUpData, SignInData } from "./auth";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

const mockLocationReplace = jest.fn();
(global as any).window = Object.create(window);
(global as any).window.location = { href: "", replace: mockLocationReplace };

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("signUp", () => {
    it("should sign up user and store token", async () => {
      const signUpData: SignUpData = {
        email: "test@example.com",
        password: "password123",
      };
      const mockResponse = {
        data: { accessToken: "test-token" },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authService.signUp(signUpData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3000/api/auth/sign-up",
        signUpData
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "accessToken",
        "test-token"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle signup error", async () => {
      const signUpData: SignUpData = {
        email: "test@example.com",
        password: "password123",
      };
      const mockError = new Error("Sign up failed");
      mockedAxios.post.mockRejectedValue(mockError);

      await expect(authService.signUp(signUpData)).rejects.toThrow(
        "Sign up failed"
      );
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("signIn", () => {
    it("should sign in user and store token", async () => {
      const signInData: SignInData = {
        email: "test@example.com",
        password: "password123",
      };
      const mockResponse = {
        data: { accessToken: "test-token" },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authService.signIn(signInData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "http://localhost:3000/api/auth/sign-in",
        signInData
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "accessToken",
        "test-token"
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("logout", () => {
    it("should remove token from localStorage", () => {
      authService.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("accessToken");
    });
  });

  describe("getAuthenticationToken", () => {
    it("should return token from localStorage", () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      const result = authService.getAuthenticationToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith("accessToken");
      expect(result).toBe("test-token");
    });

    it("should return null when no token exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getAuthenticationToken();

      expect(result).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("should return true when token exists", () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it("should return false when no token exists", () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("setupAxiosInterceptors", () => {
    it("should setup request interceptor to add auth header", () => {
      mockLocalStorage.getItem.mockReturnValue("test-token");
      const mockConfig = { headers: {} };

      authService.setupAxiosInterceptors();

      const requestInterceptor = (
        mockedAxios.interceptors.request.use as jest.Mock
      ).mock.calls[0][0];
      const result = requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBe("Bearer test-token");
    });
  });
});
