# Testing Guide

Comprehensive testing documentation for the Fastify DynamoDB API.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking Strategies](#mocking-strategies)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Coverage Requirements](#coverage-requirements)

## Overview

This project uses **Vitest** as the test runner and **aws-sdk-client-mock** for mocking AWS SDK v3 calls. Tests are organized into:

- **Unit Tests**: Test individual components in isolation (services, schemas, utilities)
- **Integration Tests**: Test API routes end-to-end with mocked dependencies

### Why Vitest?

- ⚡ **Fast**: Native ESM support, parallel test execution
- 🔧 **TypeScript**: First-class TypeScript support
- 🎯 **Compatible**: Jest-compatible API
- 📊 **Coverage**: Built-in coverage with v8

### Why aws-sdk-client-mock?

- ✅ **AWS SDK v3**: Designed specifically for AWS SDK v3
- 🎭 **Type-safe**: Full TypeScript support
- 🔄 **Flexible**: Easy to mock different responses per test
- 🚀 **No AWS**: Tests run without AWS credentials or resources

## Getting Started

### Install Dependencies

Dependencies are already installed in the project:

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run test/unit/services/skilift.service.test.ts

# Run tests matching pattern
npx vitest run -t "should create static"
```

### Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

Coverage thresholds are set to 80% for:
- Lines
- Functions
- Branches
- Statements

### Vitest UI

```bash
# Open interactive UI
npm run test:ui
```

The UI provides:
- Visual test runner
- Real-time test results
- Coverage visualization
- Test filtering and search

## Test Structure

```
test/
├── helpers/
│   ├── mock-data.ts          # Sample test data
│   └── test-utils.ts         # Shared utilities
├── unit/
│   ├── services/
│   │   └── skilift.service.test.ts
│   ├── schemas/
│   │   └── skilift.schemas.test.ts
│   └── utils/
│       └── error-handler.test.ts
└── integration/
    └── routes/
        └── skilift.routes.test.ts
```

### Test Helpers

#### `test/helpers/mock-data.ts`

Contains sample data for testing:
- `validStaticData` - Valid static lift data
- `validDynamicData` - Valid dynamic lift data
- `validResortData` - Valid resort data
- `invalidStaticData` - Invalid data for validation tests
- `multipleLifts` - Array of lifts for pagination tests

#### `test/helpers/test-utils.ts`

Utility functions:
- `createMockDynamoDBClient()` - Create mocked DynamoDB client
- `createSuccessResponse()` - Mock successful DynamoDB response
- `createQueryResponse()` - Mock query/scan response
- `createDynamoDBError()` - Mock DynamoDB error

## Writing Tests

### Unit Test Example

```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it, beforeEach } from 'vitest';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { SkiLiftService } from '../../../src/services/skilift.service.js';
import { validStaticData } from '../../helpers/mock-data.js';
import { createPutResponse } from '../../helpers/test-utils.js';

const mockDynamoDB = mockClient({} as any);

describe('SkiLiftService', () => {
    let service: SkiLiftService;

    beforeEach(() => {
        mockDynamoDB.reset();
        service = new SkiLiftService(mockDynamoDB as any);
    });

    it('should create static data', async () => {
        mockDynamoDB.on(PutCommand).resolves(createPutResponse());

        const result = await service.createStaticData(validStaticData);

        expect(result.Lift).toBe('Summit Express');
        expect(mockDynamoDB.calls()).toHaveLength(1);
    });
});
```

### Integration Test Example

```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { build } from '../../../src/app.js';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { validStaticData } from '../../helpers/mock-data.js';
import { createPutResponse } from '../../helpers/test-utils.js';

const mockDynamoDB = mockClient({} as any);

