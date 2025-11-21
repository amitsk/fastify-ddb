import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import type { AwsStub } from 'aws-sdk-client-mock';

/**
 * Test utilities and helpers
 */

/**
 * Create a mocked DynamoDB Document Client
 */
export function createMockDynamoDBClient(): AwsStub<any, any, any> {
    return mockClient(DynamoDBDocumentClient);
}

/**
 * Reset all mocks
 */
export function resetMocks(mockDb: AwsStub<any, any, any>): void {
    mockDb.reset();
}

/**
 * Create a successful DynamoDB response
 */
export function createSuccessResponse<T>(item: T) {
    return {
        Item: item,
        $metadata: {
            httpStatusCode: 200,
        },
    };
}

/**
 * Create a successful query/scan response
 */
export function createQueryResponse<T>(items: T[], lastEvaluatedKey?: any) {
    return {
        Items: items,
        Count: items.length,
        ScannedCount: items.length,
        LastEvaluatedKey: lastEvaluatedKey,
        $metadata: {
            httpStatusCode: 200,
        },
    };
}

/**
 * Create a successful put/update response
 */
export function createPutResponse() {
    return {
        $metadata: {
            httpStatusCode: 200,
        },
    };
}

/**
 * Create a successful update response with attributes
 */
export function createUpdateResponse<T>(attributes: T) {
    return {
        Attributes: attributes,
        $metadata: {
            httpStatusCode: 200,
        },
    };
}

/**
 * Create a successful delete response
 */
export function createDeleteResponse() {
    return {
        $metadata: {
            httpStatusCode: 200,
        },
    };
}

/**
 * Create a DynamoDB error
 */
export function createDynamoDBError(code: string, message: string) {
    const error = new Error(message) as any;
    error.name = code;
    error.code = code;
    error.$metadata = {
        httpStatusCode: code === 'ResourceNotFoundException' ? 404 : 500,
    };
    return error;
}

/**
 * Wait for a promise to resolve (useful for async tests)
 */
export async function waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Assert that an error is thrown with a specific message
 */
export async function expectToThrow(
    fn: () => Promise<any>,
    errorClass?: any,
    messageContains?: string
): Promise<void> {
    let error: Error | null = null;
    try {
        await fn();
    } catch (e) {
        error = e as Error;
    }

    if (!error) {
        throw new Error('Expected function to throw an error, but it did not');
    }

    if (errorClass && !(error instanceof errorClass)) {
        throw new Error(
            `Expected error to be instance of ${errorClass.name}, but got ${error.constructor.name}`
        );
    }

    if (messageContains && !error.message.includes(messageContains)) {
        throw new Error(
            `Expected error message to contain "${messageContains}", but got "${error.message}"`
        );
    }
}

/**
 * Create a partial mock of an object
 */
export function createPartialMock<T>(partial: Partial<T>): T {
    return partial as T;
}
