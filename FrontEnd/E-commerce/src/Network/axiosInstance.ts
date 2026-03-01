import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

// ==================== Token Manager ====================
// Professional token management - stores access token in memory (session-scoped)
// HttpOnly cookies for refresh token are handled automatically by browser

class TokenManager {
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  setIsRefreshing(value: boolean): void {
    this.isRefreshing = value;
  }

  getIsRefreshing(): boolean {
    return this.isRefreshing;
  }

  addRefreshSubscriber(callback: (token: string) => void): void {
    this.refreshSubscribers.push(callback);
  }

  notifyRefreshSubscribers(token: string): void {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  clearRefreshSubscribers(): void {
    this.refreshSubscribers = [];
  }
}

const tokenManager = new TokenManager();

// ==================== Axios Instance ====================
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable automatic HttpOnly cookie handling
});

// ==================== Request Interceptor ====================
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach access token to Authorization header
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ==================== Response Interceptor ====================
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Extract access token from login/refresh responses
    if (
      response.config.url?.includes("/auth/login") ||
      response.config.url?.includes("/auth/refresh")
    ) {
      const accessToken = response.data?.accessToken;
      if (accessToken) {
        tokenManager.setAccessToken(accessToken);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle 401 Unauthorized (token expired or not found)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Prevent multiple simultaneous refresh requests
      if (!tokenManager.getIsRefreshing()) {
        tokenManager.setIsRefreshing(true);

        try {
          // Attempt to refresh the access token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }, // Include HttpOnly refresh token cookie
          );

          const newAccessToken = refreshResponse.data?.accessToken;
          if (newAccessToken) {
            tokenManager.setAccessToken(newAccessToken);
            tokenManager.notifyRefreshSubscribers(newAccessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return axiosInstance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - clear token and redirect to login
          tokenManager.clearAccessToken();
          tokenManager.clearRefreshSubscribers();
          // Could redirect to login page here if needed
          // window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          tokenManager.setIsRefreshing(false);
        }
      } else {
        // If already refreshing, queue the request until refresh completes
        return new Promise((resolve) => {
          tokenManager.addRefreshSubscriber((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  },
);

// ==================== Export ====================
export { axiosInstance, tokenManager, API_BASE_URL };
export default axiosInstance;
