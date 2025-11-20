# Fastify DynamoDB API - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Docker (for local DynamoDB)
- npm or yarn

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local DynamoDB
```bash
# Option 1: Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Option 2: Docker Compose
docker-compose up -d
```

### 3. Create DynamoDB Table
```bash
npm run create-table
```

### 4. Start the Server
```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

### 5. Test the API
```bash
# Make the script executable
chmod +x scripts/test-api.sh

# Run tests
./scripts/test-api.sh
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# DynamoDB (Local)
DYNAMODB_MODE=local
DYNAMODB_LOCAL_ENDPOINT=http://localhost:8000
DYNAMODB_LOCAL_REGION=us-east-1
DYNAMODB_TABLE_NAME=SkiLifts
```

For remote DynamoDB, set:
```env
DYNAMODB_MODE=remote
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Health Check
```bash
curl http://localhost:3000/health
```

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

# List all lifts
curl http://localhost:3000/api/skilifts?limit=10
```

### Query by Riders (GSI)
```bash
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

## Project Structure

```
src/
├── db/                 # DynamoDB client
├── plugins/            # Fastify plugins
├── routes/             # API routes
├── schemas/            # Zod validation
├── services/           # Business logic
├── types/              # TypeScript types
├── utils/              # Utilities
├── server.ts           # Server setup
└── index.ts            # Entry point
```

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Create DynamoDB table
npm run create-table

# Lint code
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env
PORT=3001
```

### DynamoDB Connection Error
```bash
# Verify DynamoDB is running
docker ps | grep dynamodb

# Check endpoint in .env
DYNAMODB_LOCAL_ENDPOINT=http://localhost:8000
```

### Table Already Exists
```bash
# Delete table first
aws dynamodb delete-table \
  --table-name SkiLifts \
  --endpoint-url http://localhost:8000

# Then recreate
npm run create-table
```

## Next Steps

1. Review the [README.md](file:///home/amit/projects/js/fastify-ddb/README.md) for detailed documentation
2. Check the [walkthrough.md](file:///home/amit/.gemini/antigravity/brain/6e5b4650-eb3e-4929-bc00-a7f1ea1611f3/walkthrough.md) for implementation details
3. Explore the source code in the `src/` directory
4. Run the test script to verify all endpoints work

## Support

For issues or questions, refer to:
- [Fastify Documentation](https://fastify.dev/)
- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [Zod Documentation](https://zod.dev/)
