#!/bin/bash
#
# Enhanced Admin Analytics - Implementation Verification Script
# Version: 2.0.0
# Date: 2026-01-22
#
# Usage: ./verify-implementation.sh
#

echo "=========================================="
echo "Enhanced Analytics Implementation Checker"
echo "=========================================="
echo ""

BACKEND_DIR="/Users/macbookpro/WebstormProjects/ecommerce-SouqSyria/worktrees/admin/apps/backend"
ADMIN_DASHBOARD_DIR="$BACKEND_DIR/src/admin-dashboard"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUCCESS=0
WARNINGS=0
ERRORS=0

check_file() {
  local file=$1
  local description=$2
  
  if [ -f "$file" ]; then
    local lines=$(wc -l < "$file" | tr -d ' ')
    echo -e "${GREEN}✓${NC} $description (${lines} lines)"
    ((SUCCESS++))
  else
    echo -e "${RED}✗${NC} $description - FILE NOT FOUND"
    ((ERRORS++))
  fi
}

check_content() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if [ -f "$file" ]; then
    if grep -q "$pattern" "$file"; then
      echo -e "${GREEN}✓${NC} $description"
      ((SUCCESS++))
    else
      echo -e "${RED}✗${NC} $description - PATTERN NOT FOUND"
      ((ERRORS++))
    fi
  else
    echo -e "${RED}✗${NC} $description - FILE NOT FOUND"
    ((ERRORS++))
  fi
}

check_warning() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if [ -f "$file" ]; then
    if grep -q "$pattern" "$file"; then
      echo -e "${YELLOW}⚠${NC} $description"
      ((WARNINGS++))
    fi
  fi
}

echo "1. Checking Core Files..."
echo "-------------------------"
check_file "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "Enhanced Controller"
check_file "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "Enhanced Service"
check_file "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "Enhanced DTOs"
check_file "$ADMIN_DASHBOARD_DIR/ENHANCED_ANALYTICS_INTEGRATION.md" "Integration Guide"
check_file "$ADMIN_DASHBOARD_DIR/IMPLEMENTATION_SUMMARY.md" "Implementation Summary"
echo ""

echo "2. Checking Controller Implementation..."
echo "-----------------------------------------"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "getEnhancedSummary" "Enhanced Summary Endpoint"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "getCLVSummary" "CLV Summary Endpoint"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "getFunnelOverview" "Funnel Overview Endpoint"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "getAbandonmentRate" "Abandonment Rate Endpoint"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "getRetentionCohorts" "Cohort Retention Endpoint"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "@Throttle" "Rate Limiting"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "@ApiOperation" "Swagger Documentation"
echo ""

echo "3. Checking Service Implementation..."
echo "--------------------------------------"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "CLVCalculationService" "CLV Service Integration"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "ConversionFunnelService" "Funnel Service Integration"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "CohortAnalysisService" "Cohort Service Integration"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "CartAbandonmentService" "Abandonment Service Integration"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "DashboardCacheService" "Cache Service Integration"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "getOrSet" "Cache Strategy"
echo ""

echo "4. Checking DTO Implementation..."
echo "----------------------------------"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "EnhancedDashboardSummaryDto" "Enhanced Summary DTO"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "CLVSummaryResponseDto" "CLV Summary DTO"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "FunnelOverviewResponseDto" "Funnel Overview DTO"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "AbandonmentRateResponseDto" "Abandonment Rate DTO"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "CohortRetentionResponseDto" "Cohort Retention DTO"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "@ApiProperty" "Swagger Annotations"
check_content "$ADMIN_DASHBOARD_DIR/dto/bi-analytics-enhanced.dto.ts" "@IsEnum" "Validation Decorators"
echo ""

echo "5. Checking Module Integration..."
echo "----------------------------------"
check_content "$ADMIN_DASHBOARD_DIR/admin-dashboard.module.ts" "AdminAnalyticsEnhancedController" "Controller Registration"
check_content "$ADMIN_DASHBOARD_DIR/admin-dashboard.module.ts" "AdminAnalyticsEnhancedService" "Service Registration"
check_content "$ADMIN_DASHBOARD_DIR/admin-dashboard.module.ts" "BusinessIntelligenceModule" "BI Module Import"
echo ""

echo "6. Checking Cache Enhancements..."
echo "----------------------------------"
check_content "$ADMIN_DASHBOARD_DIR/services/dashboard-cache.service.ts" "onCLVRecalculated" "CLV Cache Invalidation"
check_content "$ADMIN_DASHBOARD_DIR/services/dashboard-cache.service.ts" "onSessionChange" "Session Cache Invalidation"
check_content "$ADMIN_DASHBOARD_DIR/services/dashboard-cache.service.ts" "onCartAbandonmentChange" "Abandonment Cache Invalidation"
check_content "$ADMIN_DASHBOARD_DIR/services/dashboard-cache.service.ts" "clearBICaches" "BI Cache Clear Method"
echo ""

echo "7. Checking Documentation..."
echo "-----------------------------"
check_content "$ADMIN_DASHBOARD_DIR/ENHANCED_ANALYTICS_INTEGRATION.md" "Quick Start Examples" "Example Requests"
check_content "$ADMIN_DASHBOARD_DIR/ENHANCED_ANALYTICS_INTEGRATION.md" "Performance Characteristics" "Performance Docs"
check_content "$ADMIN_DASHBOARD_DIR/ENHANCED_ANALYTICS_INTEGRATION.md" "Troubleshooting Guide" "Troubleshooting Section"
check_content "$ADMIN_DASHBOARD_DIR/IMPLEMENTATION_SUMMARY.md" "Syrian Market Context" "Market Context"
echo ""

echo "8. Checking Best Practices..."
echo "------------------------------"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "@UseGuards(JwtAuthGuard" "JWT Authentication"
check_content "$ADMIN_DASHBOARD_DIR/controllers/admin-analytics-enhanced.controller.ts" "@Roles('owner', 'admin')" "Role-Based Access"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "Logger" "Logging Implementation"
check_content "$ADMIN_DASHBOARD_DIR/services/admin-analytics-enhanced.service.ts" "try {" "Error Handling"
echo ""

echo "9. TypeScript Compilation Check..."
echo "------------------------------------"
if command -v tsc &> /dev/null; then
  cd "$BACKEND_DIR" && npx tsc --noEmit --skipLibCheck 2>&1 | grep -i "error" > /dev/null
  if [ $? -eq 0 ]; then
    echo -e "${RED}✗${NC} TypeScript compilation has errors"
    ((ERRORS++))
  else
    echo -e "${GREEN}✓${NC} TypeScript compilation successful"
    ((SUCCESS++))
  fi
else
  echo -e "${YELLOW}⚠${NC} TypeScript compiler not found - skipping"
  ((WARNINGS++))
fi
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo -e "${GREEN}Successes: $SUCCESS${NC}"
echo -e "${YELLOW}Warnings:  $WARNINGS${NC}"
echo -e "${RED}Errors:    $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✓ Implementation verification PASSED${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Run: npm run build"
  echo "2. Run: npm run test"
  echo "3. Start server: npm run start:dev"
  echo "4. Test endpoints at: http://localhost:3000/api/docs"
  exit 0
else
  echo -e "${RED}✗ Implementation verification FAILED${NC}"
  echo ""
  echo "Please fix the errors above before proceeding."
  exit 1
fi
