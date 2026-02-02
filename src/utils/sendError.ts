import { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";

export const sendError = (
  err: AppError | any,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  if (err.isOperational) {
    return res.status(err.statusCode).send({
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
  }
  return res.status(500).send({
    status: "Fail",
    message: "Something Went Wrong",
  });
};
