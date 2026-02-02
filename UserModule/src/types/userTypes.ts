export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
}
export interface Profile {
  userId: string;
  profilePic?: string;
  loyaltyPoints?: number;
  membership?: string;
  recommendations?: any;
}
export interface UsersResponse {
  user: User
  profile?:Profile
  roles: string[];
}
export interface LoginResponse{
  user:User,
  roles:string[]
}
export interface createUserDTO {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  profilePic?: string;
}

export interface UpdateUserDTO {
  password?: string;
  phone?: string;
}


export interface UpdateUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  profilePic?:string,
  loyaltyPoints?: number;
  membership?: string;
  recommendations?: any;
}

export interface createUserResponse {
  email:string
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  profilePic: string|null;
  roles: string[];
}

// Represents the Profile relation
export interface UserProfile {
  profilePic?: string | null;
  loyaltyPoints?: number | null;
  membership?: string | null;
  recommendations?: any | null;
}

// Represents a Role relation inside UserRole
export interface UserRole {
  role: {
    name: string;
  };
}

// The full user object returned by Prisma
export interface UserWithProfileAndRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  profile?: UserProfile | null;
  roles: UserRole[];
}

// The return type of getAllUsers
export type GetAllUsersResponse = UserWithProfileAndRoles[];

export interface UserParams{
  id:string
}

export type ErrorResponse={
  statusCode:number,
  status:string,
  message:string,
  errors?:string[]
}