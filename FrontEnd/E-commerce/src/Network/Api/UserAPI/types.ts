// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePic?: string;
  roles?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  profilePic?: string;
  membership?: string;
  recommendations?: Record<string, unknown>;
}

// ==================== Request DTOs ====================

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  profilePic?: string;
}

export interface UpdateUserRequest {
  phone?: string;
  password?: string;
  profile?: UserProfile;
}

// ==================== Response DTOs ====================

export interface CreateUserResponse {
  status: string;
  message: string;
  data: User;
}

export interface GetAllUsersResponse {
  status: string;
  data: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }>;
}

export interface GetUserByIdResponse {
  status: string;
  data: User;
}

export interface GetUserByEmailResponse {
  status: string;
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface UpdateUserResponse {
  status: string;
  message: string;
  data: User;
}

export interface DeactivateUserResponse {
  status: string;
  message: string;
}

// ==================== Generic API Response ====================

export interface ApiResponse<T> {
  status: string;
  data?: T;
  message?: string;
}
