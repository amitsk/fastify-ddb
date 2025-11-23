# Fastify DynamoDB API - Ski Lifts

A production-ready Fastify API with TypeScript that performs CRUD operations on a DynamoDB SkiLifts table.

## Features

- ✅ **Fastify 5.x** - Fast and low overhead web framework
- ✅ **TypeScript** - Full type safety with strict mode
- ✅ **AWS SDK v3** - Latest DynamoDB client with Document Client
- ✅ **Zod** - Runtime schema validation
- ✅ **ES Modules** - Modern JavaScript module system
- ✅ **Biome** - Fast linting and formatting
- ✅ **Middlewares** - Helmet (security), Compress (gzip), CORS
- ✅ **Plugin Architecture** - DynamoDB as a Fastify plugin
- ✅ **Layered Architecture** - Routes → Services → Database
- ✅ **Environment Configuration** - Support for local and remote DynamoDB
- ✅ **Comprehensive Testing** - Vitest with 80% coverage thresholds
- ✅ **AWS CDK Deployment** - ECS Fargate with auto-scaling
- ✅ **Docker Support** - Multi-stage builds with Node.js 24

## Project Structure

```
fastify-ddb/
├── src/
│   ├── db/
│   │   └── dynamodb.client.ts      # DynamoDB client factory
│   ├── plugins/
│   │   └── dynamodb.plugin.ts      # Fastify DynamoDB plugin
│   ├── routes/
│   │   └── skilift.routes.ts       # API route handlers
│   ├── schemas/
│   │   └── skilift.schemas.ts      # Zod validation schemas
│   ├── services/
│   │   └── skilift.service.ts      # Business logic & DynamoDB operations
│   ├── types/
│   │   └── skilift.types.ts        # TypeScript type definitions
│   ├── utils/
│   │   └── error-handler.ts        # Error handling utilities
│   ├── server.ts                   # Fastify server setup
│   └── index.ts                    # Application entry point
├── test/
│   ├── helpers/                    # Test utilities and mock data
│   ├── unit/                       # Unit tests
│   └── integration/                # Integration tests
├── cdk/
│   ├── bin/                        # CDK app entry point
│   ├── lib/                        # CDK stack definitions
│   └── package.json                # CDK dependencies
├── datamodel/
│   └── skilifts.json               # DynamoDB data model
├── scripts/
│   └── create-table.ts             # Script to create DynamoDB table
├── Dockerfile                      # Multi-stage Docker build
├── build.mjs                       # esbuild configuration
├── vitest.config.ts                # Vitest test configuration
├── .env                            # Environment variables
├── .env.example                    # Environment variables template
├── package.json
├── tsconfig.json
└── biome.json
```
  
## Data Model
Uses the Ski resort data model from the AWS documentation https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.SampleModels.html#workbench.SampleModels.SkiResortDataModel.

The SkiLifts table uses a composite key design:

- **Partition Key**: `Lift` (e.g., "Lift 3", "Resort Data")
- **Sort Key**: `Metadata` (e.g., "Static Data", "01/01/20")
- **GSI**: `SkiLiftsByRiders` - Query by lift and total unique riders

### Data Types

1. **Static Data** - Permanent lift characteristics
   - ExperiencedRidersOnly (boolean)
   - VerticalFeet (number)
   - LiftTime (string)

2. **Dynamic Data** - Daily operational data
   - TotalUniqueLiftRiders (number)
   - AverageSnowCoverageInches (number)
   - LiftStatus (Open | Closed | Pending)
   - AvalancheDanger (Low | Moderate | Considerable | High | Extreme)

3. **Resort Data** - Aggregated resort-level data
   - TotalUniqueLiftRiders (number)
   - AverageSnowCoverageInches (number)
   - AvalancheDanger (string)
   - OpenLifts (number array)

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Local DynamoDB

```env
DYNAMODB_MODE=local
DYNAMODB_LOCAL_ENDPOINT=http://localhost:8000
DYNAMODB_LOCAL_REGION=us-east-1
DYNAMODB_TABLE_NAME=SkiLifts
```

