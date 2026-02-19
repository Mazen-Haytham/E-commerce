

export interface LoginRequest{
    email:string,
    password:string
};

export interface token{
    userId:string,
    email:string,
    roles:string[]
};

export interface refreshToken{
    token:token,
    tokenVersion:number
}
export interface UserRole {
  role: {
    name: string;
  };
}