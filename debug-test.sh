#!/bin/bash
# debug-test.sh - Test script to debug album artist sorting

# Rebuild the project
echo "Rebuilding project..."
npm run rebuild

# Run the sort with album-artist pattern
echo "Testing album-artist sorting with debug..."
./music-sorter.sh sort --pattern album-artist