### Remote DynamoDB (AWS)

```env
DYNAMODB_MODE=remote
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
DYNAMODB_TABLE_NAME=SkiLifts
```

## Running Local DynamoDB

```bash
# Using Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Or using Docker Compose
docker-compose up -d
```

## Create DynamoDB Table

```bash
# Create the table locally
npm run create-table

# Or use AWS CLI
aws dynamodb create-table \
  --table-name SkiLifts \
  --attribute-definitions \
    AttributeName=Lift,AttributeType=S \
    AttributeName=Metadata,AttributeType=S \
    AttributeName=TotalUniqueLiftRiders,AttributeType=N \
  --key-schema \
    AttributeName=Lift,KeyType=HASH \
    AttributeName=Metadata,KeyType=RANGE \
  --global-secondary-indexes \
    "IndexName=SkiLiftsByRiders,KeySchema=[{AttributeName=Lift,KeyType=HASH},{AttributeName=TotalUniqueLiftRiders,KeyType=RANGE}],Projection={ProjectionType=INCLUDE,NonKeyAttributes=[Metadata]},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}" \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --endpoint-url http://localhost:8000
```

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

### Create Operations

- `POST /api/skilifts/static` - Create static ski lift data
- `POST /api/skilifts/dynamic` - Create dynamic ski lift data
- `POST /api/skilifts/resort` - Create resort-level data

### Read Operations

- `GET /api/skilifts` - List all ski lifts (paginated)
- `GET /api/skilifts/:lift` - Get all data for a specific lift
- `GET /api/skilifts/:lift/:metadata` - Get specific lift data by metadata
- `GET /api/skilifts/:lift/by-riders` - Query lift data sorted by riders (GSI)

### Update Operations

- `PUT /api/skilifts/:lift/static` - Update static ski lift data
- `PUT /api/skilifts/:lift/:metadata` - Update dynamic ski lift data

### Delete Operations

- `DELETE /api/skilifts/:lift/:metadata` - Delete ski lift data

### Health Check

- `GET /health` - Health check endpoint
- `GET /` - API information

## Example Requests

### Create Static Data

```bash
curl -X POST http://localhost:3000/api/skilifts/static \
  -H "Content-Type: application/json" \
  -d '{
    "Lift": "Lift 5",
    "ExperiencedRidersOnly": true,
    "VerticalFeet": 1200,
    "LiftTime": "8:00"
  }'
```

### Create Dynamic Data

```bash
curl -X POST http://localhost:3000/api/skilifts/dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "Lift": "Lift 5",
    "Metadata": "11/19/25",
    "TotalUniqueLiftRiders": 3500,
    "AverageSnowCoverageInches": 42,
    "LiftStatus": "Open",
    "AvalancheDanger": "Low"
  }'
```

### Get Lift Data

```bash
# Get specific data
curl http://localhost:3000/api/skilifts/Lift%205/11%2F19%2F25

# Get all data for a lift
curl http://localhost:3000/api/skilifts/Lift%205

# Query by riders (descending order)
curl "http://localhost:3000/api/skilifts/Lift%205/by-riders?minRiders=1000"
```

### Update Data

```bash
curl -X PUT http://localhost:3000/api/skilifts/Lift%205/11%2F19%2F25 \
  -H "Content-Type: application/json" \
  -d '{
    "LiftStatus": "Closed",
    "AvalancheDanger": "High"
  }'
```

### Delete Data

```bash
curl -X DELETE http://localhost:3000/api/skilifts/Lift%205/11%2F19%2F25
```

## Architecture

### Plugin Layer
- **DynamoDB Plugin** - Initializes and decorates Fastify instance with DynamoDB client

### Route Layer
- **Route Handlers** - Define API endpoints and handle HTTP requests
- **Validation** - Zod schemas validate request data

