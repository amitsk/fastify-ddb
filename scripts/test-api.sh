#!/bin/bash

# Test script for Fastify DynamoDB API
# This script tests all CRUD endpoints

BASE_URL="http://localhost:3000"

echo "🧪 Testing Fastify DynamoDB API"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s "$BASE_URL/health" | jq .
echo ""
echo ""

# Test 2: API Info
echo -e "${YELLOW}Test 2: API Info${NC}"
curl -s "$BASE_URL/" | jq .
echo ""
echo ""

# Test 3: Create Static Data
echo -e "${YELLOW}Test 3: Create Static Data${NC}"
curl -s -X POST "$BASE_URL/api/skilifts/static" \
  -H "Content-Type: application/json" \
  -d '{
    "Lift": "Lift 5",
    "ExperiencedRidersOnly": true,
    "VerticalFeet": 1200,
    "LiftTime": "8:00"
  }' | jq .
echo ""
echo ""

# Test 4: Create Dynamic Data
echo -e "${YELLOW}Test 4: Create Dynamic Data${NC}"
curl -s -X POST "$BASE_URL/api/skilifts/dynamic" \
  -H "Content-Type: application/json" \
  -d '{
    "Lift": "Lift 5",
    "Metadata": "11/19/25",
    "TotalUniqueLiftRiders": 3500,
    "AverageSnowCoverageInches": 42,
    "LiftStatus": "Open",
    "AvalancheDanger": "Low"
  }' | jq .
echo ""
echo ""

# Test 5: Create Another Dynamic Data Entry
echo -e "${YELLOW}Test 5: Create Another Dynamic Data Entry${NC}"
curl -s -X POST "$BASE_URL/api/skilifts/dynamic" \
  -H "Content-Type: application/json" \
  -d '{
    "Lift": "Lift 5",
    "Metadata": "11/20/25",
    "TotalUniqueLiftRiders": 4200,
    "AverageSnowCoverageInches": 45,
    "LiftStatus": "Open",
    "AvalancheDanger": "Moderate"
  }' | jq .
echo ""
echo ""

# Test 6: Create Resort Data
echo -e "${YELLOW}Test 6: Create Resort Data${NC}"
curl -s -X POST "$BASE_URL/api/skilifts/resort" \
  -H "Content-Type: application/json" \
  -d '{
    "Metadata": "11/19/25",
    "TotalUniqueLiftRiders": 15000,
    "AverageSnowCoverageInches": 40,
    "AvalancheDanger": "Low",
    "OpenLifts": [3, 5, 10, 16]
  }' | jq .
echo ""
echo ""

# Test 7: Get Specific Lift Data
echo -e "${YELLOW}Test 7: Get Specific Lift Data${NC}"
curl -s "$BASE_URL/api/skilifts/Lift%205/11%2F19%2F25" | jq .
echo ""
echo ""

# Test 8: Get All Data for a Lift
echo -e "${YELLOW}Test 8: Get All Data for Lift 5${NC}"
curl -s "$BASE_URL/api/skilifts/Lift%205" | jq .
echo ""
echo ""

# Test 9: List All Ski Lifts
echo -e "${YELLOW}Test 9: List All Ski Lifts${NC}"
curl -s "$BASE_URL/api/skilifts?limit=10" | jq .
echo ""
echo ""

# Test 10: Query by Riders (GSI)
echo -e "${YELLOW}Test 10: Query by Riders (GSI)${NC}"
curl -s "$BASE_URL/api/skilifts/Lift%205/by-riders?minRiders=3000" | jq .
echo ""
echo ""

# Test 11: Update Static Data
echo -e "${YELLOW}Test 11: Update Static Data${NC}"
curl -s -X PUT "$BASE_URL/api/skilifts/Lift%205/static" \
  -H "Content-Type: application/json" \
  -d '{
    "VerticalFeet": 1250,
    "LiftTime": "8:30"
  }' | jq .
echo ""
echo ""

# Test 12: Update Dynamic Data
echo -e "${YELLOW}Test 12: Update Dynamic Data${NC}"
curl -s -X PUT "$BASE_URL/api/skilifts/Lift%205/11%2F19%2F25" \
  -H "Content-Type: application/json" \
  -d '{
    "LiftStatus": "Closed",
    "AvalancheDanger": "High"
  }' | jq .
echo ""
echo ""

# Test 13: Validation Error Test
echo -e "${YELLOW}Test 13: Validation Error Test (Invalid Data)${NC}"
curl -s -X POST "$BASE_URL/api/skilifts/dynamic" \
  -H "Content-Type: application/json" \
  -d '{
    "Lift": "Lift 6",
    "Metadata": "invalid-date",
    "TotalUniqueLiftRiders": -100,
    "LiftStatus": "InvalidStatus"
  }' | jq .
echo ""
echo ""

# Test 14: Delete Ski Lift Data
echo -e "${YELLOW}Test 14: Delete Ski Lift Data${NC}"
curl -s -X DELETE "$BASE_URL/api/skilifts/Lift%205/11%2F20%2F25" -w "\nHTTP Status: %{http_code}\n"
echo ""
echo ""

# Test 15: Verify Deletion
echo -e "${YELLOW}Test 15: Verify Deletion (Should return 404)${NC}"
curl -s "$BASE_URL/api/skilifts/Lift%205/11%2F20%2F25" | jq .
echo ""
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