describe('POST /api/skilifts/static', () => {
    let app;

    beforeEach(async () => {
        mockDynamoDB.reset();
        app = await build();
        await app.ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it('should create static ski lift data', async () => {
        mockDynamoDB.on(PutCommand).resolves(createPutResponse());

        const response = await app.inject({
            method: 'POST',
            url: '/api/skilifts/static',
            payload: validStaticData,
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.Lift).toBe('Summit Express');
    });
});
```

### Schema Validation Test Example

```typescript
import { describe, expect, it } from 'vitest';
import { createStaticDataSchema } from '../../../src/schemas/skilift.schemas.js';

describe('createStaticDataSchema', () => {
    it('should validate valid data', () => {
        const result = createStaticDataSchema.safeParse({
            Lift: 'Summit Express',
            ExperiencedRidersOnly: false,
            VerticalFeet: 2500,
            LiftTime: '8:00',
        });

        expect(result.success).toBe(true);
    });

    it('should reject negative VerticalFeet', () => {
        const result = createStaticDataSchema.safeParse({
            Lift: 'Summit Express',
            ExperiencedRidersOnly: false,
            VerticalFeet: -100,
            LiftTime: '8:00',
        });

        expect(result.success).toBe(false);
    });
});
```

## Mocking Strategies

### Mocking DynamoDB Commands

```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const mockDynamoDB = mockClient({} as any);

// Mock successful Get
mockDynamoDB.on(GetCommand).resolves({
    Item: { Lift: 'Summit Express', Metadata: 'Static Data' },
});

// Mock successful Put
mockDynamoDB.on(PutCommand).resolves({
    $metadata: { httpStatusCode: 200 },
});

// Mock successful Query with pagination
mockDynamoDB.on(QueryCommand).resolves({
    Items: [/* items */],
    Count: 10,
    LastEvaluatedKey: { Lift: 'Test', Metadata: 'Data' },
});

// Mock error
mockDynamoDB.on(GetCommand).rejects(
    new Error('ResourceNotFoundException')
);
```

### Conditional Mocking

```typescript
// Mock different responses based on input
mockDynamoDB.on(GetCommand)
    .callsFake((input) => {
        if (input.Key.Lift === 'Existing') {
            return { Item: { /* data */ } };
        }
        return { Item: undefined };
    });
```

### Resetting Mocks

```typescript
beforeEach(() => {
    // Reset all mocks before each test
    mockDynamoDB.reset();
});
```

## Best Practices

### 1. Isolate Tests

Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
    mockDynamoDB.reset();
    service = new SkiLiftService(mockDynamoDB as any);
});
```

### 2. Use Descriptive Test Names

```typescript
// ✅ Good
it('should return 404 when ski lift not found', async () => {});

// ❌ Bad
it('test get', async () => {});
```

### 3. Test One Thing Per Test

```typescript
// ✅ Good
it('should create static data successfully', async () => {
    // Test only creation
});

it('should validate input data', async () => {
    // Test only validation
});

// ❌ Bad
it('should create and validate data', async () => {
    // Testing multiple things
});
```

### 4. Use Test Data Builders

Use shared test data from `test/helpers/mock-data.ts`:

```typescript
import { validStaticData, invalidStaticData } from '../../helpers/mock-data.js';

it('should accept valid data', () => {
    const result = schema.safeParse(validStaticData);
    expect(result.success).toBe(true);
});
```

### 5. Test Error Cases

Always test both success and error scenarios:

```typescript
it('should create data successfully', async () => {
    mockDynamoDB.on(PutCommand).resolves(createPutResponse());
    // Test success
});

it('should handle database errors', async () => {
    mockDynamoDB.on(PutCommand).rejects(new Error('DB Error'));
    // Test error handling
});
```

### 6. Verify Mock Calls

```typescript
it('should call DynamoDB with correct parameters', async () => {
    mockDynamoDB.on(PutCommand).resolves(createPutResponse());

    await service.createStaticData(validStaticData);

    expect(mockDynamoDB.calls()).toHaveLength(1);
    const call = mockDynamoDB.call(0);
    expect(call.args[0].input.TableName).toBe('SkiLifts');
});
```

### 7. Clean Up Resources

```typescript
afterEach(async () => {
    await app.close();
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
npm test
```

## Coverage Requirements

### Current Thresholds

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

### Viewing Coverage

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

### Coverage Configuration

Configured in `vitest.config.ts`:

```typescript
coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov'],
    thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
    },
}
```

## Troubleshooting

### Tests Failing with AWS Errors

**Problem**: Tests try to connect to real AWS

**Solution**: Ensure mocks are set up before service creation:

```typescript
beforeEach(() => {
    mockDynamoDB.reset(); // Reset first
    service = new SkiLiftService(mockDynamoDB as any);
});
```

### Mock Not Working

**Problem**: Mock doesn't intercept calls

**Solution**: Ensure you're mocking the correct command:

```typescript
// ✅ Correct
mockDynamoDB.on(PutCommand).resolves(/*...*/);

// ❌ Wrong command
mockDynamoDB.on(GetCommand).resolves(/*...*/);
```

### Type Errors

**Problem**: TypeScript errors in tests

**Solution**: Use type assertions when needed:

```typescript
const mockDb = mockClient({} as any);
service = new SkiLiftService(mockDb as any);
```

### Slow Tests

**Problem**: Tests run slowly

**Solution**:
- Run tests in parallel (Vitest default)
- Use `test:unit` or `test:integration` for specific suites
- Check for unnecessary `await` statements

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [aws-sdk-client-mock Documentation](https://github.com/m-radzikowski/aws-sdk-client-mock)
- [Fastify Testing](https://www.fastify.io/docs/latest/Guides/Testing/)
- [Zod Documentation](https://zod.dev/)

## Examples

### Complete Test Suite Structure

```typescript
describe('SkiLiftService', () => {
    let service: SkiLiftService;
    let mockDynamoDB: AwsStub<any, any, any>;

    beforeEach(() => {
        mockDynamoDB = mockClient({} as any);
        mockDynamoDB.reset();
        service = new SkiLiftService(mockDynamoDB as any);
    });

    describe('createStaticData', () => {
        it('should create successfully', async () => {
            // Arrange
            mockDynamoDB.on(PutCommand).resolves(createPutResponse());

            // Act
            const result = await service.createStaticData(validStaticData);

            // Assert
            expect(result).toEqual(validStaticDataResponse);
        });

        it('should handle errors', async () => {
            // Arrange
            mockDynamoDB.on(PutCommand).rejects(new Error('DB Error'));

            // Act & Assert
            await expect(
                service.createStaticData(validStaticData)
            ).rejects.toThrow();
        });
    });
});
```

---

**Happy Testing! 🧪**
