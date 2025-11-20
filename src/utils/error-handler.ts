/**
 * Custom error classes for the application
 */

export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Resource not found") {
        super(message, 404, "NOT_FOUND");
    }
}

export class ValidationError extends AppError {
    constructor(message = "Validation failed") {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class DynamoDBError extends AppError {
    constructor(message: string, originalError?: any) {
        super(message, 500, "DYNAMODB_ERROR");
        if (originalError) {
            this.stack = originalError.stack;
        }
    }
}

/**
 * Format error response
 */
export function formatErrorResponse(error: Error) {
    if (error instanceof AppError) {
        return {
            error: {
                message: error.message,
                code: error.code,
                statusCode: error.statusCode,
            },
        };
    }

    // Handle Zod validation errors
    if (error.name === "ZodError") {
        return {
            error: {
                message: "Validation failed",
                code: "VALIDATION_ERROR",
                statusCode: 400,
                details: error,
            },
        };
    }

    // Generic error
    return {
        error: {
            message: error.message || "Internal server error",
            code: "INTERNAL_ERROR",
            statusCode: 500,
        },
    };
}
