import axiosInstance from "../../axiosInstance";
import type {
  CreateUserRequest,
  CreateUserResponse,
  GetAllUsersResponse,
  GetUserByIdResponse,
  GetUserByEmailResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeactivateUserResponse,
} from "./types";

const BASE_URL = "/users";

// ==================== User API Service ====================

export const userAPI = {
  /**
   * Create a new user account
   * @param userData - User registration data (email, firstName, lastName, password, phone, profilePic)
   * @returns Created user data with assigned ID and roles
   */
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    const response = await axiosInstance.post<CreateUserResponse>(
      BASE_URL,
      userData,
    );
    return response.data;
  },

  /**
   * Get all users (Admin only)
   * @returns Array of all users
   */
  async getAllUsers(): Promise<GetAllUsersResponse> {
    const response = await axiosInstance.get<GetAllUsersResponse>(BASE_URL);
    return response.data;
  },

  /**
   * Get a specific user by ID (Admin only)
   * @param userId - The user UUID
   * @returns User data with full details
   */
  async getUserById(userId: string): Promise<GetUserByIdResponse> {
    const response = await axiosInstance.get<GetUserByIdResponse>(
      `${BASE_URL}/${userId}`,
    );
    return response.data;
  },

  /**
   * Get a user by email address (Admin only)
   * @param email - The user email address
   * @returns User data (basic info)
   */
  async getUserByEmail(email: string): Promise<GetUserByEmailResponse> {
    const encodedEmail = encodeURIComponent(email);
    const response = await axiosInstance.get<GetUserByEmailResponse>(
      `${BASE_URL}/email/${encodedEmail}`,
    );
    return response.data;
  },

  /**
   * Update user information
   * @param userId - The user UUID
   * @param updateData - Fields to update (phone, password, profile)
   * @returns Updated user data
   */
  async updateUser(
    userId: string,
    updateData: UpdateUserRequest,
  ): Promise<UpdateUserResponse> {
    const response = await axiosInstance.patch<UpdateUserResponse>(
      `${BASE_URL}/${userId}`,
      updateData,
    );
    return response.data;
  },

  /**
   * Deactivate a user account
   * @param userId - The user UUID
   * @returns Deactivation confirmation
   */
  async deactivateUser(userId: string): Promise<DeactivateUserResponse> {
    const response = await axiosInstance.delete<DeactivateUserResponse>(
      `${BASE_URL}/${userId}`,
    );
    return response.data;
  },
};

export default userAPI;
