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
  profilePic?: string;
  loyaltyPoints?: number;
  membership?: string;
  recommendations?: any;
}

export interface UserUpdateInfo {
  password?: string;
  phone?: string;
}

export interface UpadteUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string;
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
