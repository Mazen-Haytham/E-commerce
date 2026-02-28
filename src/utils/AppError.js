export class AppError extends Error {
    isOperational;
    statusCode;
    status;
    errors;
    constructor(message, statusCode, errors) {
        super(message);
        this.isOperational = true;
        this.statusCode = statusCode;
        this.status = statusCode >= 400 && statusCode < 500 ? "fail" : "error";
        Error.captureStackTrace(this, this.constructor);
        if (errors)
            this.errors = errors;
    }
}
