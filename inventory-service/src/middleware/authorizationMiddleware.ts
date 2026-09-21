import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { token } from "../types/authTypes.js";

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: token }).user;

    if (!user) {
      return next(new AppError("Not authenticated", 401));
    }

    const hasRole = user.roles.some((r: any) =>
      allowedRoles.includes(typeof r === "string" ? r : r?.role?.name)
    );

    if (!hasRole) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }

    next();
  };
};
