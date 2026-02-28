import { LoginRequest, refreshToken, token } from "../types/authTypes.js";
import { userApi } from "../../User/src/index.js";
import { AppError } from "../../../utils/AppError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export class AuthService {
  login = async (
    userLoginRequest: LoginRequest,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> => {
    const jwtAccessSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
    if (!jwtAccessSecret || !jwtRefreshSecret)
      throw new Error("JWT ACCESS OR REFRESH TOKEN SECRET KEY IS NOT DEFINED");
    if (!userLoginRequest.email || !userLoginRequest.password)
      throw new AppError("You Must Enter Email and Password", 400);
    const user = await userApi.findUserByEmail(userLoginRequest.email);
    if (!user) throw new AppError("Invalid Credentials ", 401);
    const isMatch: boolean = await bcrypt.compare(
      userLoginRequest.password,
      user.password,
    );
    if (!isMatch) throw new AppError("Invalid Credentials ", 401);
    const payload: token = {
      userId: user.id,
      email: user.email,
      roles: user.roles,
    };
    const refreshTokenPayloadL: refreshToken = {
      token: payload,
      tokenVersion: user.tokenVersion,
    };
    const accessToken: string = jwt.sign(payload, jwtAccessSecret, {
      expiresIn: "15m",
    });
    const refreshToken: string = jwt.sign(
      refreshTokenPayloadL,
      jwtRefreshSecret,
      {
        expiresIn: "7d",
      },
    );
    return { accessToken, refreshToken };
  };
  refresh = async (refreshToken: string) => {
    const jwtAccessSecret = process.env.JWT_ACCESS_TOKEN_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_TOKEN_SECRET;
    if (!jwtAccessSecret || !jwtRefreshSecret)
      throw new Error("JWT ACCESS OR REFRESH TOKEN SECRET KEY IS NOT DEFINED");
    if (!refreshToken) throw new AppError("Not Authenticated", 401);
    try {
      const payload: refreshToken = jwt.verify(
        refreshToken,
        jwtRefreshSecret,
      ) as refreshToken;
      const user = await userApi.findUserById(payload.token.userId);
      if (!user || payload.tokenVersion !== user.tokenVersion)
        throw new AppError("Refresh Token Revoked", 401);
      const newAccessToken = jwt.sign(payload, jwtAccessSecret, {
        expiresIn: "15m",
      });
      return newAccessToken;
    } catch {
      throw new AppError("Invalid or Expired Token", 401);
    }
  };
}
