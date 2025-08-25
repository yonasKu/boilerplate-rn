#!/bin/bash

# Sproutbook Backend Test Suite
# Run this script to test all functions

set -e

echo "🧪 Sproutbook Backend Test Suite"
echo "================================"

# Configuration
BASE_URL="http://localhost:5001/sproutbook-d0c8f/us-central1"
EMULATOR_UI="http://localhost:4000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoints
test_endpoint() {
    local endpoint=$1
    local data=$2
    local description=$3
    local expect_success=${4:-true}
    
    echo -e "${YELLOW}Testing: $description${NC}"
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data" 2>/dev/null || echo "HTTP_STATUS:000")
    
    body=$(echo "$response" | sed '$d')
    http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d':' -f2)
    
    if [[ $http_code == "200" ]] || [[ $http_code == "201" ]]; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $http_code)"
        echo "Response: $body"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Function to check service availability
check_service() {
    local service=$1
    local port=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅ $service is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service is not running on port $port${NC}"
        return 1
    fi
}

# Wait for services to be ready
wait_for_service() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}Waiting for $service...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if nc -z localhost $port 2>/dev/null; then
            echo -e "${GREEN}✅ $service is ready${NC}"
            return 0
        fi
        echo -n "."
        sleep 1
        ((attempt++))
    done
    
    echo -e "${RED}❌ $service failed to start${NC}"
    return 1
}

# Setup test data
setup_test_data() {
    echo -e "${BLUE}Setting up test data...${NC}"
    
    # Create test user
    curl -s -X POST "$EMULATOR_UI/firestore/data/users/test-user-123" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "test@example.com",
            "displayName": "Test User",
            "createdAt": {"@type": "timestamp", "value": "2024-01-01T00:00:00Z"},
            "notificationPreferences": {
                "dailyReminders": true,
                "weeklyRecaps": true,
                "monthlyRecaps": true
            }
        }' > /dev/null 2>&1 || true
    
    # Create test journal entries
    for i in {1..5}; do
        curl -s -X POST "$EMULATOR_UI/firestore/data/journalEntries" \
            -H "Content-Type: application/json" \
            -d "{
                \"userId\": \"test-user-123\",
                \"childId\": \"test-child-456\",
                \"content\": \"Test journal entry $i\",
                \"date\": {\"@type\": \"timestamp\", \"value\": \"2024-01-0${i}T10:00:00Z\"},
                \"isMilestone\": $([ $i -eq 1 ] && echo "true" || echo "false"),
                \"isFavorited\": $([ $i -eq 2 ] && echo "true" || echo "false"),
                \"createdAt\": {\"@type\": \"timestamp\", \"value\": \"2024-01-0${i}T10:00:00Z\"}
            }" > /dev/null 2>&1 || true
    done
    
    echo -e "${GREEN}✅ Test data setup complete${NC}"
}

# Main test execution
main() {
    echo "🚀 Starting Sproutbook Backend Tests..."
    echo "====================================="
    
    # Check if emulators are running
    echo -e "${BLUE}Checking services...${NC}"
    
    if ! check_service "Firebase Emulator UI" 4000; then
        echo -e "${RED}❌ Firebase emulators are not running${NC}"
        echo "Please start them with: npm run serve"
        exit 1
    fi
    
    wait_for_service "Functions" 5001
    wait_for_service "Firestore" 8080
    wait_for_service "Auth" 9099
    
    echo ""
    echo -e "${BLUE}Running tests...${NC}"
    echo "=================="
    
    setup_test_data
    
    # Test device management
    test_endpoint "registerDeviceToken" '{"token": "test-device-token-123", "platform": "ios"}' "Device Token Registration"
    test_endpoint "registerDeviceToken" '{"token": "test-device-token-456", "platform": "android"}' "Android Device Registration"
    
    # Test notifications
    test_endpoint "sendTestNotification" '{"token": "test-device-token-123", "title": "Test Notification", "body": "Hello from SproutBook!"}' "Test Notification"
    
    # Test recap generation
    test_endpoint "generateWeeklyRecap" '{"userId": "test-user-123", "childId": "test-child-456", "startDate": "2024-01-01", "endDate": "2024-01-07"}' "Weekly Recap Generation"
    test_endpoint "generateMonthlyRecap" '{"userId": "test-user-123", "childId": "test-child-456", "startDate": "2024-01-01", "endDate": "2024-01-31"}' "Monthly Recap Generation"
    test_endpoint "generateYearlyRecap" '{"userId": "test-user-123", "childId": "test-child-456", "startDate": "2024-01-01", "endDate": "2024-12-31"}' "Yearly Recap Generation"
    
    # Test device removal
    test_endpoint "removeDeviceToken" '{"token": "test-device-token-123"}' "Device Token Removal"
    
    # Summary
    echo ""
    echo "================================"
    echo -e "${GREEN}Tests Completed!${NC}"
    echo "Tests Passed: $TESTS_PASSED"
    echo "Tests Failed: $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! Your Sproutbook backend is working correctly.${NC}"
    else
        echo -e "${RED}❌ Some tests failed. Check the logs above.${NC}"
    fi
    
    echo ""
    echo "📊 Check detailed results at: $EMULATOR_UI"
    echo "🔍 View logs: $EMULATOR_UI/logs"
}

# Handle script arguments
case "${1:-}" in
    "setup")
        setup_test_data
        ;;
    "test")
        main
        ;;
    "status")
        echo "Checking service status..."
        check_service "Firebase Emulator UI" 4000
        check_service "Functions" 5001
        check_service "Firestore" 8080
        check_service "Auth" 9099
        ;;
    *)
        main
        ;;
esac
