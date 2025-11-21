import { describe, expect, it } from 'vitest';
import {
    DynamoDBError,
    NotFoundError,
    ValidationError,
} from '../../../src/utils/error-handler.js';

describe('Error Handlers', () => {
    describe('DynamoDBError', () => {
        it('should create error with message', () => {
            const error = new DynamoDBError('Database operation failed');
            expect(error.message).toBe('Database operation failed');
            expect(error.name).toBe('DynamoDBError');
            expect(error.statusCode).toBe(500);
        });

        it('should create error with cause', () => {
            const cause = new Error('Connection timeout');
            const error = new DynamoDBError('Database operation failed', cause);
            expect(error.message).toBe('Database operation failed');
            expect(error.cause).toBe(cause);
        });

        it('should be instance of Error', () => {
            const error = new DynamoDBError('Test error');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(DynamoDBError);
        });

        it('should have correct status code', () => {
            const error = new DynamoDBError('Test error');
            expect(error.statusCode).toBe(500);
        });
    });

    describe('NotFoundError', () => {
        it('should create error with message', () => {
            const error = new NotFoundError('Resource not found');
            expect(error.message).toBe('Resource not found');
            expect(error.name).toBe('NotFoundError');
            expect(error.statusCode).toBe(404);
        });

        it('should be instance of Error', () => {
            const error = new NotFoundError('Test error');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(NotFoundError);
        });

        it('should have correct status code', () => {
            const error = new NotFoundError('Test error');
            expect(error.statusCode).toBe(404);
        });

        it('should create error for specific resource', () => {
            const error = new NotFoundError('Ski lift "Summit Express" not found');
            expect(error.message).toContain('Summit Express');
        });
    });

    describe('ValidationError', () => {
        it('should create error with message', () => {
            const error = new ValidationError('Invalid input data');
            expect(error.message).toBe('Invalid input data');
            expect(error.name).toBe('ValidationError');
            expect(error.statusCode).toBe(400);
        });

        it('should be instance of Error', () => {
            const error = new ValidationError('Test error');
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ValidationError);
        });

        it('should have correct status code', () => {
            const error = new ValidationError('Test error');
            expect(error.statusCode).toBe(400);
        });

        it('should create error with validation details', () => {
            const error = new ValidationError('Lift name is required');
            expect(error.message).toContain('Lift name');
        });
    });

    describe('Error hierarchy', () => {
        it('should maintain proper error chain', () => {
            const originalError = new Error('Original error');
            const dbError = new DynamoDBError('Wrapped error', originalError);

            expect(dbError.cause).toBe(originalError);
            expect(dbError.message).toBe('Wrapped error');
        });

        it('should be catchable as generic Error', () => {
            const errors = [
                new DynamoDBError('DB error'),
                new NotFoundError('Not found'),
                new ValidationError('Validation error'),
            ];

            for (const error of errors) {
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should be distinguishable by type', () => {
            const dbError = new DynamoDBError('DB error');
            const notFoundError = new NotFoundError('Not found');
            const validationError = new ValidationError('Validation error');

            expect(dbError).toBeInstanceOf(DynamoDBError);
            expect(dbError).not.toBeInstanceOf(NotFoundError);
            expect(dbError).not.toBeInstanceOf(ValidationError);

            expect(notFoundError).toBeInstanceOf(NotFoundError);
            expect(notFoundError).not.toBeInstanceOf(DynamoDBError);
            expect(notFoundError).not.toBeInstanceOf(ValidationError);

            expect(validationError).toBeInstanceOf(ValidationError);
            expect(validationError).not.toBeInstanceOf(DynamoDBError);
            expect(validationError).not.toBeInstanceOf(NotFoundError);
        });
    });

    describe('Error status codes', () => {
        it('should have correct HTTP status codes', () => {
            expect(new DynamoDBError('test').statusCode).toBe(500);
            expect(new NotFoundError('test').statusCode).toBe(404);
            expect(new ValidationError('test').statusCode).toBe(400);
        });
    });
});
