#!/bin/bash

# =============================================================================
# SouqSyria OAuth Implementation - Automated Test Suite
# =============================================================================

echo "🧪 SouqSyria E2E Test Suite"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Function to print test result
print_result() {
    local test_name=$1
    local result=$2
    local message=$3

    TESTS_TOTAL=$((TESTS_TOTAL + 1))

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name: ${GREEN}PASS${NC}"
        [ -n "$message" ] && echo "  └─ $message"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    elif [ "$result" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name: ${RED}FAIL${NC}"
        [ -n "$message" ] && echo "  └─ $message"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    elif [ "$result" = "SKIP" ]; then
        echo -e "${YELLOW}⊘${NC} $test_name: ${YELLOW}SKIPPED${NC}"
        [ -n "$message" ] && echo "  └─ $message"
    else
        echo -e "${BLUE}ℹ${NC} $test_name: ${BLUE}INFO${NC}"
        [ -n "$message" ] && echo "  └─ $message"
    fi
    echo ""
}

# =============================================================================
# PRE-FLIGHT CHECKS
# =============================================================================

echo "📋 Pre-Flight Checks"
echo "--------------------"

# Check if MySQL is running
if pgrep -x "mysqld" > /dev/null; then
    print_result "MySQL Process" "PASS" "MySQL is running"
else
    print_result "MySQL Process" "FAIL" "MySQL is not running. Start with: brew services start mysql"
fi

# Check if backend directory exists
if [ -d "apps/backend" ]; then
    print_result "Backend Directory" "PASS" "Backend directory found"
else
    print_result "Backend Directory" "FAIL" "Backend directory not found"
    exit 1
fi

# Check if frontend directory exists
if [ -d "apps/frontend" ]; then
    print_result "Frontend Directory" "PASS" "Frontend directory found"
else
    print_result "Frontend Directory" "FAIL" "Frontend directory not found"
    exit 1
fi

# Check if node_modules exist in backend
if [ -d "souqsyria-backend/node_modules" ]; then
    print_result "Backend Dependencies" "PASS" "Dependencies installed"
else
    print_result "Backend Dependencies" "FAIL" "Run: cd souqsyria-backend && npm install"
fi

# Check if node_modules exist in frontend
if [ -d "souqsyria-angular-enterprise/node_modules" ]; then
    print_result "Frontend Dependencies" "PASS" "Dependencies installed"
else
    print_result "Frontend Dependencies" "FAIL" "Run: cd souqsyria-angular-enterprise && npm install"
fi

# =============================================================================
# BACKEND TESTS
# =============================================================================

echo "🔧 Backend Tests"
echo "----------------"

# Check if backend is running
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health 2>/dev/null || echo "000")

if [ "$BACKEND_HEALTH" = "200" ]; then
    print_result "Backend Server" "PASS" "Backend is running on port 3001"
elif [ "$BACKEND_HEALTH" = "000" ]; then
    print_result "Backend Server" "FAIL" "Backend is not running. Start with: cd souqsyria-backend && npm run start:dev"
else
    print_result "Backend Server" "FAIL" "Backend returned status: $BACKEND_HEALTH"
fi

# Check OAuth endpoints
if [ "$BACKEND_HEALTH" = "200" ]; then
    # Test Google OAuth endpoint (should redirect or return error)
    GOOGLE_OAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/google 2>/dev/null || echo "000")
    if [ "$GOOGLE_OAUTH_STATUS" = "302" ] || [ "$GOOGLE_OAUTH_STATUS" = "500" ]; then
        print_result "Google OAuth Endpoint" "PASS" "Endpoint accessible (status: $GOOGLE_OAUTH_STATUS)"
    else
        print_result "Google OAuth Endpoint" "FAIL" "Unexpected status: $GOOGLE_OAUTH_STATUS"
    fi

    # Test Facebook OAuth endpoint
    FACEBOOK_OAUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/auth/facebook 2>/dev/null || echo "000")
    if [ "$FACEBOOK_OAUTH_STATUS" = "302" ] || [ "$FACEBOOK_OAUTH_STATUS" = "500" ]; then
        print_result "Facebook OAuth Endpoint" "PASS" "Endpoint accessible (status: $FACEBOOK_OAUTH_STATUS)"
    else
        print_result "Facebook OAuth Endpoint" "FAIL" "Unexpected status: $FACEBOOK_OAUTH_STATUS"
    fi
else
    print_result "OAuth Endpoints" "SKIP" "Backend not running"
fi

# =============================================================================
# DATABASE TESTS
# =============================================================================

echo "💾 Database Tests"
echo "-----------------"

# Check if database exists
DB_EXISTS=$(mysql -u root -p123456789 -e "USE souqsyria; SELECT 1;" 2>/dev/null && echo "YES" || echo "NO")

if [ "$DB_EXISTS" = "YES" ]; then
    print_result "Database Connection" "PASS" "Connected to souqsyria database"

    # Check if users table has OAuth columns
    GOOGLE_ID_COLUMN=$(mysql -u root -p123456789 souqsyria -e "DESCRIBE users;" 2>/dev/null | grep "google_id" || echo "NO")
    if [ "$GOOGLE_ID_COLUMN" != "NO" ]; then
        print_result "OAuth Schema - google_id" "PASS" "Column exists"
    else
        print_result "OAuth Schema - google_id" "FAIL" "Column missing. Run migration."
    fi

    FACEBOOK_ID_COLUMN=$(mysql -u root -p123456789 souqsyria -e "DESCRIBE users;" 2>/dev/null | grep "facebook_id" || echo "NO")
    if [ "$FACEBOOK_ID_COLUMN" != "NO" ]; then
        print_result "OAuth Schema - facebook_id" "PASS" "Column exists"
    else
        print_result "OAuth Schema - facebook_id" "FAIL" "Column missing. Run migration."
    fi

    # Check if refresh_tokens table exists
    REFRESH_TABLE=$(mysql -u root -p123456789 souqsyria -e "SHOW TABLES LIKE 'refresh_tokens';" 2>/dev/null | grep "refresh_tokens" || echo "NO")
    if [ "$REFRESH_TABLE" != "NO" ]; then
        print_result "RefreshToken Table" "PASS" "Table exists"
    else
        print_result "RefreshToken Table" "FAIL" "Table missing. Run migration."
    fi
