#!/bin/bash

################################################################################
# Idempotency Testing Script for SouqSyria Backend
# Phase 5.2 - Idempotent Cart Operations
#
# This script demonstrates idempotent behavior of cart endpoints
################################################################################

echo "========================================"
echo "IDEMPOTENCY TESTING SCRIPT"
echo "Phase 5.2 - SouqSyria Backend"
echo "========================================"
echo ""

# Configuration
BASE_URL="http://localhost:3000"
AUTH_TOKEN="YOUR_JWT_TOKEN_HERE"

# Generate unique idempotency keys (UUID v4 format)
SYNC_KEY="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
MERGE_KEY="b2c3d4e5-f6g7-48h9-i0j1-k2l3m4n5o6p7"
UPDATE_KEY="c3d4e5f6-g7h8-49i0-j1k2-l3m4n5o6p7q8"

################################################################################
# Test 1: Cart Sync with Idempotency
################################################################################

echo "Test 1: Cart Sync with Idempotency"
echo "-----------------------------------"
echo "Sending cart sync request with idempotency key..."
echo ""

# First request
echo "Request 1 (First time):"
curl -X POST "${BASE_URL}/cart/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "{
    \"items\": [
      {
        \"variantId\": 123,
        \"quantity\": 2,
        \"priceAtAdd\": 125000,
        \"addedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"
      }
    ],
    \"clientVersion\": 5,
    \"clientTimestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
    \"idempotencyKey\": \"${SYNC_KEY}\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "(X-Idempotent-Replay|HTTP Status)"

echo ""
echo "Waiting 2 seconds..."
sleep 2
echo ""

# Second request with SAME idempotency key
echo "Request 2 (Same idempotency key - should return cached):"
curl -X POST "${BASE_URL}/cart/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "{
    \"items\": [
      {
        \"variantId\": 123,
        \"quantity\": 2,
        \"priceAtAdd\": 125000,
        \"addedAt\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"
      }
    ],
    \"clientVersion\": 5,
    \"clientTimestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\",
    \"idempotencyKey\": \"${SYNC_KEY}\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "(X-Idempotent-Replay|HTTP Status)"

echo ""
echo "✅ Expected: Second request has 'X-Idempotent-Replay: true' header"
echo ""
echo "========================================"
echo ""

################################################################################
# Test 2: Idempotent PUT Update
################################################################################

echo "Test 2: Idempotent PUT Update"
echo "------------------------------"
echo "Testing PUT /cart/item/:itemId with absolute quantity..."
echo ""

# First PUT request
echo "Request 1 (Set quantity to 5):"
curl -X PUT "${BASE_URL}/cart/item/789" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "X-Idempotency-Key: ${UPDATE_KEY}" \
  -d "{
    \"quantity\": 5
  }" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "Waiting 2 seconds..."
sleep 2
echo ""

# Second PUT request with SAME idempotency key
echo "Request 2 (Same idempotency key - quantity should STILL be 5, not 10):"
curl -X PUT "${BASE_URL}/cart/item/789" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "X-Idempotency-Key: ${UPDATE_KEY}" \
  -d "{
    \"quantity\": 5
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "(X-Idempotent-Replay|quantity|HTTP Status)"

echo ""
echo "✅ Expected: Quantity is 5 (not 10), with 'X-Idempotent-Replay: true'"
echo ""
echo "========================================"
echo ""

################################################################################
# Test 3: Cart Merge with Idempotency
################################################################################

echo "Test 3: Cart Merge with Idempotency"
echo "------------------------------------"
echo "Testing POST /cart/merge with guest session..."
echo ""

# First merge request
echo "Request 1 (Merge guest cart):"
curl -X POST "${BASE_URL}/cart/merge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "{
    \"guestSessionId\": \"550e8400-e29b-41d4-a716-446655440000\",
    \"userId\": 789,
    \"strategy\": \"combine\",
    \"idempotencyKey\": \"${MERGE_KEY}\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "Waiting 2 seconds..."
sleep 2
echo ""

# Second merge request with SAME idempotency key
echo "Request 2 (Same idempotency key - should return cached, no double-merge):"
curl -X POST "${BASE_URL}/cart/merge" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -d "{
    \"guestSessionId\": \"550e8400-e29b-41d4-a716-446655440000\",
    \"userId\": 789,
    \"strategy\": \"combine\",
    \"idempotencyKey\": \"${MERGE_KEY}\"
  }" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v 2>&1 | grep -E "(X-Idempotent-Replay|HTTP Status)"

echo ""
echo "✅ Expected: Second request has 'X-Idempotent-Replay: true' (no double-merge)"
echo ""
echo "========================================"
echo ""

################################################################################
# Summary
################################################################################

echo ""
echo "========================================"
echo "TESTING COMPLETE"
echo "========================================"
echo ""
echo "To use this script:"
echo "1. Start the backend: npm run start:dev"
echo "2. Get a valid JWT token (login via /auth/login)"
echo "3. Replace AUTH_TOKEN variable in this script"
echo "4. Run: bash test-idempotency.sh"
echo ""
echo "Expected Results:"
echo "- First requests: Process normally"
echo "- Second requests: Return cached (X-Idempotent-Replay: true)"
echo "- PUT requests: Absolute quantity (not incremental)"
echo ""
echo "Documentation:"
echo "- Usage Guide: docs/IDEMPOTENCY_GUIDE.md"
echo "- Implementation Summary: docs/PHASE_5.2_IMPLEMENTATION_SUMMARY.md"
echo "- Swagger UI: http://localhost:3000/api"
echo ""
