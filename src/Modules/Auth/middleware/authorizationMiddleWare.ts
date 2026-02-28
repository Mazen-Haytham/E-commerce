// src/Modules/Auth/middleware/authorize.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/AppError.js";
import { token,UserRole } from "../types/authTypes.js";

export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as Request & { user?: token }).user;
    console.log(`USER : ${user}`);
    
    if (!user) {
      return next(new AppError("Not authenticated", 401));
    }
    console.log(user.roles);
    // Check if user has at least one of the allowed roles
    const hasRole = user.roles.some((r:UserRole) => allowedRoles.includes(r.role.name));

    if (!hasRole) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }

    next();
  };
};
