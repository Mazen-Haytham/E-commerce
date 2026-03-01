/* eslint-disable @typescript-eslint/no-unused-vars */
import type { AxiosError } from "axios";

// ==================== Frontend AppError ====================

export interface ApiErrorResponse {
  status: string; // "fail" or "error"
  message: string;
  statusCode: number;
  errors?: Array<{
    field?: string;
    message: string;
  }>;
}

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public errors?: Array<{
    field?: string;
    message: string;
  }>;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    errors?: Array<{
      field?: string;
      message: string;
    }>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
    this.errors = errors;
    this.isOperational = true;

    // Maintain prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }

  /**
   * Get detailed error information
   */
  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      status: this.status,
      errors: this.errors,
      isOperational: this.isOperational,
    };
  }
}

// ==================== Error Parser ====================

/**
 * Parse axios error and convert to AppError
 */
export const parseAxiosError = (error: unknown): AppError => {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // If axios error has response data
  if (axiosError.response?.data) {
    const data = axiosError.response.data;
    return new AppError(
      data.message || "An error occurred",
      data.statusCode || axiosError.response.status || 500,
      data.errors,
    );
  }

  // If axios error with status code but no response data
  if (axiosError.response?.status) {
    const statusCode = axiosError.response.status;
    const message = axiosError.response.statusText || "An error occurred";
    return new AppError(message, statusCode);
  }

  // Network error (no response from server)
  if (axiosError.request && !axiosError.response) {
    return new AppError("Network error: Unable to connect to server", 0);
  }

  // Error during request setup
  return new AppError(
    axiosError.message || "An unexpected error occurred",
    500,
  );
};

// ==================== Error Handler ====================

export const handleApiError = (error: unknown): AppError => {
  try {
    return parseAxiosError(error);
  } catch (_err) {
    return new AppError("An unexpected error occurred", 500);
  }
};

// ==================== Error Messages ====================

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: AppError | unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

/**
 * Get all validation errors as formatted string
 */
export const getValidationErrors = (error: AppError | unknown): string[] => {
  if (error instanceof AppError && error.errors) {
    return error.errors.map(
      (err) => `${err.field ? err.field + ": " : ""}${err.message}`,
    );
  }

  return [];
};
