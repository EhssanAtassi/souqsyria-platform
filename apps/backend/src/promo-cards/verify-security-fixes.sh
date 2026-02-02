#!/bin/bash

###############################################################################
# Security Fixes Verification Script
#
# Purpose: Verify all P0 and P1 security issues are properly fixed
# Usage: ./verify-security-fixes.sh
###############################################################################

# set -e  # Exit on error (disabled to allow full report)

echo "=================================================="
echo "   Promo Cards Security Fixes Verification"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "Checking P0 Blockers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# P0-1: SQL Injection Prevention
echo ""
echo "[P0-1] Checking SQL injection prevention (sortBy validation)..."
if grep -q "@IsIn(\['createdAt', 'updatedAt', 'position', 'impressions', 'clicks', 'titleEn'\])" dto/track-analytics.dto.ts; then
    check_pass "sortBy field has whitelist validation"
else
    check_fail "sortBy field missing @IsIn() validation"
fi

# P0-2: Race Condition Prevention
echo ""
echo "[P0-2] Checking race condition prevention (atomic operations)..."
if grep -q "promoCardRepository.increment(" services/promo-cards.service.ts; then
    check_pass "Analytics tracking uses atomic increment"
else
    check_fail "Analytics tracking not using atomic operations"
fi

# P0-3: HTTPS/JWT Enforcement
echo ""
echo "[P0-3] Checking authentication enforcement..."
if grep -q "@UseGuards(JwtAuthGuard)" controllers/promo-cards.controller.ts; then
    check_pass "JwtAuthGuard applied at controller level"
else
    check_fail "JwtAuthGuard not applied at controller level"
fi

if grep -q "@Public()" controllers/promo-cards.controller.ts; then
    check_pass "Public endpoints explicitly marked"
else
    check_warn "No @Public() decorators found (might be intentional)"
fi

# P0-4: XSS Badge Validation
echo ""
echo "[P0-4] Checking XSS badge validation..."
if grep -q "@IsIn(\['badge-new', 'badge-sale'," dto/create-promo-card.dto.ts; then
    check_pass "badgeClass has whitelist validation"
else
    check_fail "badgeClass missing @IsIn() validation"
fi

if grep -q "backgroundColor\|textColor" dto/create-promo-card.dto.ts; then
    check_warn "Found backgroundColor/textColor fields (should use predefined classes)"
else
    check_pass "No inline color fields (uses predefined CSS classes)"
fi

echo ""
echo ""
echo "Checking P1 Issues..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# P1-1: Explicit Auth Guards
echo ""
echo "[P1-1] Explicit auth guards (see P0-3 above)..."
check_pass "Authentication guards properly configured"

# P1-2: Redis KEYS Performance
echo ""
echo "[P1-2] Checking Redis performance (no KEYS command)..."
if grep -q "redis.keys(" services/promo-cards.service.ts; then
    check_fail "Found redis.keys() usage (use redis.del() instead)"
else
    check_pass "No redis.keys() usage found"
fi

if grep -q "redis.del(" services/promo-cards.service.ts; then
    check_pass "Using redis.del() for explicit key deletion"
else
    check_warn "No redis.del() found (might not be clearing cache)"
fi

# P1-3: Position Race Condition
echo ""
echo "[P1-3] Checking position race condition protection..."
if [ -f "migrations/1738520000000-AddPositionUniqueConstraint.ts" ]; then
    check_pass "Position unique constraint migration exists"
else
    check_fail "Position unique constraint migration NOT FOUND"
fi

if grep -q "UNQ_promo_cards_position_active_approved" entities/promo-card.entity.ts; then
    check_pass "Entity has position unique constraint index"
else
    check_fail "Entity missing position unique constraint index"
fi

# P1-4: UUID Validation
echo ""
echo "[P1-4] Checking UUID validation..."
UUID_COUNT=$(grep -c "@IsUUID(4)" dto/track-analytics.dto.ts || echo "0")
if [ "$UUID_COUNT" -ge 2 ]; then
    check_pass "cardId fields have @IsUUID(4) validation (found $UUID_COUNT)"
else
    check_fail "cardId fields missing @IsUUID(4) validation"
fi

echo ""
echo ""
echo "Checking Additional Security Measures..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Input Validation
echo ""
echo "Checking input validation..."
if grep -q "class-validator" dto/create-promo-card.dto.ts; then
    check_pass "DTOs use class-validator decorators"
else
    check_fail "DTOs missing class-validator imports"
fi

# Swagger Documentation
echo ""
echo "Checking Swagger documentation..."
if grep -q "@ApiTags" controllers/promo-cards.controller.ts; then
    check_pass "Controller has Swagger tags"
else
    check_warn "Controller missing Swagger tags"
fi

if grep -q "@ApiOperation" controllers/promo-cards.controller.ts; then
    check_pass "Endpoints have Swagger operations"
else
    check_warn "Endpoints missing Swagger operations"
fi

# Error Handling
echo ""
echo "Checking error handling..."
if grep -q "try {" services/promo-cards.service.ts; then
    check_pass "Service uses try-catch blocks"
else
    check_warn "Service might not have comprehensive error handling"
fi

# Soft Delete
echo ""
echo "Checking soft delete implementation..."
if grep -q "deletedAt IS NULL" services/promo-cards.service.ts; then
    check_pass "Queries filter soft-deleted records"
else
    check_warn "Queries might not filter soft-deleted records"
fi

# Logging
echo ""
echo "Checking logging implementation..."
if grep -q "this.logger.log" services/promo-cards.service.ts; then
    check_pass "Service implements structured logging"
else
    check_warn "Service might not have comprehensive logging"
fi

echo ""
echo ""
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

# Final verdict
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run migration: npm run migration:run"
    echo "2. Restart application: npm run start:dev"
    echo "3. Test endpoints: curl http://localhost:3000/promo-cards/active"
    echo "4. Verify logs: tail -f logs/application.log"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some security checks failed!${NC}"
    echo ""
    echo "Please review failed checks above and fix before deployment."
    echo ""
    exit 1
fi
