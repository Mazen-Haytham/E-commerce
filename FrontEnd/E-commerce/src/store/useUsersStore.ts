/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { userAPI } from "../Network/Api/UserAPI/UsersApi";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from "../Network/Api/UserAPI/types";
import { handleApiError, type AppError } from "../utils/AppError";

// ==================== Types ====================

interface UsersState {
  // State
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: AppError | null;

  // User Management Actions
  createUser: (userData: CreateUserRequest) => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  fetchUserById: (userId: string) => Promise<void>;
  fetchUserByEmail: (email: string) => Promise<void>;
  updateUser: (userId: string, updateData: UpdateUserRequest) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;

  // Utility Actions
  setCurrentUser: (user: User | null) => void;
  clearError: () => void;
  clearState: () => void;
}

// ==================== Zustand Store ====================

export const useUsersStore = create<UsersState>()(
  devtools(
    (set) => ({
      // ==================== Initial State ====================
      users: [],
      currentUser: null,
      isLoading: false,
      error: null,

      // ==================== User Management Actions ====================

      /**
       * Create a new user account
       */
      async createUser(userData: CreateUserRequest): Promise<void> {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.createUser(userData);
          set((state) => ({
            users: [...state.users, response.data],
            isLoading: false,
          }));
        } catch (error) {
          const appError = handleApiError(error);
          set({ error: appError, isLoading: false });
          throw appError;
        }
      },

      /**
       * Fetch all users (Admin only)
       */
      async fetchAllUsers(): Promise<void> {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.getAllUsers();
          set({ users: response.data, isLoading: false });
        } catch (error) {
          const appError = handleApiError(error);
          set({ error: appError, isLoading: false });
          throw appError;
        }
      },

      /**
       * Fetch a specific user by ID
       */
      async fetchUserById(userId: string): Promise<void> {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.getUserById(userId);
          set({ currentUser: response.data, isLoading: false });
        } catch (error) {
          const appError = handleApiError(error);
          set({ error: appError, isLoading: false });
          throw appError;
        }
      },

      /**
       * Fetch a user by email address (Admin only)
       */
      async fetchUserByEmail(email: string): Promise<void> {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.getUserByEmail(email);
          set((state) => ({
            currentUser: response.data as User,
            isLoading: false,
          }));
        } catch (error) {
          const appError = handleApiError(error);
          set({ error: appError, isLoading: false });
          throw appError;
        }
      },

      /**
       * Update user information
       */
      async updateUser(
        userId: string,
        updateData: UpdateUserRequest,
      ): Promise<void> {
        set({ isLoading: true, error: null });
        try {
          const response = await userAPI.updateUser(userId, updateData);
          set((state) => ({
            currentUser: response.data,
            users: state.users.map((user) =>
              user.id === userId ? response.data : user,
            ),
            isLoading: false,
          }));
        } catch (error) {
          const appError = handleApiError(error);
          set({ error: appError, isLoading: false });
          throw appError;
        }
      },

      /**
       * Deactivate a user account
       */
      async deactivateUser(userId: string): Promise<void> {
        set({ isLoading: true, error: null });
        try {
          await userAPI.deactivateUser(userId);
          set((state) => ({
            users: state.users.filter((user) => user.id !== userId),
            currentUser:
              state.currentUser?.id === userId ? null : state.currentUser,
            isLoading: false,
          }));
        } catch (error) {
          const appError = handleApiError(error);
          set({ error: appError, isLoading: false });
          throw appError;
        }
      },

      // ==================== Utility Actions ====================

      /**
       * Set the current user
       */
      setCurrentUser(user: User | null): void {
        set({ currentUser: user });
      },

      /**
       * Clear error message
       */
      clearError(): void {
        set({ error: null });
      },

      /**
       * Clear all state to initial values
       */
      clearState(): void {
        set({
          users: [],
          currentUser: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "UsersStore",
      enabled: true,
    },
  ),
);


