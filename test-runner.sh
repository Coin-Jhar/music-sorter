#!/bin/bash
# test-runner.sh - Run music sorter tests

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}=== Music Sorter Test Runner ===${RESET}"
echo -e "${YELLOW}Building the project...${RESET}"

# Rebuild the project
npm run rebuild

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Cannot run tests.${RESET}"
  exit 1
fi

echo -e "${YELLOW}Running tests...${RESET}"

# Run the test suite
npx ts-node src/tests/test-suite.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${RESET}"
  exit 0
else
  echo -e "${RED}Tests failed. Check the logs for details.${RESET}"
  exit 1
fi