### Service Layer
- **Business Logic** - Implements CRUD operations
- **DynamoDB Operations** - Uses AWS SDK v3 commands (PutCommand, GetCommand, QueryCommand, etc.)

### Database Layer
- **Client Factory** - Creates DynamoDB Document Client
- **Configuration** - Environment-based setup for local/remote

## Error Handling

The API uses custom error classes:

- `AppError` - Base error class
- `NotFoundError` - Resource not found (404)
- `ValidationError` - Validation failed (400)
- `DynamoDBError` - Database operation failed (500)

All errors return a consistent JSON format:

```json
{
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

## Security

- **Helmet** - Sets security-related HTTP headers
- **CORS** - Configurable cross-origin resource sharing
- **Validation** - All inputs validated with Zod schemas

## Performance

- **Compress** - Gzip compression for responses > 1KB
- **DynamoDB Document Client** - Simplified data marshalling
- **Efficient Queries** - Uses GSI for optimized access patterns

## Testing

This project uses **Vitest** for testing with comprehensive unit and integration test coverage.

### Test Stack

- **Vitest** - Fast, modern test runner with native ESM support
- **aws-sdk-client-mock** - Mock AWS SDK v3 calls without AWS credentials
- **Coverage** - Built-in v8 coverage with 80% thresholds

### Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode (re-run on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open Vitest UI
npm run test:ui
```

### Test Structure

```
test/
├── helpers/
│   ├── mock-data.ts          # Sample test data
│   └── test-utils.ts         # Shared utilities
├── unit/
│   ├── services/             # Service layer tests
│   ├── schemas/              # Schema validation tests
│   └── utils/                # Utility function tests
└── integration/
    └── routes/               # API endpoint tests
```

### Coverage Requirements

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 80%
- **Statements**: 80%

For detailed testing documentation, see [TESTING.md](TESTING.md).

## Deployment

### AWS CDK Deployment

Deploy the API to AWS ECS Fargate using AWS CDK infrastructure as code.

#### Prerequisites

- AWS Account with configured credentials
- Docker installed and running
- Node.js 24 or higher
- Existing VPC in your AWS account
- DynamoDB tables created (`SkiLifts-test` and `SkiLifts`)

#### Quick Start

```bash
# Install CDK dependencies
npm run cdk:install

# Bootstrap CDK (first time only)
cd cdk && npx cdk bootstrap

# Deploy to test environment
npm run cdk:deploy:test

# Deploy to production
npm run cdk:deploy:prod
```

#### Environments

**Test Environment**
- CPU: 0.5 vCPU, Memory: 1 GB
- Scaling: 1-2 tasks
- Table: `SkiLifts-test`
- Log Level: debug

**Production Environment**
- CPU: 1 vCPU, Memory: 2 GB
- Scaling: 2-10 tasks
- Table: `SkiLifts`
- Log Level: info

#### CDK Commands

```bash
# Synthesize CloudFormation template
npm run cdk:synth:test
npm run cdk:synth:prod

# Preview changes
npm run cdk:diff:test
npm run cdk:diff:prod

# Deploy
npm run cdk:deploy:test
npm run cdk:deploy:prod

# Destroy resources
npm run cdk:destroy:test
npm run cdk:destroy:prod
```

#### Architecture

- **ECS Fargate** - Serverless container orchestration
- **Application Load Balancer** - Public HTTP endpoint
- **Auto-scaling** - CPU and memory-based scaling
- **CloudWatch Logs** - Centralized logging
- **IAM Roles** - DynamoDB table access permissions

For detailed deployment documentation, see [cdk/README.md](cdk/README.md).

### Docker Deployment

Build and run the application using Docker:

```bash
# Build the image
docker build -t fastify-ddb .

# Run the container
docker run -p 3000:3000 \
  -e DYNAMODB_MODE=local \
  -e DYNAMODB_LOCAL_ENDPOINT=http://host.docker.internal:8000 \
  -e DYNAMODB_TABLE_NAME=SkiLifts \
  fastify-ddb
```

## License

MIT

