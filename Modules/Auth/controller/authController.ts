import { NextFunction, Request, Response } from "express";
import { AuthService } from "../service/authService";
import { LoginRequest } from "../types/authTypes";

export class AuthController {
  constructor(private readonly authService: AuthService) {}
  login = async (
    req: Request<{}, {}, LoginRequest>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const loginData: LoginRequest = req.body;
      const { accessToken, refreshToken } =
        await this.authService.login(loginData);
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: true,
        path: "/api/auth/refresh",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      return res.status(200).send({
        accessToken: accessToken,
      });
    } catch (err) {
      next(err);
    }
  };
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      const newAccessToken = this.authService.refresh(refreshToken);
      return res.status(200).send({
        accessToken: newAccessToken,
      });
    } catch (err) {
      next(err);
    }
  };
}
