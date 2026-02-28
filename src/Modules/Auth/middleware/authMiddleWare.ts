import { NextFunction, Request, Response } from "express";
import { AppError } from "../../../utils/AppError.js";
import { token } from "../types/authTypes.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessTokenSecretKey = process.env.JWT_ACCESS_TOKEN_SECRET;
  if (!accessTokenSecretKey)
    throw new Error("ACCESS TOKEN SECRET IS UNDEFINED");
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return next(new AppError("Not Authenticated", 401));
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, accessTokenSecretKey) as token;
    (req as Request & { user: token }).user = decoded;
    next();
  } catch {
    return next(new AppError("Invalid  or Expired Token", 401));
  }
};
