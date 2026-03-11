export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
  deletedAt?:string
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
  profile?:UpdateProfileDTO
}

export interface UpdateProfileDTO {
  profilePic?: string;
  membership?: string;
  recommendations?: any; // or a proper type
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
  createdAt:Date;
  profile?: UserProfile | null;
  roles: UserRole[];
}

// The return type of getAllUsers
export type GetAllUsersResponse = UserWithProfileAndRoles[];

export interface UserResponseDTO {
  id: string;
  email: string;
  phone: string;
  profile: {
    profilePic: string | null;
    membership: string;
    recommendations: unknown;
  } | null;
}

export interface UserParams{
  id:string
}
export interface UserEmailParams{
  email:string
}
export type ErrorResponse={
  statusCode:number,
  status:string,
  message:string,
  errors?:string[]
}

export interface cursor{
  createdAt:Date,
  id:string
}
export interface PaginatedResponse{
  data:UsersResponse[],
  nextCursor:string | null
}