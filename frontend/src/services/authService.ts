import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  RefreshTokenRequest,
  ChangePasswordRequest,
  UserProfile,
} from '../types/auth';




interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  errors: string[];
  timestamp: string;
}

const API_BASE_URL = 'http://localhost:5000/api';

class AuthService {
  private getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private storeTokens(authResponse: AuthResponse): void {
    localStorage.setItem('accessToken', authResponse.accessToken);
    localStorage.setItem('refreshToken', authResponse.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResponse));
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}/auth${endpoint}`;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const token = this.getStoredToken();
    if (token) {
      (defaultHeaders as any).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.storeTokens(response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (response.success && response.data) {
      this.storeTokens(response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request<boolean>('/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const requestData: RefreshTokenRequest = { refreshToken };
    const response = await this.request<AuthResponse>('/refresh-token', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });

    if (response.success && response.data) {
      this.storeTokens(response.data);
      return response.data;
    } else {
      this.clearTokens();
      throw new Error(response.message || 'Token refresh failed');
    }
  }

  async validateToken(): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/validate');

    if (response.success && response.data) {
      return response.data;
    } else {
      this.clearTokens();
      throw new Error(response.message || 'Token validation failed');
    }
  }

  async getProfile(): Promise<UserProfile> {
    const response = await this.request<UserProfile>('/profile');

    if (response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to get profile');
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    const response = await this.request<boolean>('/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.success) {
      throw new Error(response.message || 'Password change failed');
    }
  }

  getStoredUser(): AuthResponse | null {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        this.clearTokens();
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }

  getAccessToken(): string | null {
    return this.getStoredToken();
  }
}

export const authService = new AuthService();
export default authService;
