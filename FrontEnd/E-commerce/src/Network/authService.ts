import { axiosInstance, tokenManager } from "./axiosInstance";

// ==================== Authentication Service ====================

export const authService = {
  /**
   * Login user with email and password
   * Automatically stores access token in TokenManager
   */
  async login(email: string, password: string) {
    const response = await axiosInstance.post("/auth/login", {
      email,
      password,
    });
    // Token is automatically extracted and stored by response interceptor
    return response.data;
  },

  /**
   * Refresh access token
   * Called automatically when token expires (401 response)
   */
  async refreshToken() {
    const response = await axiosInstance.post("/auth/refresh");
    // Token is automatically extracted and stored by response interceptor
    return response.data;
  },

  /**
   * Logout user - clears access token
   */
  logout() {
    tokenManager.clearAccessToken();
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return tokenManager.getAccessToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenManager.getAccessToken() !== null;
  },
};

// ==================== Export Axios Instance ====================
export default axiosInstance;