else
    print_result "Database Connection" "FAIL" "Cannot connect to database"
fi

# =============================================================================
# FRONTEND TESTS
# =============================================================================

echo "🎨 Frontend Tests"
echo "-----------------"

# Check if frontend is running
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4200 2>/dev/null || echo "000")

if [ "$FRONTEND_STATUS" = "200" ]; then
    print_result "Frontend Server" "PASS" "Frontend is running on port 4200"

    # Check if login page is accessible
    LOGIN_PAGE=$(curl -s http://localhost:4200/auth/login 2>/dev/null | grep -o "login" | head -1)
    if [ -n "$LOGIN_PAGE" ]; then
        print_result "Login Page" "PASS" "Login page accessible"
    else
        print_result "Login Page" "FAIL" "Login page not found"
    fi

    # Check if register page is accessible
    REGISTER_PAGE=$(curl -s http://localhost:4200/auth/register 2>/dev/null | grep -o "register" | head -1)
    if [ -n "$REGISTER_PAGE" ]; then
        print_result "Register Page" "PASS" "Register page accessible"
    else
        print_result "Register Page" "FAIL" "Register page not found"
    fi
else
    print_result "Frontend Server" "FAIL" "Frontend is not running. Start with: cd souqsyria-angular-enterprise && npm start"
    print_result "Login Page" "SKIP" "Frontend not running"
    print_result "Register Page" "SKIP" "Frontend not running"
fi

# =============================================================================
# CONFIGURATION TESTS
# =============================================================================

echo "⚙️  Configuration Tests"
echo "-----------------------"

# Check if OAuth credentials are configured
GOOGLE_CLIENT_ID=$(grep "GOOGLE_CLIENT_ID=" souqsyria-backend/.env | cut -d'=' -f2)
if [ "$GOOGLE_CLIENT_ID" != "your_google_client_id_from_console" ]; then
    print_result "Google OAuth Credentials" "PASS" "Credentials configured"
else
    print_result "Google OAuth Credentials" "FAIL" "Using placeholder values. Follow OAUTH_SETUP_GUIDE.md"
fi

FACEBOOK_APP_ID=$(grep "FACEBOOK_APP_ID=" souqsyria-backend/.env | cut -d'=' -f2)
if [ "$FACEBOOK_APP_ID" != "your_facebook_app_id_from_developers" ]; then
    print_result "Facebook OAuth Credentials" "PASS" "Credentials configured"
else
    print_result "Facebook OAuth Credentials" "FAIL" "Using placeholder values. Follow OAUTH_SETUP_GUIDE.md"
fi

SMTP_USER=$(grep "SMTP_USER=" souqsyria-backend/.env | cut -d'=' -f2)
if [ "$SMTP_USER" != "your_email@gmail.com" ]; then
    print_result "Email Service" "PASS" "Email configured"
else
    print_result "Email Service" "FAIL" "Using placeholder values. Follow OAUTH_SETUP_GUIDE.md"
fi

# =============================================================================
# API TESTS (if backend is running)
# =============================================================================

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo "🔌 API Tests"
    echo "------------"

    # Test user registration endpoint
    REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test-'$(date +%s)'@souqsyria.com",
            "password": "SecurePass123!",
            "fullName": "Test User",
            "phone": "+963912345678"
        }' 2>/dev/null)

    if echo "$REGISTER_RESPONSE" | grep -q "accessToken"; then
        print_result "Registration API" "PASS" "User registration works, returns JWT tokens"
    elif echo "$REGISTER_RESPONSE" | grep -q "error"; then
        ERROR_MSG=$(echo "$REGISTER_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d':' -f2- | tr -d '"')
        print_result "Registration API" "FAIL" "Error: $ERROR_MSG"
    else
        print_result "Registration API" "FAIL" "Unexpected response"
    fi
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo "═══════════════════════════════════════════════════════════"
echo "📊 Test Summary"
echo "═══════════════════════════════════════════════════════════"
echo -e "Total Tests: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed:      ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:      ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "🎉 Your OAuth implementation is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Open browser: http://localhost:4200/auth/login"
    echo "2. Try email registration (auto-login should work)"
    echo "3. Try OAuth buttons (will fail without real credentials)"
    echo "4. Follow OAUTH_SETUP_GUIDE.md to configure OAuth"
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo ""
    echo "Common fixes:"
    echo "1. Start MySQL: brew services start mysql"
    echo "2. Start backend: cd souqsyria-backend && npm run start:dev"
    echo "3. Start frontend: cd souqsyria-angular-enterprise && npm start"
    echo "4. Run migrations: cd souqsyria-backend && npm run migration:run"
    echo "5. Configure OAuth: Follow OAUTH_SETUP_GUIDE.md"
fi

echo ""
echo "📚 Documentation:"
echo "   - E2E Test Plan: E2E_TEST_PLAN.md"
echo "   - OAuth Setup: OAUTH_SETUP_GUIDE.md"
echo "   - Implementation: IMPLEMENTATION_COMPLETE.md"
echo ""
