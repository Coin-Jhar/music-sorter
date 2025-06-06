#!/bin/bash
# improved-run-all-tests.sh - Run all music sorter tests

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
RESET="\033[0m"

print_separator() {
  echo -e "${BLUE}=======================================================${RESET}"
}

print_header() {
  print_separator
  echo -e "${BLUE}== $1 ${RESET}"
  print_separator
}

print_success() {
  echo -e "${GREEN}✓ $1${RESET}"
}

print_error() {
  echo -e "${RED}✗ $1${RESET}"
}

# Ensure test directories exist
mkdir -p ./test-logs

# Start time
start_time=$(date +%s)

# Ensure dependencies are installed
if [ ! -d node_modules ] || [ pnpm-lock.yaml -nt node_modules ]; then
  echo -e "${YELLOW}Installing dependencies...${RESET}"
  pnpm install --frozen-lockfile
  if [ $? -ne 0 ]; then
    print_error "Dependency installation failed."
    exit 1
  fi
fi

print_header "Music Sorter Test Suite"
echo -e "${YELLOW}Building the project...${RESET}"

# Rebuild the project
pnpm run rebuild

if [ $? -ne 0 ]; then
  print_error "Build failed. Cannot run tests."
  exit 1
fi

print_success "Build successful"
echo ""

# Run unit tests
print_header "Running Unit Tests"
npx ts-node src/tests/test-suite.ts 2> ./test-logs/unit-tests-errors.log | tee ./test-logs/unit-tests.log

unit_test_result=$?
if [ $unit_test_result -eq 0 ]; then
  print_success "Unit tests passed"
else
  print_error "Unit tests failed"
  cat ./test-logs/unit-tests-errors.log
fi
echo ""

# Run integration tests
print_header "Running Integration Tests"
npx ts-node src/tests/integration-test.ts 2> ./test-logs/integration-tests-errors.log | tee ./test-logs/integration-tests.log

integration_test_result=$?
if [ $integration_test_result -eq 0 ]; then
  print_success "Integration tests passed"
else
  print_error "Integration tests failed"
  cat ./test-logs/integration-tests-errors.log
fi
echo ""

# End time
end_time=$(date +%s)
duration=$((end_time - start_time))

# Test summary
print_header "Test Summary"
echo -e "Unit Tests: $([ $unit_test_result -eq 0 ] && echo -e "${GREEN}PASS${RESET}" || echo -e "${RED}FAIL${RESET}")"
echo -e "Integration Tests: $([ $integration_test_result -eq 0 ] && echo -e "${GREEN}PASS${RESET}" || echo -e "${RED}FAIL${RESET}")"
echo -e "Total Duration: ${CYAN}${duration} seconds${RESET}"
echo -e "Log Files: ${CYAN}./test-logs/${RESET}"
print_separator

# Final result
if [ $unit_test_result -eq 0 ] && [ $integration_test_result -eq 0 ]; then
  print_success "All tests passed!"
  exit 0
else
  print_error "Some tests failed. Check the logs for details."
  exit 1
fi
