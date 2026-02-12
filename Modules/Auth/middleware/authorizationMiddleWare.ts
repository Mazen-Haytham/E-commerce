// src/Modules/Auth/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../src/utils/AppError.js";
import { token } from "../types/authTypes.js";

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: token }).user;

    if (!user) {
      return next(new AppError("Not authenticated", 401));
    }

    // Check if user has at least one of the allowed roles
    const hasRole = user.roles.some((role:any) => allowedRoles.includes(role));

    if (!hasRole) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }

    next();
  };
};
