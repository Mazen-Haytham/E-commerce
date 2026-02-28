export class AppError extends Error {
  public isOperational: boolean;
  public statusCode: number;
  public status: string;
  public errors?: any[];
  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.isOperational = true;
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
    if (errors) this.errors = errors;
  }
}
